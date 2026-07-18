# Ploro AI Product Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and render a 22-second premium portrait Remotion product demo using all seven supplied Ploro AI assets.

**Architecture:** Create a fully isolated `remotion/` package with a deterministic root composition, centralized asset/timeline constants, pure animation helpers, shared visual components, and one focused component per scene. Assets are copied into the package’s public directory so rendering never depends on external paths or network resources.

**Tech Stack:** React 19, TypeScript 6, Remotion 4.0.490, Vitest, H.264 MP4.

## Global Constraints

- Keep all video code, dependencies, assets, stills, and output inside `remotion/`.
- Do not modify the production Next.js application, root `package.json`, or root `package-lock.json`.
- Render exactly 1080x1920, 30 FPS, and 660 frames.
- Use all supplied images according to the approved scene mapping.
- Preserve foreground image aspect ratios with `object-fit: contain`; do not crop important UI.
- Do not rotate images, use bounce motion, remove the logo background, add flashy transitions, or add audio.
- Use restrained camera pushes, parallax, blur dissolves, scan light, cursor motion, glow, and light sweeps.

---

### Task 1: Isolated package, assets, and deterministic contract

**Files:**
- Create: `remotion/package.json`
- Create: `remotion/tsconfig.json`
- Create: `remotion/remotion.config.ts`
- Create: `remotion/.gitignore`
- Create: `remotion/src/constants.ts`
- Create: `remotion/src/helpers/animation.ts`
- Create: `remotion/src/constants.test.ts`
- Create: `remotion/src/helpers/animation.test.ts`
- Copy: seven supplied images to `remotion/public/assets/`

**Interfaces:**
- Produces: `VIDEO`, `SCENES`, `ASSETS`, `clampedInterpolate()`, `fadeEnvelope()`, `staggeredProgress()`, and `countValue()`.

- [ ] Write tests asserting 1080x1920, 30 FPS, 660 frames, contiguous scene ranges, exact asset mapping, clamped interpolation, scene fade envelopes, stagger behavior, and numeric count interpolation.
- [ ] Install dependencies in `remotion/`, then run `npm test` and confirm the tests fail because production constants/helpers do not exist.
- [ ] Implement the constants and pure animation helpers with strict TypeScript types.
- [ ] Run `npm test` and confirm all contract/helper tests pass.
- [ ] Copy the seven readable source images into `remotion/public/assets/` without modifying them.

### Task 2: Shared visual system

**Files:**
- Create: `remotion/src/components/SceneFrame.tsx`
- Create: `remotion/src/components/ScreenshotStage.tsx`
- Create: `remotion/src/components/Typography.tsx`
- Create: `remotion/src/components/BrandLogo.tsx`
- Create: `remotion/src/components/Cursor.tsx`
- Create: `remotion/src/components/CountUp.tsx`
- Create: `remotion/src/components/LightSweep.tsx`

**Interfaces:**
- Consumes: `ASSETS`, animation helpers, and Remotion frame/config hooks.
- Produces: composable full-canvas scene framing, sharp contained screenshots, brand plate, title/caption typography, deterministic cursor clicks, count-up labels, and light sweeps.

- [ ] Implement `SceneFrame` with a near-black/navy canvas, ambient radial glows, and a clamped opacity/blur envelope.
- [ ] Implement `ScreenshotStage` with a blurred cover background copy and a sharp `contain` foreground copy inside a portrait safe area.
- [ ] Implement typography and brand components using a local system sans stack and no network font loading.
- [ ] Implement cursor, count-up, and sweep primitives using only frame-driven Remotion animation.
- [ ] Run `npm test` and `npm run typecheck`.

### Task 3: Opening, problem, floor-plan, and room-detection scenes

**Files:**
- Create: `remotion/src/scenes/LogoScene.tsx`
- Create: `remotion/src/scenes/ProblemScene.tsx`
- Create: `remotion/src/scenes/FloorPlanScene.tsx`
- Create: `remotion/src/scenes/RoomDetectionScene.tsx`

