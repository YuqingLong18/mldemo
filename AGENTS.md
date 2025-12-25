# AGENTS.md — Interactive ML Learning Website (Supervised + “Unsupervised”)

## 0) One-sentence objective
Build a **front-end only** website that lets students *experience* supervised image classification and an unsupervised-style grouping workflow using their **webcam**, with training/inference done **on-device in the browser**.

---

## 1) Target users and usage context
- **Primary users:** middle/high school students learning AI literacy
- **Secondary users:** teachers running a live demo in class
- **Constraints:**
  - Runs on typical student laptops (no dedicated GPU assumed)
  - Works offline/limited network once loaded (future enhancement)
  - Clear, safe camera UX and data transparency

---

## 2) Core learning outcomes
Students should be able to:
1. Explain the difference between **training** and **inference**.
2. Describe supervised learning as “**labeled examples → model learns mapping → predicts labels**”.
3. Recognize why **more data**, **better labels**, and **data diversity** improve results.
4. Understand representation learning via a lightweight backbone (e.g., **MobileNet features**).
5. Experience an “unsupervised” workflow as “**unlabeled examples → algorithm groups by similarity**”.
6. Interpret simple evaluation signals (confidence, confusion, cluster separation).

---

## 3) Algorithm choices (practical + educational)

### 3.1 Supervised learning (MVP)
**Recommended approach:** Transfer learning via **feature extractor + simple classifier** in browser.

- **Backbone:** MobileNet (TFJS) as fixed feature extractor (fast, light)
- **Classifier:** one of:
  - **KNN classifier on embeddings** (very fast, intuitive, minimal training time)
  - or a tiny dense layer trained with TFJS (slower but “real training loop”)
- **Why:** avoids heavy training; students still see “training” as collecting examples and fitting a classifier.

**MVP default:** MobileNet embeddings + KNN classifier.

### 3.2 “Unsupervised learning” (MVP interpretation)

- For **unsupervised grouping**, the classic algorithm is **k-means** (or hierarchical clustering).

**Implementation recommendation:**
- Use the **same MobileNet embeddings** from webcam snapshots.
- Run **k-means** on embeddings to produce clusters.
- Provide a visualization that still teaches “nearest neighbors” intuition:
  - show each point’s nearest neighbors and distances
  - show how cluster assignments stabilize as k-means iterates

**MVP default:** MobileNet embeddings + k-means clustering + neighbor graph overlay.

---

## 4) Product scope by phases

### Phase 1 — MVP (demonstrate both workflows)
**Goal:** working demo with minimal UI, robust camera pipeline, and stable performance.

#### Supervised module (MVP)
- Webcam capture stream (WebRTC getUserMedia)
- “Create Class” → enter label name → capture N examples (e.g., 10–50)
- Live counter per label, thumbnails grid
- “Train” (for KNN classifier: build index; for dense layer: short epochs)
- “Predict” mode: live predictions + confidence + top-k
- “Reset / Export / Import session” (JSON in local storage)

#### Unsupervised module (MVP)
- Capture unlabeled examples (single pool)
- Choose **k** (number of clusters)
- Run clustering on embeddings (k-means)
- Visualize:
  - 2D projection (PCA is simplest) of points
  - color by cluster assignment
  - click a point → show its nearest neighbors (k) with distances
- Allow re-run with different k
- “Reset / Export / Import session”

#### MVP acceptance criteria
- Runs in Chrome/Edge/Safari (latest) on average laptop
- Smooth camera preview, no crashes
- Training/inference completes within seconds for ~100–300 samples
- Clear explanation panels for each step

---

### Phase 2 — Better UX and deeper interactivity
**Goal:** make the learning experience intuitive, guided, and fun.

Enhancements:
- Step-by-step guided flow (“Collect → Train → Test → Reflect”)
- Inline misconceptions and “why this matters” tooltips
- Data quality warnings:
  - class imbalance
  - low diversity
  - repeated near-duplicates
- “Stress test” features:
  - lighting changes, background changes, occlusion
- Simple evaluation:
  - per-class accuracy using a held-out set
  - confusion matrix (small)
- Model introspection:
  - show embeddings drift as more samples are added
  - show “decision boundaries” in 2D projection
- Accessibility:
  - keyboard navigation, screen-reader labels
  - colorblind-friendly palette and patterns

---

### Phase 3 — Teacher control and classroom management (future)
**Goal:** classroom-friendly orchestration and sharing.

Potential features:
- Teacher dashboard:
  - create “classroom session code”
  - lock/unlock phases (collect/train/test)
  - push challenges (e.g., “classify 3 objects”)
- Student sharing:
  - export a shareable artifact (session JSON + screenshots)
  - optional peer comparison (no personal images uploaded by default)
- Safety and governance:
  - explicit consent banner for camera
  - no server upload in default mode
  - teacher toggle to disable faces / require objects-only
- Optional backend (only if required later):
  - session roster, progress tracking, teacher analytics

---

## 5) Non-goals (to prevent scope creep)
- Training large CNNs from scratch in the browser
- High-stakes biometric identification or face recognition features
- Mandatory accounts/login in MVP
- Cloud storage by default

