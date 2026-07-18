# Ploro AI Remotion Demo

This isolated Remotion package renders the Ploro AI product demo.

The voiceover-enabled renders use the committed narration source assets under
`public/audio/`. The narration was generated for the submitted product-demo
video using the OpenAI Audio Speech API with model `gpt-4o-mini-tts` and voice
`cedar`.

Codex implemented the Remotion video, synchronization, rendering, and media
verification. OpenAI TTS is not a runtime feature for Ploro AI users, and no
API key or secret is stored in this repository.

```bash
npm run test
npm run typecheck
npm run compositions
npm run render:voiceover
npm run verify -- out/ploroai-demo-voiceover.mp4
npm run render:buildweek
npm run verify -- out/ploroai-demo-buildweek.mp4
```

`render:buildweek` appends the five-second OpenAI GPT-5.6 and Codex attribution
scene to the original 22-second demo. To regenerate only its narration, provide
`OPENAI_API_KEY` in the shell environment and run:

```bash
node scripts/generate-buildweek-voiceover.mjs
```

Rendered MP4 files live under `out/`, which is intentionally ignored by Git.
