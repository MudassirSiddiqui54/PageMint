import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import User from '../models/User.js';
import { normaliseAlias } from '../utils/aliases.js';
import { stageImageDeletions, verifyImageKitFile } from '../services/imagekit.js';

const router = Router();
router.use(requireAuth);

const safeUrl = z.string().trim().url().max(2048).refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Use a valid http or https URL.');
const linkUrl = z.string().trim().max(2048).refine((value) => {
  try { return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(value).protocol); }
  catch { return false; }
}, 'Use an http, https, mailto or tel URL.');
const mediaSchema = z.object({ url: safeUrl, fileId: z.string().min(1).max(200) });
const linkSchema = z.object({
  id: z.string().min(1).max(80), platform: z.string().max(40).default('custom'),
  label: z.string().trim().min(1).max(60), url: linkUrl,
  icon: z.string().max(40).default('link'),
  iconFamily: z.enum(['brand', 'lucide', 'fontawesome', 'text']).default('brand'),
  iconStyle: z.enum(['brand', 'black', 'white', 'custom']).default('brand'),
  iconColor: z.string().max(20).default(''), enabled: z.boolean().default(true), position: z.number().int().min(0).max(1000).default(0)
});
const productSchema = z.object({
  id: z.string().min(1).max(80), name: z.string().trim().min(1).max(100),
  description: z.string().max(500).default(''), price: z.string().max(40).default(''),
  url: safeUrl, image: z.object({ url: z.union([safeUrl, z.literal('')]), fileId: z.string().max(200) }).optional().default({ url: '', fileId: '' }),
  enabled: z.boolean().default(true), position: z.number().int().min(0).max(1000).default(0)
});

router.get('/me', (req, res) => res.json({ profile: req.user.profile }));

router.patch('/me', asyncHandler(async (req, res) => {
  const schema = z.object({
    alias: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    published: z.boolean().optional(),
    displayName: z.string().trim().min(1).max(60).optional(),
    bio: z.string().max(180).optional(),
    appearance: z.record(z.any()).optional(),
    qr: z.record(z.any()).optional()
  }).strict();
  const data = schema.parse(req.body);
  if (data.alias) {
    data.alias = normaliseAlias(data.alias);
    const collision = await User.exists({ _id: { $ne: req.user._id }, 'profile.alias': data.alias });
    if (collision) throw new HttpError(409, 'That public page address is already taken.');
  }
  if (data.appearance) {
    const oldIds = new Set([req.user.profile.appearance?.backgroundImage?.fileId, ...(req.user.profile.appearance?.stickerItems || []).map((item) => item.fileId)].filter(Boolean));
    if (data.appearance.backgroundImage?.fileId) data.appearance.backgroundImage = await verifyImageKitFile(data.appearance.backgroundImage.fileId, req.user._id);
    if (Array.isArray(data.appearance.stickerItems)) data.appearance.stickerItems = await Promise.all(data.appearance.stickerItems.map(async (item) => item.fileId ? { ...item, ...(await verifyImageKitFile(item.fileId, req.user._id)) } : item));
    const nextIds = new Set([data.appearance.backgroundImage?.fileId, ...(data.appearance.stickerItems || []).map((item) => item.fileId)].filter(Boolean));
    const removed = [...oldIds].filter((id) => !nextIds.has(id));
    if (removed.length) await stageImageDeletions(removed);
  }
  if (data.qr && data.qr.logo?.fileId) data.qr.logo = await verifyImageKitFile(data.qr.logo.fileId, req.user._id);
  if (data.qr) {
    const oldLogoId = req.user.profile.qr?.logo?.fileId;
    const newLogoId = data.qr.logo?.fileId;
    if (oldLogoId && oldLogoId !== newLogoId) await stageImageDeletions([oldLogoId]);
  }
  for (const [key, value] of Object.entries(data)) req.user.profile[key] = value;
  await req.user.save();
  res.json({ profile: req.user.profile });
}));

router.patch('/avatar', asyncHandler(async (req, res) => {
  const { avatar: submittedAvatar } = z.object({ avatar: mediaSchema }).parse(req.body);
  const avatar = await verifyImageKitFile(submittedAvatar.fileId, req.user._id);
  const oldFileId = req.user.profile.avatar?.fileId;
  if (oldFileId && oldFileId !== avatar.fileId) await stageImageDeletions([oldFileId]);
  req.user.profile.avatar = avatar;
  await req.user.save();
  res.json({ avatar: req.user.profile.avatar });
}));

router.delete('/avatar', asyncHandler(async (req, res) => {
  const oldFileId = req.user.profile.avatar?.fileId;
  await stageImageDeletions([oldFileId]);
  req.user.profile.avatar = { url: '', fileId: '' };
  await req.user.save();
  res.status(204).end();
}));

router.post('/links', asyncHandler(async (req, res) => {
  const link = linkSchema.parse(req.body);
  if (req.user.profile.links.some((item) => item._id === link.id)) throw new HttpError(409, 'That link already exists.');
  req.user.profile.links.push({ ...link, _id: link.id });
  await req.user.save();
  res.status(201).json({ links: req.user.profile.links });
}));

router.patch('/links/reorder', asyncHandler(async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string().min(1).max(80)).max(100) }).parse(req.body);
  const existing = new Map(req.user.profile.links.map((link) => [link._id, link]));
  if (ids.length !== existing.size || new Set(ids).size !== ids.length || ids.some((id) => !existing.has(id))) {
    throw new HttpError(400, 'The reorder list must contain every link exactly once.');
  }
  ids.forEach((id, position) => { existing.get(id).position = position; });
  await req.user.save();
  res.json({ links: req.user.profile.links });
}));

router.patch('/links/:id', asyncHandler(async (req, res) => {
  const data = linkSchema.partial().omit({ id: true }).parse(req.body);
  const link = req.user.profile.links.find((item) => item._id === req.params.id);
  if (!link) throw new HttpError(404, 'Link not found.');
  Object.assign(link, data);
  await req.user.save();
  res.json({ links: req.user.profile.links });
}));

router.delete('/links/:id', asyncHandler(async (req, res) => {
  req.user.profile.links = req.user.profile.links.filter((item) => item._id !== req.params.id);
  await req.user.save();
  res.json({ links: req.user.profile.links });
}));

router.post('/products', asyncHandler(async (req, res) => {
  const product = productSchema.parse(req.body);
  if (product.image?.fileId) product.image = await verifyImageKitFile(product.image.fileId, req.user._id);
  if (req.user.profile.products.some((item) => item._id === product.id)) throw new HttpError(409, 'That product already exists.');
  req.user.profile.products.push({ ...product, _id: product.id });
  await req.user.save();
  res.status(201).json({ products: req.user.profile.products });
}));

router.patch('/products/:id', asyncHandler(async (req, res) => {
  const data = productSchema.partial().omit({ id: true }).parse(req.body);
  if (data.image?.fileId) data.image = await verifyImageKitFile(data.image.fileId, req.user._id);
  const product = req.user.profile.products.find((item) => item._id === req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');
  const oldFileId = product.image?.fileId;
  const newFileId = data.image?.fileId || '';
  if (oldFileId && data.image && oldFileId !== newFileId) await stageImageDeletions([oldFileId]);
  Object.assign(product, data);
  await req.user.save();
  res.json({ products: req.user.profile.products });
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  const product = req.user.profile.products.find((item) => item._id === req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');
  const fileId = product.image?.fileId;
  await stageImageDeletions([fileId]);
  req.user.profile.products = req.user.profile.products.filter((item) => item._id !== req.params.id);
  await req.user.save();
  res.json({ products: req.user.profile.products });
}));

export default router;
