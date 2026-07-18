import {spawnSync} from 'node:child_process';
import {statSync} from 'node:fs';
import ffprobeStatic from 'ffprobe-static';

const videoPath = 'out/ploroai-demo.mp4';
const result = spawnSync(
  ffprobeStatic.path,
  [
    '-v',
    'error',
    '-count_frames',
    '-show_entries',
    'format=duration,size,format_name:stream=index,codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,duration',
    '-of',
    'json',
    videoPath,
  ],
  {encoding: 'utf8'},
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const metadata = JSON.parse(result.stdout);
const videoStreams = metadata.streams.filter(
  (stream) => stream.codec_type === 'video',
);
const audioStreams = metadata.streams.filter(
  (stream) => stream.codec_type === 'audio',
);
const video = videoStreams[0];
const duration = Number(metadata.format.duration);
const frames = Number(video?.nb_read_frames);

const assertions = [
  ['one video stream', videoStreams.length === 1],
  ['H.264 codec', video?.codec_name === 'h264'],
  ['1080x1920 resolution', video?.width === 1080 && video?.height === 1920],
  ['30 FPS', video?.r_frame_rate === '30/1'],
  ['660 frames', frames === 660],
  ['22 seconds', Math.abs(duration - 22) < 0.001],
  ['no audio stream', audioStreams.length === 0],
];

const failed = assertions.filter(([, passed]) => !passed);
const bytes = statSync(videoPath).size;

console.log(
  JSON.stringify(
    {
      path: videoPath,
      bytes,
      duration,
      resolution: `${video?.width}x${video?.height}`,
      fps: video?.r_frame_rate,
      frames,
      codec: video?.codec_name,
      audioStreams: audioStreams.length,
      format: metadata.format.format_name,
      assertions: Object.fromEntries(assertions),
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  console.error(`Metadata verification failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exit(1);
}
