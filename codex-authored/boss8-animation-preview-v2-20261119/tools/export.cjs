'use strict';
// Review assets remain outside images/models: this branch has not been approved for gameplay.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { resolveLibraryRoot } = require('../vfx/vfx-library-root.cjs');
const project = path.resolve(__dirname, '../..');
const library = path.join(resolveLibraryRoot({ libraryId: 'effects-materials' }).root,
  'codex-authored/boss8-animation-preview-v2-20261119');
const manifest = JSON.parse(fs.readFileSync(path.join(library, 'manifest.json'), 'utf8'));
const apply = process.argv.includes('--apply');
for (const file of manifest.files) {
  const source = path.resolve(library, file.source);
  if (!source.startsWith(library + path.sep)) throw new Error('Invalid library path');
  const bytes = fs.readFileSync(source);
  const hash = data => crypto.createHash('sha256').update(/\.(py|cjs|json|md)$/.test(file.source)
    ? data.toString('utf8').replace(/\r\n/g, '\n') : data).digest('hex');
  if (hash(bytes) !== file.sha256) throw new Error('Changed library source: ' + file.source);
  if (!file.project) continue;
  const target = path.resolve(project, file.project);
  if (!target.startsWith(path.join(project, 'docs/assets/previews/boss8') + path.sep)) throw new Error('Preview path required');
  if (apply) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  if (hash(fs.readFileSync(target)) !== file.sha256) throw new Error('Changed project preview: ' + file.project);
}
console.log('BOSS8 review library/export verified:', manifest.files.length, 'files');
