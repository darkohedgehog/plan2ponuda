# Ploro AI Build Week Ending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append a five-second Codex Desktop attribution scene and matching OpenAI narration to the existing 22-second Ploro AI Remotion demo.

**Architecture:** Keep frames `0–659` and the original voiceover asset unchanged. Extend the existing composition to `810` frames, add one `CodexBuildWeekScene` sequence plus one frame-aligned narration asset, and render a dedicated 27-second H.264/AAC Build Week output.

**Tech Stack:** React 19, TypeScript 6, Remotion 4.0.490, OpenAI Audio Speech API, `gpt-4o-mini-tts`, `cedar`, bundled FFmpeg/ffprobe, Vitest.

## Global Constraints

- Preserve every existing scene, animation, transition, timing, caption, and brand treatment in frames `0–659`.
- Append exactly `150` frames for a final duration of `810` frames and `27.000` seconds.
- Use the supplied `3024x1964` Codex screenshot without cropping important interface content.
- Blur only the lower-left user-name region.
- Use the exact approved overlay copy and narration.
- Reuse model `gpt-4o-mini-tts`, voice `cedar`, and calm professional narration.
- Keep the production Next.js application and root production dependencies unchanged.
- Render `remotion/out/ploroai-demo-buildweek.mp4` with H.264 video and AAC audio.

---

### Task 1: Timeline and asset contract

**Files:**
- Modify: `remotion/src/constants.test.ts`
- Modify: `remotion/src/constants.ts`
- Copy: supplied screenshot to `remotion/public/assets/codex-buildweek.png`

**Interfaces:**
- Produces: `VIDEO.durationInFrames === 810`, scene id `codexBuildWeek` from `660` to `810`, asset key `codexBuildWeek`, and asset key `buildWeekVoiceover`.

- [ ] Update tests to expect `810` frames, scene lengths `[60, 75, 105, 120, 90, 90, 60, 60, 150]`, and exact new asset paths.
- [ ] Run `npm test` and verify failure against the unchanged constants.
- [ ] Implement only the new duration, scene range, and asset constants.
- [ ] Copy the source screenshot without modification and verify its `3024x1964` dimensions.
- [ ] Run `npm test` and confirm the contract passes.

### Task 2: Appended OpenAI narration asset

**Files:**
- Create: `remotion/scripts/generate-buildweek-voiceover.mjs`
- Create: `remotion/public/audio/ploroai-buildweek-ending.mp3`
- Modify: `remotion/README.md`

**Interfaces:**
- Consumes: existing `OPENAI_API_KEY`.
- Produces: an MP3 using `gpt-4o-mini-tts`, voice `cedar`, exact narration text, and calm professional instructions.

- [ ] Confirm the current official Audio Speech API request shape for `gpt-4o-mini-tts`, `cedar`, `instructions`, and MP3 output.
- [ ] Implement a script that reads the key only from the process environment, never logs it, and writes the returned audio bytes to the fixed asset path.
- [ ] Generate the sentence: “Ploro AI was designed, developed, tested and documented using OpenAI GPT-5.6 and Codex.”
- [ ] Probe duration and loudness; if required, use bundled FFmpeg to fit the spoken sentence inside the five-second scene and normalize near `-16.3 LUFS` with true peak below `-1 dBTP`.
- [ ] Document the model, voice, exact sentence, and regeneration command without documenting any secret.

### Task 3: Codex Build Week visual scene

**Files:**
- Create: `remotion/src/scenes/CodexBuildWeekScene.tsx`
- Modify: `remotion/src/PloroDemo.tsx`

**Interfaces:**
- Consumes: shared `SceneFrame`, `BrandLogo`, `AnimatedText`, `LightSweep`, `ASSETS`, and `SCENE_BY_ID`.
- Produces: a frame-local 150-frame scene with contained screenshot, localized identity blur, exact copy, light sweep, final logo, and fade to black.

- [ ] Implement the blurred full-canvas screenshot background and sharp centered foreground at the original aspect ratio.
- [ ] Add an aligned clipped screenshot duplicate over the lower-left name region with moderate Gaussian blur.
- [ ] Add “Built with OpenAI GPT-5.6 & Codex” and the exact five-line supporting copy using existing typography and colors.
- [ ] Add one restrained light sweep, slow camera push, subtle parallax, and no rotation or bounce.
- [ ] Darken the screenshot and reveal the existing Ploro AI logo for approximately the final second.
- [ ] Add the new scene sequence after frame `660`.
- [ ] Clip the original narration to frames `0–659` and start the appended audio sequence at frame `660`.
- [ ] Run `npm run typecheck` and `npm test`.

### Task 4: Render and verification tooling

**Files:**
- Modify: `remotion/package.json`
- Modify: `remotion/scripts/render-stills.mjs`
- Modify: `remotion/scripts/verify-video.mjs`

**Interfaces:**
- Produces: `npm run render:buildweek`, QA stills from the appended scene, and metadata assertions for the 27-second output.

- [ ] Add a Build Week render script that creates a temporary Remotion render and trims/muxes it to exactly `27` seconds with H.264 video copy and AAC audio.
- [ ] Add representative stills at frame `720` for the Codex evidence view and frame `790` for the final-logo view.
- [ ] Extend verification to expect `810` frames and `27` seconds for `ploroai-demo-buildweek.mp4`, while preserving existing verification behavior for prior outputs.
- [ ] Run `npm run typecheck`, `npm test`, and `npm run compositions`.

### Task 5: Still-frame QA and corrections

**Files:**
- Generate: `remotion/stills/buildweek-codex.png`
- Generate: `remotion/stills/buildweek-logo.png`

**Interfaces:**
- Produces: full-resolution QA evidence for the new visual range.

- [ ] Render all representative stills.
- [ ] Inspect the new stills for screenshot crop, interface legibility, exact copy, localized name blur, safe-area placement, light-sweep interference, and final-logo timing.
- [ ] Apply minimal scene-only corrections for any visible issue.
- [ ] Re-render and re-inspect affected stills.

### Task 6: Final render and media verification

**Files:**
- Generate: `remotion/out/ploroai-demo-buildweek.mp4`

**Interfaces:**
- Produces: the final Build Week submission video and evidence-backed media report.

- [ ] Run `npm run render:buildweek`.
- [ ] Verify H.264, `1080x1920`, `30/1`, `810` frames, `27.000` seconds, and one AAC audio stream.
- [ ] Measure integrated loudness and true peak with bundled FFmpeg.
- [ ] Confirm no clipping by requiring true peak below `0 dBTP`.
- [ ] Confirm the appended narration is present after `22` seconds and finishes before the final fade.
- [ ] Confirm no dropped or duplicated video frames from exact frame count and constant frame rate.
- [ ] Run fresh tests, type-check, composition validation, `git diff --check`, and production-app scope audit.
