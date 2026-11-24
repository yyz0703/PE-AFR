import torch
import torch.nn as nn
import torch.nn.functional as F
import math
import torchvision.transforms.functional as TF

class TimeEmbedding(nn.Module):

    def __init__(self, dim):
        super().__init__()
        self.dim = dim

    def forward(self, t):
        device = t.device
        half = self.dim // 2
        emb = math.log(10000) / (half - 1)
        emb = torch.exp(torch.arange(half, device=device) * -emb)
        emb = t[:, None] * emb[None, :]
        return torch.cat([emb.sin(), emb.cos()], dim=-1)

class GuideNet(nn.Module):

    def __init__(self, in_ch=6, out_ch=1, dim=32):
        super().__init__()
        self.conv1 = nn.Sequential(nn.Conv2d(in_ch, dim, 3, padding=1), nn.SiLU())
        self.d1 = nn.Sequential(nn.Conv2d(dim, dim, 3, padding=2, dilation=2), nn.SiLU())
        self.d2 = nn.Sequential(nn.Conv2d(dim, dim, 3, padding=4, dilation=4), nn.SiLU())
        self.d3 = nn.Sequential(nn.Conv2d(dim, dim, 3, padding=8, dilation=8), nn.SiLU())
        self.fuse = nn.Sequential(nn.Conv2d(dim * 4, dim, 3, padding=1), nn.SiLU(), nn.Conv2d(dim, out_ch, 1), nn.Sigmoid())

    def forward(self, A, B):
        x = torch.cat([A, B], dim=1)
        f0 = self.conv1(x)
        f1 = self.d1(f0)
        f2 = self.d2(f1)
        f3 = self.d3(f2)
        return self.fuse(torch.cat([f0, f1, f2, f3], dim=1))

class ResnetBlock(nn.Module):

    def __init__(self, dim_in, dim_out, time_dim):
        super().__init__()
        self.mlp = nn.Sequential(nn.SiLU(), nn.Linear(time_dim, dim_out * 2))
        self.block1 = nn.Sequential(nn.GroupNorm(32, dim_in), nn.SiLU(), nn.Conv2d(dim_in, dim_out, 3, padding=1))
        self.block2 = nn.Sequential(nn.GroupNorm(32, dim_out), nn.SiLU(), nn.Conv2d(dim_out, dim_out, 3, padding=1))
        self.res = nn.Conv2d(dim_in, dim_out, 1) if dim_in != dim_out else nn.Identity()

    def forward(self, x, t_emb):
        h = self.block1(x)
        (scale, shift) = self.mlp(t_emb).chunk(2, dim=1)
        h = h * (1 + scale[..., None, None]) + shift[..., None, None]
        h = self.block2(h)
        return h + self.res(x)

class PE_AFD_UNet(nn.Module):

    def __init__(self, img_channels=3, base=64):
        super().__init__()
        time_dim = base * 4
        self.time_mlp = nn.Sequential(TimeEmbedding(base), nn.Linear(base, time_dim), nn.SiLU(), nn.Linear(time_dim, time_dim))
        self.init = nn.Conv2d(img_channels * 4, base, 3, padding=1)
        self.down1 = ResnetBlock(base, base, time_dim)
        self.down2 = ResnetBlock(base, base * 2, time_dim)
        self.down3 = ResnetBlock(base * 2, base * 4, time_dim)
        self.mid = ResnetBlock(base * 4, base * 4, time_dim)
        self.up1 = ResnetBlock(base * 8, base * 2, time_dim)
        self.up2 = ResnetBlock(base * 4, base, time_dim)
        self.out = nn.Conv2d(base, img_channels, 1)

    def forward(self, x_cond, t):
        t_emb = self.time_mlp(t)
        x_init = self.init(x_cond)
        x1 = self.down1(x_init, t_emb)
        x2 = self.down2(F.avg_pool2d(x1, 2), t_emb)
        x3 = self.down3(F.avg_pool2d(x2, 2), t_emb)
        m = self.mid(x3, t_emb)
        u1 = self.up1(torch.cat([m, x3], dim=1), t_emb)
        u1_up = F.interpolate(u1, size=x2.shape[2:], mode='bilinear', align_corners=False)
        u2 = self.up2(torch.cat([u1_up, x2], dim=1), t_emb)
        out_feat = F.interpolate(u2, size=x_init.shape[2:], mode='bilinear', align_corners=False)
        return self.out(out_feat)

