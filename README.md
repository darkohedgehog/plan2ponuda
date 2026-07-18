# Ploro AI

Ploro AI is an AI-powered SaaS platform that helps electrical contractors transform architectural floor plans into professional electrical quotations.

Users can upload a floor plan, let AI analyze the project, review detected rooms, generate material suggestions, prepare quotations, and export professional quote documents.

---

## Features

- AI-assisted floor plan analysis
- Automatic room detection
- Material suggestion workflow
- Professional quotation generation
- Human review before approval
- Secure authentication
- Modern SaaS architecture
- Responsive dashboard
- Multi-step project workflow

---

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### Backend

- Prisma ORM
- PostgreSQL
- NextAuth
- Supabase Storage

### AI

- OpenAI API
- GPT-5.6
- Structured AI workflows
- OpenAI Audio Speech API
- `gpt-4o-mini-tts`

### Product Demo

- Remotion
- React
- TypeScript
- FFmpeg
- OpenAI-generated English voiceover

---

## How GPT-5.6 and Codex were used

Ploro AI was developed with extensive assistance from OpenAI models throughout product planning, implementation, testing, documentation, and submission preparation.

### GPT-5.6

GPT-5.6 was used as a technical and product development assistant for:

- application architecture
- workflow design
- prompt engineering
- UX improvements
- feature planning
- debugging assistance
- API design discussions
- documentation
- marketing copy
- product positioning
- Build Week submission materials
- product-demo planning and voiceover scripting

### Codex

Codex was used to accelerate implementation by generating, reviewing, and refining production-ready code, including:

- React and Next.js components
- TypeScript refactoring
- Prisma migrations
- API endpoints
- UI improvements
- automated testing
- production hardening
- security improvements
- documentation updates
- Git and repository maintenance
- Remotion-based product demo implementation
- animation timing and scene synchronization
- English voiceover integration
- video rendering and media verification

Codex also created and verified the final 22-second portrait product demo in:

- `1080x1920`
- `30 FPS`
- H.264 MP4
- AAC stereo audio
- English narration synchronized to the product workflow

All generated code and assets were reviewed, tested, and integrated into the application before use.

---

## OpenAI Voiceover

The English narration used in the Build Week product demo was generated with the OpenAI Audio Speech API.

Voice configuration:

- Model: `gpt-4o-mini-tts`
- Voice: `cedar`
- Language: English
- Style: calm, professional product narration

The narration was generated only for the product-demo video. It is not part of the runtime Ploro AI application and is not used by application users.

No API keys or secrets are stored in the repository.

---

## Development

```bash
npm install
npm run dev
```

---

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

---

## Remotion Product Demo

The repository contains an isolated Remotion project used to generate the promotional product video.

The Remotion package is intentionally separated from the production Next.js application so video tooling does not affect the main application dependencies.

### Preview

```bash
cd remotion
npm install
npm run preview
```

### Type-check and test

```bash
npm run typecheck
npm test
```

### Render

```bash
npm run render
```

The final voiceover version is rendered to:

```text
remotion/out/ploroai-demo-voiceover.mp4
```

Rendered videos are intentionally excluded from Git and can be regenerated from the committed Remotion source, image assets, and narration asset.

---

## Project Demo Specifications

The submitted product demo uses:

- 22-second duration
- 660 frames
- 1080×1920 portrait resolution
- 30 FPS
- H.264 video
- AAC stereo audio at 48 kHz
- synchronized English narration
- no copyrighted music

---

## License

Private project.