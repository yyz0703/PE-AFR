# PE-AFR: Physics-guided Energy Adaptive Flow Regularization for Multi-focus Image Fusion

![Code Status](https://img.shields.io/badge/Code-Partial_Release-blue)
![Paper Status](https://img.shields.io/badge/Paper-Under_Review-lightgrey)
![Interactive Demo](https://img.shields.io/badge/Interactive_Demo-GitHub_Pages-green)

> **Repository for PE-AFR.**
> The manuscript is currently **under review**. This repository provides the model architecture, fusion results, and an interactive visual demonstration. The complete training and testing code, together with pretrained weights, will be released upon acceptance.

---

## 1. Introduction

**PE-AFR** is a multi-focus image fusion framework that combines a learned residual velocity with explicit Push and Pull guidance during flow evolution.

<p align="center">
  <img src="docs/assets/1.png" alt="Overview of the PE-AFR framework" width="960">
</p>
<p align="center"><b>Figure 1.</b> Overview of the PE-AFR framework.</p>

---

## 2. Interactive Visual Demonstration

### [Open the Interactive Demo](https://yyz0703.github.io/PE-AFR/)

The browser-based interface presents **three representative examples** with aligned all-in-focus references and four precomputed outputs: **Direct Regression, Flow Baseline, PE-AFR, and PE-AFR with mild smoothing**.

- **Inspect images:** switch between full images and enlarged regions to examine boundaries and fine details.
- **Rank outputs:** assess boundary-transition fidelity, halo quality, and texture preservation separately, with configuration names hidden during ranking and ties permitted.
- **Export judgments:** save rankings as CSV or JSON files locally.

The demonstration uses precomputed images and does not run the model online. Judgments remain in the user's browser unless exported and are separate from the formal evaluation reported in the manuscript. Configuration identities are accessible in the public source files.

For local viewing, open `docs/index.html` in a browser.


---

## 3. Available Materials

- [Model architecture](./models/): model architecture code.
- [Fusion results](./results/): fusion results organized by dataset.
- [Demo source files](./docs/): interface source code and example images.
- [Interactive demo](https://yyz0703.github.io/PE-AFR/): open the visual evaluation interface.

---

## 4. Release Plan

- [x] Release the model architecture code.
- [x] Provide fusion results.
- [x] Provide the interactive visual demonstration interface.
- [ ] Release pretrained weights and inference code **[Upon Acceptance]**.
- [ ] Release the complete training code, preprocessing scripts, and experimental evaluation code **[Upon Acceptance]**.

The complete code and pretrained weights will be made publicly available upon acceptance.
