import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { zipSync } from 'fflate';
const entries = {};
async function collect(dir, prefix = '') {
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const name = prefix + file.name;
    if (file.isDirectory()) await collect(`${dir}/${file.name}`, `${name}/`);
    else entries[name] = new Uint8Array(await readFile(`${dir}/${file.name}`));
  }
}
await collect('dist');
await mkdir('release', { recursive: true });
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const path = `release/focusmask-${version}.zip`;
await writeFile(path, zipSync(entries, { level: 9 }));
console.log(path);
