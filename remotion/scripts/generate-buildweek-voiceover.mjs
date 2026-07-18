import {readFile, writeFile} from 'node:fs/promises';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required.');
}

const configUrl = new URL(
  '../public/audio/ploroai-buildweek-ending.json',
  import.meta.url,
);
const outputUrl = new URL(
  '../public/audio/ploroai-buildweek-ending.mp3',
  import.meta.url,
);
const config = JSON.parse(await readFile(configUrl, 'utf8'));

const response = await fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(config),
});

if (!response.ok) {
  const errorBody = await response.text();
  throw new Error(
    `OpenAI speech generation failed (${response.status}): ${errorBody}`,
  );
}

await writeFile(outputUrl, Buffer.from(await response.arrayBuffer()));
console.log('Generated public/audio/ploroai-buildweek-ending.mp3');
