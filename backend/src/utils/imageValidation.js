export function isImageKitImage(file) {
  return file?.fileType === 'image' && typeof file.mime === 'string' && file.mime.startsWith('image/');
}

export function isOwnedImageKitPath(filePath, ownerId) {
  if (typeof filePath !== 'string' || !ownerId) return false;
  const allowedPrefix = `/pagemint/${String(ownerId)}/`;
  const normalisedPath = `/${filePath.replace(/^\/+/, '')}`;
  return normalisedPath.startsWith(allowedPrefix);
}
