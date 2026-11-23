import { createHmac, randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import MediaDeletionJob from '../models/MediaDeletionJob.js';
import { HttpError } from '../utils/httpError.js';
import { isImageKitImage, isOwnedImageKitPath } from '../utils/imageValidation.js';

export function ensureImageKitConfigured() {
  if (!env.imagekitPublicKey || !env.imagekitPrivateKey || !env.imagekitUrlEndpoint) {
    throw new HttpError(503, 'ImageKit is not configured. Add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT to backend/.env.');
  }
}

export function imagekitAuthParameters() {
  ensureImageKitConfigured();
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 10 * 60;
  const signature = createHmac('sha1', env.imagekitPrivateKey).update(token + expire).digest('hex');
  return { token, expire, signature, publicKey: env.imagekitPublicKey, urlEndpoint: env.imagekitUrlEndpoint };
}


export async function verifyImageKitFile(fileId, ownerId) {
  ensureImageKitConfigured();
  const credentials = Buffer.from(`${env.imagekitPrivateKey}:`).toString('base64');
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  if (!response.ok) throw new HttpError(400, 'The uploaded image could not be verified in ImageKit.');
  const file = await response.json();
  // ImageKit's `fileType` is the enum `image` / `non-image`; its MIME type
  // is exposed separately in `mime` (for example `image/jpeg`).
  if (!isImageKitImage(file)) {
    throw new HttpError(400, 'Only image uploads are accepted.');
  }
  if (Number(file.size || 0) > 8 * 1024 * 1024) {
    throw new HttpError(400, 'Image must be smaller than 8 MB.');
  }
  if (!isOwnedImageKitPath(file.filePath, ownerId)) {
    throw new HttpError(403, 'That image does not belong to this account.');
  }
  return { url: file.url, fileId: file.fileId };
}

export async function stageImageDeletions(fileIds) {
  const ids = [...new Set((fileIds || []).filter(Boolean))];
  if (!ids.length) return [];
  ensureImageKitConfigured();
  for (const fileId of ids) {
    await MediaDeletionJob.updateOne(
      { fileId },
      { $setOnInsert: { fileId, status: 'queued', attempts: 0, nextAttemptAt: new Date() } },
      { upsert: true }
    );
  }
  return ids;
}

export async function deleteImageKitFile(fileId) {
  ensureImageKitConfigured();
  const credentials = Buffer.from(`${env.imagekitPrivateKey}:`).toString('base64');
  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE', headers: { Authorization: `Basic ${credentials}` }
  });
  if (response.status === 404) return;
  if (!response.ok) throw new Error(`ImageKit API returned ${response.status}: ${await response.text()}`);
}


/** Queue deletion of the authenticated user's dedicated ImageKit folder.
 * The path is derived server-side; callers cannot supply an arbitrary path.
 */
export async function stageUserFolderDeletion(ownerId) {
  const id = String(ownerId || '');
  if (!/^[a-f\d]{24}$/i.test(id)) throw new HttpError(400, 'Invalid account identifier for media cleanup.');
  ensureImageKitConfigured();
  const folderPath = `/pagemint/${id}/`;
  await MediaDeletionJob.updateOne(
    { type: 'user-folder', ownerId: id },
    { $setOnInsert: { type: 'user-folder', ownerId: id, fileId: `folder:${id}`, folderPath, status: 'queued', attempts: 0, nextAttemptAt: new Date() } },
    { upsert: true }
  );
  return folderPath;
}

export async function deleteImageKitFolder(folderPath) {
  ensureImageKitConfigured();
  // This is an internal operation. Restrict deletion to a single user's folder
  // under the Pagemint namespace, never the namespace root itself.
  if (typeof folderPath !== 'string' || !/^\/pagemint\/[a-f\d]{24}\/$/i.test(folderPath)) {
    throw new Error('Refusing to delete an ImageKit folder outside the Pagemint user-folder namespace.');
  }
  const credentials = Buffer.from(`${env.imagekitPrivateKey}:`).toString('base64');
  const response = await fetch('https://api.imagekit.io/v1/folder/', {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ folderPath })
  });
  if (response.status === 404) return; // Idempotent: already removed.
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`ImageKit folder deletion failed (${response.status})${detail ? `: ${detail.slice(0, 400)}` : ''}`);
  }
}
