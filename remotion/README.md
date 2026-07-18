# Ploro AI Remotion Demo

This isolated Remotion package renders the Ploro AI product demo.

The voiceover-enabled render uses the committed narration source asset at
`public/audio/ploroai-english-voiceover.mp3`. The narration was generated for
the submitted product-demo video using the OpenAI Audio Speech API with model
`gpt-4o-mini-tts` and voice `cedar`.

Codex implemented the Remotion video, synchronization, rendering, and media
verification. OpenAI TTS is not a runtime feature for Ploro AI users, and no
API key or secret is stored in this repository.

```bash
npm run test
npm run typecheck
npm run compositions
npm run render:voiceover
npm run verify -- out/ploroai-demo-voiceover.mp4
```

Rendered MP4 files live under `out/`, which is intentionally ignored by Git.