**Interfaces:**
- Consumes: shared visual components, `ASSETS`, `SCENES`, `spring()`, and `interpolate()`.
- Produces: frame-local scene components rendered within their `<Sequence>` ranges.

- [ ] Implement `LogoScene` with the supplied white logo plate, soft blue glow, and two-line restrained title entrance.
- [ ] Implement `ProblemScene` using `PloroAI7.png`, a slow push, and “Manual quoting takes hours.”
- [ ] Implement `FloorPlanScene` using `ploroai-demo1.png`, a top-to-bottom scan line, detected-room rectangles, and “Upload your floor plan.”
- [ ] Implement `RoomDetectionScene` using `ploroai-demo2.png`, staggered room labels, 86% confidence emphasis, and a cursor click inside the visible form.
- [ ] Run `npm test` and `npm run typecheck`.

### Task 4: Materials, offers, poster, and final scenes

**Files:**
- Create: `remotion/src/scenes/MaterialsScene.tsx`
- Create: `remotion/src/scenes/OffersScene.tsx`
- Create: `remotion/src/scenes/PosterScene.tsx`
- Create: `remotion/src/scenes/FinalScene.tsx`

**Interfaces:**
- Consumes: shared visual components, `ASSETS`, `SCENES`, and animation helpers.
- Produces: final four workflow/CTA scene components.

- [ ] Implement `MaterialsScene` using `ploroai-demo3.png`, sequential row emphasis, quantity counts, and increasing price values.
- [ ] Implement `OffersScene` using `ploroai-demo4.png`, a slow move toward the total, export-button emphasis, cursor click, and light sweep.
- [ ] Implement `PosterScene` using `PloroAI2.png`, a slow push, and four sequential check-mark benefits.
- [ ] Implement `FinalScene` with the supplied logo plate, glow, “Join Early Access,” `ploroai.io`, and a full fade to black.
- [ ] Run `npm test` and `npm run typecheck`.

### Task 5: Composition and render commands

**Files:**
- Create: `remotion/src/PloroDemo.tsx`
- Create: `remotion/src/Root.tsx`
- Create: `remotion/src/index.ts`

**Interfaces:**
- Consumes: all eight scene components and timeline constants.
- Produces: composition ID `PloroAIDemo`, exactly 660 frames at 1080x1920 and 30 FPS.

- [ ] Compose scenes as contiguous Remotion `<Sequence>` blocks using the exact approved frame ranges.
- [ ] Register `PloroAIDemo` with exact video metadata and no audio component.
- [ ] Add scripts: `studio`, `test`, `typecheck`, `render`, and `render:stills`.
- [ ] Run `npm test`, `npm run typecheck`, and `npx remotion compositions src/index.ts`.

### Task 6: Representative still rendering and visual QA

**Files:**
- Create: `remotion/scripts/render-stills.mjs`
- Create: `remotion/stills/*.png`

**Interfaces:**
- Produces: representative PNGs for LogoScene, FloorPlanScene, RoomDetectionScene, MaterialsScene, OffersScene, and FinalScene.

- [ ] Render frames 30, 190, 300, 405, 500, and 630 at full 1080x1920 resolution.
- [ ] Inspect every still for crop, text legibility, overlay correctness, cursor placement, and portrait safe-area issues.
- [ ] Correct visible issues with minimal scene/component edits.
- [ ] Re-run type-check and affected still renders after fixes.

### Task 7: Final render and metadata verification

**Files:**
- Create: `remotion/out/ploroai-demo.mp4`
- Create: `remotion/scripts/verify-video.mjs`

**Interfaces:**
- Consumes: the final `PloroAIDemo` composition and a local ffprobe binary.
- Produces: machine-readable confirmation of codec, resolution, FPS, duration, frame count, and audio-stream absence.

- [ ] Render with `npm run render` to `out/ploroai-demo.mp4` using H.264.
- [ ] Probe the MP4 and assert `h264`, `1080x1920`, `30/1`, `22.000000`, `660` frames, and zero audio streams.
- [ ] Record exact output size and verification results.
- [ ] Run final `npm test`, `npm run typecheck`, metadata verification, `git diff --check`, and `git status --short`.
