import BirthdayPage from '../models/BirthdayPage.js';
import RefreshSession from '../models/RefreshSession.js';
import User from '../models/User.js';
import { stageImageDeletions, stageUserFolderDeletion } from './imagekit.js';

function collectAccountFileIds(user, birthdayPages) {
  const fileIds = [user.profile?.avatar?.fileId, user.profile?.qr?.logo?.fileId];
  for (const product of user.profile?.products || []) fileIds.push(product.image?.fileId);
  for (const page of birthdayPages) {
    fileIds.push(page.cover?.fileId);
    for (const image of page.gallery || []) fileIds.push(image.fileId);
  }
  return [...new Set(fileIds.filter(Boolean))];
}

/**
 * Schedules remote media cleanup before deleting account records. Folder jobs
 * remain dormant while the account exists, making interrupted cascades safe.
 */
export async function deleteAccountData(user) {
  const ownerId = String(user._id);
  const birthdayPages = await BirthdayPage.find({ owner: user._id }).select('cover.fileId gallery.fileId').lean();
  const fileIds = collectAccountFileIds(user, birthdayPages);

  // Stage both modern folder cleanup and legacy individual-file cleanup first.
  await stageImageDeletions(fileIds);
  await stageUserFolderDeletion(ownerId);

  await RefreshSession.deleteMany({ user: user._id });
  await BirthdayPage.deleteMany({ owner: user._id });
  const result = await User.deleteOne({ _id: user._id });
  if (result.deletedCount !== 1) throw new Error('Account deletion did not remove the expected user record.');

}
