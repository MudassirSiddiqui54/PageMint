import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isImageKitImage, isOwnedImageKitPath } from './src/utils/imageValidation.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('ImageKit image validation uses fileType=image and an image MIME type', () => {
  assert.equal(isImageKitImage({ fileType: 'image', mime: 'image/jpeg' }), true);
  assert.equal(isImageKitImage({ fileType: 'image', mime: 'image/webp' }), true);
  assert.equal(isImageKitImage({ fileType: 'non-image', mime: 'application/pdf' }), false);
  assert.equal(isImageKitImage({ fileType: 'image', mime: 'application/octet-stream' }), false);
  assert.equal(isImageKitImage({ fileType: 'image' }), false);
});

test('ImageKit file paths must be inside the authenticated user folder', () => {
  assert.equal(isOwnedImageKitPath('/pagemint/user-123/avatar/photo.jpg', 'user-123'), true);
  assert.equal(isOwnedImageKitPath('pagemint/user-123/products/photo.jpg', 'user-123'), true);
  assert.equal(isOwnedImageKitPath('/pagemint/user-1234/photo.jpg', 'user-123'), false);
  assert.equal(isOwnedImageKitPath('/pagemint/other-user/photo.jpg', 'user-123'), false);
  assert.equal(isOwnedImageKitPath(null, 'user-123'), false);
});

test('ImageKit details and deletion use their distinct documented endpoints', async () => {
  const source = await read('./src/services/imagekit.js');
  assert.match(source, /\/v1\/files\/\$\{encodeURIComponent\(fileId\)\}\/details/);
  assert.match(source, /fetch\(`https:\/\/api\.imagekit\.io\/v1\/files\/\$\{encodeURIComponent\(fileId\)\}`,\s*\{\s*method: 'DELETE'/);
});
