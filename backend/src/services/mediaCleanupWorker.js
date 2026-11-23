import MediaDeletionJob from '../models/MediaDeletionJob.js';
import User from '../models/User.js';
import BirthdayPage from '../models/BirthdayPage.js';
import { deleteImageKitFile, deleteImageKitFolder } from './imagekit.js';

let running = false;

async function isStillReferenced(fileId) {
  const [userReference, birthdayReference] = await Promise.all([
    User.exists({ $or: [
      { 'profile.avatar.fileId': fileId },
      { 'profile.qr.logo.fileId': fileId },
      { 'profile.products.image.fileId': fileId }
    ] }),
    BirthdayPage.exists({ $or: [
      { 'cover.fileId': fileId },
      { 'gallery.fileId': fileId }
    ] })
  ]);
  return Boolean(userReference || birthdayReference);
}

export function startMediaCleanupWorker() {
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      // Both queued and pending jobs are inspected. A job is never allowed to
      // delete a file while any live user/product/birthday document references it.
      const jobs = await MediaDeletionJob.find({ status: { $in: ['queued', 'pending'] }, nextAttemptAt: { $lte: new Date() } })
        .sort({ createdAt: 1 }).limit(5);
      for (const job of jobs) {
        try {
          if (job.type === 'user-folder') {
            // The job is staged before the MongoDB cascade. Do not remove remote
            // assets until the owning account is actually gone.
            if (await User.exists({ _id: job.ownerId })) {
              await MediaDeletionJob.updateOne({ _id: job._id }, { $set: { nextAttemptAt: new Date(Date.now() + 60_000) } });
              continue;
            }
            await deleteImageKitFolder(job.folderPath);
            await MediaDeletionJob.deleteOne({ _id: job._id });
            continue;
          }
          if (await isStillReferenced(job.fileId)) {
            await MediaDeletionJob.updateOne({ _id: job._id }, { $set: { nextAttemptAt: new Date(Date.now() + 5 * 60_000) } });
            continue;
          }
          await deleteImageKitFile(job.fileId);
          await MediaDeletionJob.deleteOne({ _id: job._id });
        } catch (error) {
          const attempts = job.attempts + 1;
          const delay = Math.min(360, 2 ** Math.min(attempts, 8));
          await MediaDeletionJob.updateOne({ _id: job._id }, { $set: {
            attempts,
            lastError: error.message.slice(0, 500),
            status: 'pending',
            nextAttemptAt: new Date(Date.now() + delay * 60_000)
          } });
          console.error(`[media-cleanup] ${job.type === 'user-folder' ? job.folderPath : job.fileId} failed (attempt ${attempts}): ${error.message}`);
        }
      }
    } catch (error) {
      console.error('[media-cleanup] worker error:', error.message);
    } finally {
      running = false;
    }
  }, 30_000);
  timer.unref();
  return timer;
}
