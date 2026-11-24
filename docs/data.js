window.DEMO_DATA = {
  "version": "peafr-demo-full33-update-20261123",
  "mode": "demonstration",
  "samples": [
    {
      "id": "sample01",
      "label": "Sample 01",
      "crop": [
        117,
        43,
        181,
        107
      ],
      "candidates": [
        {
          "id": "v1",
          "name": "Direct Regression",
          "method": "Direct_Regression",
          "full": "assets/sample01/v1_full.png",
          "crop": "assets/sample01/v1_crop.png"
        },
        {
          "id": "v2",
          "name": "Flow Baseline · Euler-20",
          "method": "Flow_Baseline",
          "full": "assets/sample01/v2_full.png",
          "crop": "assets/sample01/v2_crop.png"
        },
        {
          "id": "v3",
          "name": "Full PE-AFR · Euler-20",
          "method": "PE_AFR",
          "full": "assets/sample01/v3_full.png",
          "crop": "assets/sample01/v3_crop.png"
        },
        {
          "id": "v4",
          "name": "Full PE-AFR + mild smoothing",
          "method": "PE_AFR_mild_smoothing",
          "full": "assets/sample01/v4_full.png",
          "crop": "assets/sample01/v4_crop.png"
        }
      ],
      "reference": {
        "full": "assets/sample01/reference_full.png",
        "crop": "assets/sample01/reference_crop.png"
      },
      "sourceA": {
        "full": "assets/sample01/sourceA_full.png",
        "crop": "assets/sample01/sourceA_crop.png"
      },
      "sourceB": {
        "full": "assets/sample01/sourceB_full.png",
        "crop": "assets/sample01/sourceB_crop.png"
      },
      "size": [
        256,
        256
      ]
    },
    {
      "id": "sample33",
      "label": "Sample 33",
      "crop": [
        84,
        179,
        148,
        243
      ],
      "candidates": [
        {
          "id": "v1",
          "name": "Direct Regression",
          "method": "Direct_Regression",
          "full": "assets/sample33/v1_full.png",
          "crop": "assets/sample33/v1_crop.png"
        },
        {
          "id": "v2",
          "name": "Flow Baseline · Euler-20",
          "method": "Flow_Baseline",
          "full": "assets/sample33/v2_full.png",
          "crop": "assets/sample33/v2_crop.png"
        },
        {
          "id": "v3",
          "name": "Full PE-AFR · Euler-20",
          "method": "PE_AFR",
          "full": "assets/sample33/v3_full.png",
          "crop": "assets/sample33/v3_crop.png"
        },
        {
          "id": "v4",
          "name": "Full PE-AFR + mild smoothing",
          "method": "PE_AFR_mild_smoothing",
          "full": "assets/sample33/v4_full.png",
          "crop": "assets/sample33/v4_crop.png"
        }
      ],
      "reference": {
        "full": "assets/sample33/reference_full.png",
        "crop": "assets/sample33/reference_crop.png"
      },
      "sourceA": {
        "full": "assets/sample33/sourceA_full.png",
        "crop": "assets/sample33/sourceA_crop.png"
      },
      "sourceB": {
        "full": "assets/sample33/sourceB_full.png",
        "crop": "assets/sample33/sourceB_crop.png"
      },
      "size": [
        256,
        256
      ],
      "full_update": "User-supplied latest Full output; corresponding smoothing control regenerated."
    },
    {
      "id": "sample16",
      "label": "Sample 16",
      "crop": [
        149,
        108,
        213,
        172
      ],
      "candidates": [
        {
          "id": "v1",
          "name": "Direct Regression",
          "method": "Direct_Regression",
          "full": "assets/sample16/v1_full.png",
          "crop": "assets/sample16/v1_crop.png"
        },
        {
          "id": "v2",
          "name": "Flow Baseline · Euler-20",
          "method": "Flow_Baseline",
          "full": "assets/sample16/v2_full.png",
          "crop": "assets/sample16/v2_crop.png"
        },
        {
          "id": "v3",
          "name": "Full PE-AFR · Euler-20",
          "method": "PE_AFR",
          "full": "assets/sample16/v3_full.png",
          "crop": "assets/sample16/v3_crop.png"
        },
        {
          "id": "v4",
          "name": "Full PE-AFR + mild smoothing",
          "method": "PE_AFR_mild_smoothing",
          "full": "assets/sample16/v4_full.png",
          "crop": "assets/sample16/v4_crop.png"
        }
      ],
      "reference": {
        "full": "assets/sample16/reference_full.png",
        "crop": "assets/sample16/reference_crop.png"
      },
      "sourceA": {
        "full": "assets/sample16/sourceA_full.png",
        "crop": "assets/sample16/sourceA_crop.png"
      },
      "sourceB": {
        "full": "assets/sample16/sourceB_full.png",
        "crop": "assets/sample16/sourceB_crop.png"
      },
      "size": [
        256,
        256
      ]
    }
  ],
  "smoothing": "3×3 Gaussian, sigma=0.5, symmetric padding",
  "note": "Three demonstration examples; not the complete paper comparison or formal human study."
};
