import { readdir, writeFile } from 'node:fs/promises';
import { build } from 'vite';

// Vite copies public files outside its output bundle; they cannot be inlined.
const publicFiles = await readdir('public').catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
if (publicFiles.length > 0) {
  throw new Error(
    'The artifact must contain only HTML. Move public files into src and import them so Vite can inline them.'
  );
}

// Build in memory so failed validation never replaces a working bundle.
const result = await build({ build: { write: false } });
const files = (Array.isArray(result) ? result : [result]).flatMap(
  (bundle) => bundle.output
);
if (
  files.length !== 1 ||
  files[0].type !== 'asset' ||
  files[0].fileName !== 'index.html'
) {
  throw new Error(
    'The artifact must contain only HTML. Import assets from src so they can be inlined; remove public files, workers, and external chunks.'
  );
}

const html = files[0].source;
const bytes = Buffer.byteLength(html);
if (bytes > 1024 * 1024) {
  throw new Error(
    `Artifact is ${bytes} bytes; Tianji accepts at most 1048576 bytes. Reduce embedded data, images, or dependencies.`
  );
}
await writeFile('bundle.html', html);
console.log(
  `Created bundle.html (${bytes} bytes). Preview it before uploading.`
);
