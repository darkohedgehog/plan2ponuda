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

---

## How GPT-5.6 and Codex were used

Ploro AI was developed with extensive assistance from OpenAI models throughout the project.

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
- Build Week submission materials

### Codex

Codex was used to accelerate implementation by generating and refining production-ready code, including:

- React and Next.js components
- TypeScript refactoring
- Prisma migrations
- API endpoints
- UI improvements
- automated testing
- production hardening
- security improvements
- Remotion-based product demo video generation

All generated code was reviewed, tested, and integrated into the application before use.

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
The demo includes an English narration source asset generated for this video
using the OpenAI Audio Speech API with model `gpt-4o-mini-tts` and voice
`cedar`.

Codex implemented the Remotion video, narration synchronization, rendering,
and media verification. The OpenAI TTS usage applies only to the submitted
product-demo narration; runtime Ploro AI users do not interact with the TTS
model. No API key or secret is stored in the repository.

Render:

```bash
cd remotion
npm install
npm run render
npm run render:voiceover
```

The rendered video is intentionally excluded from Git and can be regenerated at any time from the committed source.

---

## License

Private project.
