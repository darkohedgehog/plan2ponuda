import {mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const stills = [
  ['logo', 30],
  ['floor-plan', 190],
  ['room-detection', 322],
  ['materials', 432],
  ['offers', 500],
  ['final', 630],
];

mkdirSync('stills', {recursive: true});

for (const [name, frame] of stills) {
  const result = spawnSync(
    'node_modules/.bin/remotion',
    [
      'still',
      'src/index.ts',
      'PloroAIDemo',
      `stills/${name}.png`,
      `--frame=${frame}`,
      '--image-format=png',
      '--overwrite',
    ],
    {stdio: 'inherit'},
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
