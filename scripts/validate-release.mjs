import { readFile, readdir } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const required = [manifest.background.service_worker, manifest.action.default_popup, manifest.options_page, 'content.js', 'privacy.css', 'media.css', 'effects.css', '_locales/en/messages.json', '_locales/zh_CN/messages.json', ...Object.values(manifest.icons)];
for (const file of required) await readFile(`dist/${file}`);
if (manifest.version !== pkg.version) throw new Error('Version mismatch');
if (manifest.permissions.join(',') !== 'storage,scripting,activeTab') throw new Error('Unexpected permissions');
async function check(dir) {
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${file.name}`;
    if (file.isDirectory()) await check(path);
    else {
      if (/\.map$|\.env|\.DS_Store/.test(file.name)) throw new Error(`Forbidden release file: ${file.name}`);
      if (/\.(js|html|css)$/.test(file.name)) {
        const text = await readFile(path, 'utf8');
        if (/\beval\s*\(|new Function\s*\(|<script[^>]+src=["']https?:|@import\s+["']https?:/.test(text)) throw new Error(`Remote or executable code: ${file.name}`);
      }
    }
  }
}
await check('dist');
console.log('Release validation passed');
