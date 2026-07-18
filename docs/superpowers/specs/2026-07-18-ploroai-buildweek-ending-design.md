# Ploro AI Build Week Ending Design

## Objective

Improve OpenAI Build Week compliance by appending a five-second Codex Desktop scene after the existing Ploro AI early-access CTA. The original 22-second composition, narration, branding, scene timing, animation, and transitions remain unchanged.

The updated deliverable renders:

- `1080x1920`
- `30 FPS`
- `810 frames`
- `27.000 seconds`
- H.264 MP4
- AAC narration audio
- `remotion/out/ploroai-demo-buildweek.mp4`

## Append-Only Constraint

Frames `0–659` remain unchanged. No existing scene component, scene range, transition, caption, image treatment, or narration timing is redesigned.

The update adds one new range:

| Frames | Time | Scene |
|---|---:|---|
| 660–809 | 22.0–27.0s | Codex Build Week attribution |

## Codex Build Week Scene

The supplied Codex Desktop screenshot is copied into `remotion/public/assets/` and used only by the new final scene.

The screenshot treatment follows the existing screenshot-stage language:

- a darkened, blurred full-canvas background duplicate;
- a centered, sharp foreground copy;
- preserved source aspect ratio;
- full visible interface with no important crop;
- slow scale push from approximately `0.985` to `1.025`;
- subtle vertical parallax;
- no rotation;
- no bounce.

The foreground screenshot is approximately `1000px` wide within the `1080px` canvas. Its full `3024x1964` source area remains visible.

## Identity Blur

Only the user-name region in the lower-left corner is softened. The implementation uses a second aligned screenshot copy clipped to the name region and filtered with a moderate Gaussian blur. The rest of the Codex interface remains sharp and readable.

The blur does not cover task names, model selection, the main transcript, the environment panel, or other evidence of Codex usage.

## Typography

The existing `FONT_FAMILY`, `COLORS`, `AnimatedText`, and scene framing are reused.

Primary copy:

> Built with OpenAI GPT-5.6 & Codex

Supporting copy:

```text
Used throughout planning,
development,
testing,
documentation
and product design.
```

The copy fades in without bounce and remains within the established portrait safe area.

## Motion

The scene uses only:

- the existing restrained blur/fade entrance;
- slow camera push;
- subtle parallax;
- soft blue ambient glow;
- one light sweep;
- opacity fades.

During approximately the final second, the screenshot and attribution copy darken while the existing Ploro AI logo plate appears. The complete frame fades to black by frame `810`.

## Narration

The existing 22-second narration asset remains unchanged.

A separate appended narration asset is generated with the same OpenAI configuration already documented in the repository:

- model: `gpt-4o-mini-tts`;
- voice: `cedar`;
- language: English;
- style: calm, professional product narration.

Narration text:

> Ploro AI was designed, developed, tested and documented using OpenAI GPT-5.6 and Codex.

The new sentence begins after frame `660` and is timed to finish before the final logo fade. Its loudness is matched to the existing narration, targeting approximately `-16.3 LUFS` integrated loudness with no sample or true-peak clipping.

The final Remotion composition contains the original voiceover and a second frame-aligned `<Audio>` sequence for the appended sentence.

## Project Structure

New or updated Remotion files are limited to:

- the copied Codex screenshot asset;
- the generated appended narration asset;
- `CodexBuildWeekScene`;
- timeline and asset constants;
- the root Remotion composition;
- timeline/asset tests;
- render and verification scripts;
- Remotion documentation.

The production Next.js application and root production dependencies remain untouched.

## Rendering

The isolated package gains a dedicated Build Week render command that writes:

`remotion/out/ploroai-demo-buildweek.mp4`

The render uses H.264 video, `yuv420p`, and AAC audio. Generated MP4s, QA stills, temporary renders, browser caches, and `node_modules` remain ignored.

## Verification

Before completion:

1. Run all Remotion tests.
2. Run the isolated TypeScript type-check.
3. Confirm `PloroAIDemo` registers at `1080x1920`, `30 FPS`, and `810` frames.
4. Render representative stills from the Codex screenshot scene and final-logo moment.
5. Inspect the stills for source cropping, text legibility, localized name blur, safe areas, and logo placement.
6. Render the final H.264/AAC MP4.
7. Verify:
   - `27.000` seconds;
   - `1080x1920`;
   - `30 FPS`;
   - `810` video frames;
   - one H.264 video stream;
   - one AAC audio stream;
   - narration present in the appended range;
   - no clipping;
   - true peak below `0 dBTP`;
   - loudness consistent with the existing narration;
   - no dropped or duplicated video frames.