---

## 6) UX structure / IA (information architecture)
Top-level navigation:
- **Home**
  - What you will learn (2–3 bullets)
  - Privacy summary (“runs on your device”)
  - Start buttons: Supervised / Unsupervised
- **Supervised Lab**
  - Left: camera + capture controls
  - Right: dataset panel + training panel + predictions panel
  - Bottom: explanation steps + reflection questions
- **Unsupervised Lab**
  - Left: camera + capture pool controls
  - Right: embedding plot + cluster controls + neighbor inspector
  - Bottom: explanation steps + reflection questions
- **About / Teacher Notes**
  - suggested lesson plan
  - common pitfalls
  - device/browser tips

---

## 7) Technical architecture (front-end only)

### 7.1 Recommended stack
- **Framework:** React + Vite (or Next.js static export)
- **ML:** TensorFlow.js
  - MobileNet feature extractor (TFJS model)
  - KNN Classifier helper (either tfjs-models/knn-classifier or custom)
  - k-means implementation in JS (custom; small and explainable)
- **Camera:** WebRTC `getUserMedia`
- **State:** local component state + persisted session in `localStorage` / IndexedDB
- **Visualization:** Canvas/WebGL (e.g., PixiJS) or plain Canvas + D3 for scatterplot

### 7.2 Data flow
1. Webcam frame → resize/crop → tensor
2. Tensor → MobileNet → embedding vector
3. Store embedding + thumbnail (optional) + label (if supervised)
4. Train:
   - supervised: build KNN index (or train small head)
   - unsupervised: run k-means on embeddings
5. Inference:
   - supervised: embed live frame → predict label via classifier
   - unsupervised: embed live frame → show nearest cluster centroid / neighbors

### 7.3 Performance rules
- Use **requestAnimationFrame** throttling; don’t infer every frame (e.g., 3–10 FPS inference)
- Dispose tensors aggressively (`tf.tidy`, `tensor.dispose()`)
- Cap dataset size (configurable; e.g., 500 samples max)
- Use WebGL backend if available; fallback to WASM/CPU

---

## 8) Privacy, safety, and compliance defaults
- **Default: no uploads.** All images/embeddings remain on device.
- Clear, unskippable first-run notice:
  - what the camera is used for
  - what is stored (thumbnails optional)
  - how to delete data (Reset)
- Face-related content:
  - Provide “objects-only” classroom guidance
  - Optional toggle: “Do not store thumbnails” (store embeddings only)
- Never label features as “identity recognition”; keep as “object categories” learning demo.

---

## 9) MVP build plan (engineering tasks)

### Milestone M1 — Project skeleton
- Vite + React setup
- Route structure: `/supervised`, `/unsupervised`, `/teacher-notes`
- Shared components: CameraView, CaptureButton, DatasetPanel

### Milestone M2 — Supervised pipeline working
- MobileNet load + warmup
- Capture labeled samples (embedding + optional thumbnail)
- KNN classifier train/predict
- Live prediction panel (top-k + confidence)
- Reset / Export / Import session JSON

### Milestone M3 — Unsupervised pipeline working
- Capture unlabeled samples (embedding + optional thumbnail)
- PCA (2D) projection for plotting
- k-means clustering + rerun with different k
- Neighbor inspector (k nearest points, distances)
- Export / Import

### Milestone M4 — Basic pedagogy layer
- Explanation cards for each step
- “Try this” prompts and reflection questions
- Guardrails: dataset size limit, class imbalance warning

---

## 10) UI/interaction requirements (MVP)
- Camera permission request with fallback messaging
- Visible status indicators:
  - model loading
  - embedding extraction
  - training in progress
- Dataset thumbnails are optional; if enabled:
  - show latest 12 per class/pool, expandable
- Provide a “Demo dataset” button:
  - loads a small built-in set of example embeddings (no camera needed)

---

## 11) Testing checklist
- Browsers: Chrome, Edge, Safari (macOS), optional iPadOS Safari
- Device constraints: low-power laptop
- Failure modes:
  - camera denied
  - model fails to load
  - memory leak from tensors
  - too many samples
- Pedagogy sanity:
  - students can complete workflow in <10 minutes
  - explanations match what the UI does

---

## 12) Deliverables
- Static site build (deployable on any static host)
- README for running locally + deployment
- Teacher Notes (lesson flow + discussion prompts)
- Session export format documented:
  - versioned JSON schema
  - contains: labels, embeddings, settings, optional thumbnails

---

## 13) Open questions (resolve during implementation)
- Whether to store thumbnails by default (privacy vs usability)
- KNN vs small trainable head for supervised MVP (recommend KNN first)
- Maximum dataset size target for smooth classroom use
- Visualization library preference (Canvas vs SVG vs WebGL)

---

## 14) Definition of Done (Phase 1)
- Students can:
  1) create 2–4 labels, capture examples, train, and see live predictions
  2) capture unlabeled examples, choose k, cluster, and explore neighbors
- No data leaves device by default
- Clear UI guidance and reset controls
- Stable performance and no major memory leaks

---
