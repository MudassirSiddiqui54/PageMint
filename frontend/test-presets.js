import test from 'node:test';
import assert from 'node:assert/strict';
import { platformPresets, pageBackgrounds, typefaces, pageThemes } from './src/lib/presets.js';
import { readFile } from 'node:fs/promises';

test('every visible design catalogue meets its promised option count', async () => {
  for (const [name, items, minimum] of [
    ['page backgrounds', pageBackgrounds, 40],
    ['typefaces', typefaces, 40],
    ['page-wide themes', pageThemes, 40],
    ['searchable platform presets', platformPresets, 40]
  ]) assert.ok(items.length >= minimum, `${name} has ${items.length}, expected at least ${minimum}`);
  const stickerSource = await readFile(new URL('./src/components/studio/StickerArt.jsx', import.meta.url), 'utf8');
  const stickerCount = (stickerSource.split('].map(([id, name, Icon, bg, fg])')[0].match(/^\s+\['[^']+'/gm) || []).length;
  assert.ok(stickerCount >= 40, `illustrated stickers has ${stickerCount}, expected at least 40`);
});

test('catalogue identifiers are unique', () => {
  for (const items of [platformPresets, pageBackgrounds, typefaces, pageThemes]) {
    const ids = items.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});
