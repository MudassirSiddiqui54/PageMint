import mongoose from 'mongoose';

const mediaDeletionJobSchema = new mongoose.Schema({
  type: { type: String, enum: ['file', 'user-folder'], default: 'file', required: true },
  fileId: { type: String, default: undefined },
  ownerId: { type: String, default: undefined },
  folderPath: { type: String, default: undefined },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ['queued', 'pending', 'failed'], default: 'pending', index: true },
  lastError: { type: String, default: '' }
}, { timestamps: true });

// File jobs are unique by ImageKit file ID; folder jobs are unique per account.
mediaDeletionJobSchema.index({ fileId: 1 }, { unique: true, partialFilterExpression: { type: 'file', fileId: { $type: 'string' } } });
mediaDeletionJobSchema.index({ ownerId: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'user-folder', ownerId: { $type: 'string' } } });
mediaDeletionJobSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });

export default mongoose.model('MediaDeletionJob', mediaDeletionJobSchema);
