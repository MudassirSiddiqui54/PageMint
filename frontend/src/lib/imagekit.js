import { api } from './api';

export async function uploadImage(file, folder = 'pagemint') {
  if (!file) throw new Error('Choose an image first.');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Image must be smaller than 8 MB.');
  const { data: auth } = await api.get('/media/imagekit-auth');
  const form = new FormData();
  form.append('file', file);
  const safeName = String(file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
  form.append('fileName', `${Date.now()}-${safeName}`);
  form.append('folder', `/${folder}`);
  form.append('token', auth.token);
  form.append('expire', String(auth.expire));
  form.append('signature', auth.signature);
  form.append('publicKey', auth.publicKey);
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: form });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.help || `ImageKit upload failed (${response.status}).`);
  if (!result.url || !result.fileId) throw new Error('ImageKit returned an incomplete upload response. No image was saved.');
  return { url: result.url, fileId: result.fileId };
}
