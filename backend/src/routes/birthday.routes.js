import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import BirthdayPage from '../models/BirthdayPage.js';
import { normaliseAlias, makeBirthdayAlias } from '../utils/aliases.js';
import { stageImageDeletions, verifyImageKitFile } from '../services/imagekit.js';

const router = Router();
router.use(requireAuth);
const mediaSchema = z.object({ url: z.string().url().max(2048).refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Use an http or https image URL.'), fileId: z.string().min(1).max(200) });
const createSchema = z.object({
  alias: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  recipientName: z.string().trim().min(1).max(80),
  dateOfBirth: z.coerce.date(),
  headline: z.string().max(120).optional(), message: z.string().max(3000).optional()
});

router.get('/', asyncHandler(async (req, res) => {
  const pages = await BirthdayPage.find({ owner: req.user._id }).sort({ createdAt: -1 }).select('-wishes');
  res.json({ pages });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const alias = normaliseAlias(data.alias || makeBirthdayAlias(data.recipientName));
  if (await BirthdayPage.exists({ alias })) throw new HttpError(409, 'That birthday page alias is already taken.');
  const page = await BirthdayPage.create({ ...data, alias, owner: req.user._id });
  res.status(201).json({ page });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const schema = z.object({
    alias: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    recipientName: z.string().trim().min(1).max(80).optional(), dateOfBirth: z.coerce.date().optional(), headline: z.string().max(120).optional(),
    message: z.string().max(3000).optional(), cover: mediaSchema.optional(), gallery: z.array(mediaSchema.extend({ caption: z.string().max(160).optional() })).max(30).optional(),
    appearance: z.record(z.any()).optional(), published: z.boolean().optional()
  }).strict();
  const data = schema.parse(req.body);
  const page = await BirthdayPage.findOne({ _id: req.params.id, owner: req.user._id });
  if (!page) throw new HttpError(404, 'Birthday page not found.');
  if (data.alias) {
    data.alias = normaliseAlias(data.alias);
    if (await BirthdayPage.exists({ _id: { $ne: page._id }, alias: data.alias })) throw new HttpError(409, 'That birthday alias is already in use.');
  }
  if (data.cover?.fileId) data.cover = await verifyImageKitFile(data.cover.fileId, req.user._id);
  if (data.appearance) {
    const oldAppearanceIds = new Set([page.appearance?.backgroundImage?.fileId, ...(page.appearance?.stickerItems || []).map((item) => item.fileId)].filter(Boolean));
    if (data.appearance.backgroundImage?.fileId) data.appearance.backgroundImage = await verifyImageKitFile(data.appearance.backgroundImage.fileId, req.user._id);
    if (Array.isArray(data.appearance.stickerItems)) data.appearance.stickerItems = await Promise.all(data.appearance.stickerItems.map(async (item) => item.fileId ? { ...item, ...(await verifyImageKitFile(item.fileId, req.user._id)) } : item));
    const nextAppearanceIds = new Set([data.appearance.backgroundImage?.fileId, ...(data.appearance.stickerItems || []).map((item) => item.fileId)].filter(Boolean));
    const removedAppearanceIds = [...oldAppearanceIds].filter((id) => !nextAppearanceIds.has(id));
    if (removedAppearanceIds.length) await stageImageDeletions(removedAppearanceIds);
  }
  if (data.gallery) {
    data.gallery = await Promise.all(data.gallery.map(async (image) => ({ ...(await verifyImageKitFile(image.fileId, req.user._id)), caption: image.caption || '' })));
  }
  const oldFiles = [];
  if (data.cover?.fileId && page.cover?.fileId && data.cover.fileId !== page.cover.fileId) oldFiles.push(page.cover.fileId);
  if (data.gallery) {
    const keep = new Set(data.gallery.map((item) => item.fileId));
    for (const item of page.gallery) if (item.fileId && !keep.has(item.fileId)) oldFiles.push(item.fileId);
  }
  // Queued cleanup jobs are reference-checked by the worker. They remain safe
  // even if this document save succeeds but a later cleanup operation fails.
  await stageImageDeletions(oldFiles);
  Object.assign(page, data);
  await page.save();
  res.json({ page });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const page = await BirthdayPage.findOne({ _id: req.params.id, owner: req.user._id });
  if (!page) throw new HttpError(404, 'Birthday page not found.');
  const files = [page.cover?.fileId, ...page.gallery.map((item) => item.fileId), page.appearance?.backgroundImage?.fileId, ...(page.appearance?.stickerItems || []).map((item) => item.fileId)].filter(Boolean);
  await stageImageDeletions(files);
  await page.deleteOne();
  res.status(204).end();
}));

export default router;
