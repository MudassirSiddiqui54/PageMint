import mongoose from 'mongoose';

const birthdayPageSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  alias: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 40 },
  recipientName: { type: String, required: true, trim: true, maxlength: 80 },
  // New pages require this field; existing legacy pages can be edited to add it.
  dateOfBirth: { type: Date, required: function () { return this.isNew; } },
  headline: { type: String, default: 'A little celebration, made just for you', maxlength: 120 },
  message: { type: String, default: 'Wishing you a day filled with joy, laughter and everything you love.', maxlength: 3000 },
  cover: { url: { type: String, default: '' }, fileId: { type: String, default: '' } },
  gallery: [{ url: String, fileId: String, caption: { type: String, maxlength: 160 } }],
  wishes: [{ name: { type: String, maxlength: 80 }, message: { type: String, maxlength: 500 }, createdAt: { type: Date, default: Date.now } }],
  appearance: { type: mongoose.Schema.Types.Mixed, default: () => ({ background: 16, font: 10, palette: 13, alignment: 'center', galleryLayout: 'grid', stickers: ['🎂', '🎈', '✨'], effects: ['confetti', 'sparkles'] }) },
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

export default mongoose.model('BirthdayPage', birthdayPageSchema);
