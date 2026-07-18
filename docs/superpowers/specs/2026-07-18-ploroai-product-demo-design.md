# Ploro AI Product Demo Video Design

## Objective

Create a premium, portrait-format product demonstration that feels like a continuous application workflow rather than a slideshow. The video should communicate that Ploro AI turns a floor plan into detected rooms, material estimates, and a professional quotation.

The deliverable is a production-ready React and Remotion project that renders:

- `1080x1920`
- `30 FPS`
- `660 frames` (`22 seconds`)
- `ploroai-demo.mp4`
- no audio track

## Visual Thesis

Ploro AI is presented as a calm, precise intelligence operating inside a dark-blue cinematic environment: sharp product UI floats over a softened echo of itself, while restrained camera pushes, blue scanning light, and deliberate cursor interactions make the workflow feel live.

## Content Plan

The narrative progresses through one continuous product journey:

1. Introduce Ploro AI and the promise of reinvented electrical estimating.
2. Establish the cost of manual quoting.
3. Upload and scan a floor plan.
4. Review AI-detected rooms and confidence.
5. Generate material estimates.
6. Export a finished quotation.
7. Reinforce the product benefits with the 3D house poster.
8. End on a focused early-access call to action.

## Interaction and Motion Thesis

- Camera motion uses slow scale and position interpolation to create depth without rotating or distorting supplied imagery.
- Product actions are communicated with an AI scan line, detected-room overlays, staged data reveals, count-up values, and a cursor with a restrained click pulse.
- Scene boundaries use short opacity and Gaussian blur dissolves. Blue glow and light sweeps provide continuity without flashy transitions or bounce effects.

## Project Architecture

The video will live in an isolated `remotion/` package inside the repository. This prevents Remotion dependencies and rendering configuration from coupling to the existing production Next.js application.

The package will contain:

- its own `package.json`, TypeScript configuration, and Remotion configuration;
- a `public/assets/` directory containing stable copies of all supplied images;
- a root composition that defines the 660-frame timeline;
- individual reusable scene components;
- shared typography, screenshot-stage, cursor, counter, glow, and transition components;
- reusable interpolation and spring helpers;
- scripts for previewing, type-checking, and rendering.

Replacing a file in `public/assets/` with another image of the same role will update the video without requiring scene code changes.

## Timeline

| Frames | Time | Scene | Primary asset |
|---|---:|---|---|
| 0-59 | 0.0-2.0s | Logo introduction | `logo.png` |
| 60-134 | 2.0-4.5s | Manual quoting problem | `PloroAI7.png` |
| 135-239 | 4.5-8.0s | Floor-plan upload and scan | `ploroai-demo1.png` |
| 240-359 | 8.0-12.0s | Room detection | `ploroai-demo2.png` |
| 360-449 | 12.0-15.0s | Material estimates | `ploroai-demo3.png` |
| 450-539 | 15.0-18.0s | Offer and PDF export | `ploroai-demo4.png` |
| 540-599 | 18.0-20.0s | Benefits poster | `PloroAI2.png` |
| 600-659 | 20.0-22.0s | Early-access CTA | `logo.png` |

All seven supplied images are used.

## Scene Design

### LogoScene

The screen fades up from black. A low-opacity radial blue glow expands behind the Ploro AI logo. The logo resolves from slight blur and scale reduction. “Electrical estimating.” and “Reinvented.” appear in a tight two-line sequence with restrained upward movement.

Because the supplied logo has a white background, it is displayed as a clean luminous brand plate rather than attempting destructive background removal.

### ProblemScene

`PloroAI7.png` is centered over a blurred, full-canvas duplicate. The foreground poster uses a slow push-in with no crop of meaningful content. A dark gradient creates a calm text area for “Manual quoting takes hours.”

### FloorPlanScene

`ploroai-demo1.png` is centered, sharp, and fully visible over its blurred background copy. The camera advances slowly toward the plan. A horizontal blue scan line travels from the upper to lower plan region, leaving restrained room-detection rectangles that fade in as the line passes. The title reads “Upload your floor plan.”

### RoomDetectionScene

`ploroai-demo2.png` is staged as the product surface. “Living Room,” “Bedroom,” “Bathroom,” and “Kitchen” appear sequentially in a compact detected-room overlay. The screenshot’s 86% confidence field receives a blue emphasis treatment. A cursor moves into the form, clicks, and produces a short non-bouncing pulse. The title reads “AI detects every room automatically.”

### MaterialsScene

`ploroai-demo3.png` remains sharp and fully visible. Three translucent emphasis bands align with the visible material rows and reveal sequentially. Quantities and prices count upward in compact overlay labels, reinforcing generation without obscuring the underlying UI. The title reads “Generate material estimates.”

### OffersScene

`ploroai-demo4.png` receives a slow camera move toward the offer row. The visible total is highlighted with a controlled blue glow. The cursor moves to the export button and clicks. A brief light sweep crosses the button. The title reads “Export a professional quotation.”

### PosterScene

`PloroAI2.png` is centered over its blurred background duplicate and receives a slow cinematic push. Four benefit captions reveal sequentially:

- Save hours
- Improve accuracy
- Generate quotations
- AI-assisted workflow

### FinalScene

The screen returns to black. The logo resolves above a soft blue glow. “Join Early Access” appears as the primary call to action, followed by `ploroai.io`. The scene fades fully to black by the final frame.

## Image Treatment

- Original aspect ratios are preserved.
- Important UI is never cropped.
- Each foreground image uses `object-fit: contain`.
- A full-screen background duplicate uses `object-fit: cover`, significant blur, reduced opacity, and a dark-blue overlay.
- Foreground images are kept within a portrait safe area and rendered with high-quality scaling.
- Images never rotate.

## Typography and Color

Typography uses a premium system sans-serif stack to avoid runtime font downloads during deterministic rendering. Hierarchy is created with weight, tracking, line height, and whitespace rather than multiple typefaces.

Core palette:

- near-black: `#020611`
- deep navy: `#06162f`
- Ploro blue: `#1463ff`
- electric cyan: `#36d7ff`
- primary text: `#f7f9ff`
- secondary text: `#9dafca`

## Animation System

Reusable helpers will wrap `interpolate()` and `spring()` for:

- clamped progress;
- scene fade and blur envelopes;
- entrance opacity and translation;
- slow camera pushes;
- stagger timing;
- cursor positioning and click pulses;
- number interpolation.

Springs use high damping and no overshoot. Transitions remain short and subordinate to the content.

## Error Handling and Determinism

- Asset paths are centralized and loaded through Remotion `staticFile()`.
- No network-loaded fonts, images, or audio are used.
- Composition dimensions, FPS, and duration are constants.
- Rendering scripts explicitly select the composition and output path.
- TypeScript runs in strict mode.

## Verification

The finished package will be checked with:

1. dependency installation;
2. TypeScript type-checking;
3. a Remotion composition inspection;
4. representative still renders from multiple scenes;
5. visual inspection for cropping, legibility, and transition continuity;
6. full MP4 rendering to `remotion/out/ploroai-demo.mp4`;
7. media metadata inspection confirming 1080x1920, 30 FPS, approximately 22 seconds, and no audio stream.

