import { randomBytes } from 'node:crypto';

export function makeAlias(length = 7) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

export function normaliseAlias(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export function makeBirthdayAlias(recipientName) {
  const base = String(recipientName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 35)
    .replace(/-+$/g, '') || 'birthday';
  return `${base}-${makeAlias(4)}`;
}
