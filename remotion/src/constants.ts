export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 660,
} as const;

export const SCENES = [
  {id: 'logo', from: 0, to: 60},
  {id: 'problem', from: 60, to: 135},
  {id: 'floorPlan', from: 135, to: 240},
  {id: 'roomDetection', from: 240, to: 360},
  {id: 'materials', from: 360, to: 450},
  {id: 'offers', from: 450, to: 540},
  {id: 'poster', from: 540, to: 600},
  {id: 'final', from: 600, to: 660},
] as const;

export type SceneId = (typeof SCENES)[number]['id'];

export const SCENE_BY_ID = Object.fromEntries(
  SCENES.map((scene) => [scene.id, scene]),
) as Record<SceneId, (typeof SCENES)[number]>;

export const ASSETS = {
  logo: 'assets/logo.png',
  problem: 'assets/PloroAI7.png',
  floorPlan: 'assets/ploroai-demo1.png',
  roomDetection: 'assets/ploroai-demo2.png',
  materials: 'assets/ploroai-demo3.png',
  offers: 'assets/ploroai-demo4.png',
  poster: 'assets/PloroAI2.png',
  voiceover: 'audio/ploroai-english-voiceover.mp3',
} as const;

export const COLORS = {
  black: '#020611',
  navy: '#06162f',
  navyLight: '#0a2750',
  blue: '#1463ff',
  cyan: '#36d7ff',
  text: '#f7f9ff',
  textMuted: '#9dafca',
} as const;

export const FONT_FAMILY =
  'Inter, SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