class PE_AFD_System(nn.Module):

    def __init__(self, net):
        super().__init__()
        self.net = net
        self.guide_net = GuideNet()
        sobel_x = torch.tensor([[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]]).view(1, 1, 3, 3)
        sobel_y = torch.tensor([[-1.0, -2.0, -1.0], [0.0, 0.0, 0.0], [1.0, 2.0, 1.0]]).view(1, 1, 3, 3)
        self.register_buffer('sobel_x', sobel_x)
        self.register_buffer('sobel_y', sobel_y)

    def get_x0(self, A, B):
        return 0.5 * (A + B)

    def compute_boundary_normal(self, I_A, I_B):
        diff_energy = torch.abs(I_A - I_B).mean(dim=1, keepdim=True)
        gx = F.conv2d(diff_energy, self.sobel_x, padding=1)
        gy = F.conv2d(diff_energy, self.sobel_y, padding=1)
        magnitude = torch.sqrt(gx ** 2 + gy ** 2 + 1e-06)
        spatial_grad = torch.cat([gx, gy], dim=1)
        spatial_grad = F.normalize(spatial_grad, p=2, dim=1)
        n_rgb = torch.cat([spatial_grad[:, 0:1, :, :], spatial_grad[:, 1:2, :, :], (spatial_grad[:, 0:1, :, :] + spatial_grad[:, 1:2, :, :]) * 0.5], dim=1)
        normal = F.normalize(n_rgb, p=2, dim=1)
        return (magnitude, normal)

    def compute_eafr_forces(self, x_t, I_A, I_B, guide, t_view):
        (boundary_strength, n_rgb) = self.compute_boundary_normal(I_A, I_B)
        diff_energy = torch.abs(I_A - I_B).mean(dim=1, keepdim=True)
        energy_norm = diff_energy / (diff_energy.mean() + 1e-06)
        push_strength = 0.5 * boundary_strength + 0.5 * energy_norm
        push_strength = push_strength * (0.5 + guide)
        v_push_raw = push_strength * n_rgb
        anchor = guide.detach() * I_A + (1.0 - guide.detach()) * I_B
        pull_raw = anchor - x_t
        normal_component = (pull_raw * n_rgb).sum(dim=1, keepdim=True) * n_rgb
        v_pull_raw = pull_raw - normal_component
        lambda_push = 0.15 * t_view
        lambda_pull = 0.15 * (1.0 - t_view)
        v_push = lambda_push * v_push_raw
        v_pull = lambda_pull * v_pull_raw
        return (v_push, v_pull)

    def compute_loss(self, I_F, I_A, I_B, epoch=0):
        x0 = self.get_x0(I_A, I_B)
        t = torch.rand(I_A.size(0), device=I_A.device)
        t_view = t.view(-1, 1, 1, 1)
        x_t = (1 - t_view) * x0 + t_view * I_F
        v_target = I_F - x0
        x_ref = 0.5 * (I_A + I_B)
        x_cond = torch.cat([x_t - x_ref, I_A, I_B, x_ref], dim=1)
        v_res = self.net(x_cond, t)
        guide_soft = self.guide_net(I_A, I_B)
        guide = torch.sigmoid((guide_soft - 0.5) * 10)
        if epoch < 5:
            v_pred = v_res
        else:
            (v_push, v_pull) = self.compute_eafr_forces(x_t, I_A, I_B, guide, t_view)
            v_pred = v_res + v_push + v_pull
        loss_flow = F.mse_loss(v_pred, v_target)

        def gradient(x):
            dx = F.pad(x[:, :, :, :-1] - x[:, :, :, 1:], (0, 1, 0, 0))
            dy = F.pad(x[:, :, :-1, :] - x[:, :, 1:, :], (0, 0, 0, 1))
            return (dx, dy)
        x1_pred = x_t + v_pred * (1 - t_view)
        (gx_p, gy_p) = gradient(x1_pred)
        (gx_gt, gy_gt) = gradient(I_F)
        loss_grad = (gx_p - gx_gt).abs().mean() + (gy_p - gy_gt).abs().mean()
        diff_A = I_A - TF.gaussian_blur(I_A, 5)
        diff_B = I_B - TF.gaussian_blur(I_B, 5)
        energy_A = diff_A ** 2
        energy_B = diff_B ** 2
        pool_kernel = 21
        focus_A = F.avg_pool2d(energy_A, pool_kernel, stride=1, padding=pool_kernel // 2)
        focus_B = F.avg_pool2d(energy_B, pool_kernel, stride=1, padding=pool_kernel // 2)
        weight_A = focus_A / (focus_A + focus_B + 1e-06)
        weight_A = TF.gaussian_blur(weight_A, kernel_size=7, sigma=2.0)
        weight_A = weight_A.mean(dim=1, keepdim=True)
        weight_A_target = weight_A.detach()
        eps = 1e-06
        guide_soft_safe = torch.clamp(guide_soft, eps, 1.0 - eps)
        loss_guide = F.binary_cross_entropy(guide_soft_safe, weight_A_target) + 0.1 * F.l1_loss(guide_soft_safe, weight_A_target)
        total = loss_flow + 0.25 * loss_grad + 0.3 * loss_guide
        return (total, {'flow': loss_flow.item(), 'grad': loss_grad.item(), 'guide': loss_guide.item()})

    @torch.no_grad()
    def inference(self, I_A, I_B, steps=20):
        x = self.get_x0(I_A, I_B)
        x_ref = 0.5 * (I_A + I_B)
        guide_soft = self.guide_net(I_A, I_B)
        guide = torch.sigmoid((guide_soft - 0.5) * 10)
        dt = 1.0 / steps
        decision = torch.zeros_like(I_A[:, :1])
        for i in range(steps):
            t = torch.full((x.size(0),), i / steps, device=x.device)
            t_view = t.view(-1, 1, 1, 1)
            x_cond = torch.cat([x - x_ref, I_A, I_B, x_ref], dim=1)
            v_res = self.net(x_cond, t)
            (v_push, v_pull) = self.compute_eafr_forces(x, I_A, I_B, guide, t_view)
            v = v_res + v_push + v_pull
            v = torch.clamp(v, -2.0, 2.0)
            proj = (v * (I_A - I_B)).sum(dim=1, keepdim=True)
            decision += proj * dt
            x = x + v * dt
        min_src = torch.minimum(I_A, I_B)
        max_src = torch.maximum(I_A, I_B)
        fused_img = torch.clamp(x, min_src, max_src)
        return (fused_img, decision)
