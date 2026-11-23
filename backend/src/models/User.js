import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  fileId: { type: String, default: '' }
}, { _id: false });

const linkSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  platform: { type: String, default: 'custom' },
  label: { type: String, required: true, trim: true, maxlength: 60 },
  url: { type: String, required: true, trim: true, maxlength: 2048 },
  icon: { type: String, default: 'link' },
  iconFamily: { type: String, enum: ['brand', 'lucide', 'fontawesome', 'text'], default: 'brand' },
  iconStyle: { type: String, enum: ['brand', 'black', 'white', 'custom'], default: 'brand' },
  iconColor: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  position: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  price: { type: String, default: '', maxlength: 40 },
  url: { type: String, required: true, maxlength: 2048 },
  image: { type: mediaSchema, default: () => ({}) },
  enabled: { type: Boolean, default: true },
  position: { type: Number, default: 0 }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  published: { type: Boolean, default: true },
  alias: { type: String, required: true, lowercase: true, trim: true },
  displayName: { type: String, default: '', trim: true, maxlength: 60 },
  bio: { type: String, default: '', maxlength: 180 },
  avatar: { type: mediaSchema, default: () => ({}) },
  links: { type: [linkSchema], default: [] },
  products: { type: [productSchema], default: [] },
  appearance: { type: mongoose.Schema.Types.Mixed, default: () => ({
    background: 0, font: 0, palette: 1, alignment: 'center',
    linkLayout: 'list', productLayout: 'grid', logoStyle: 0, cardStyle: 0, avatarStyle: 0, stickerPosition: 'bottom-center', stickers: []
  }) },
  qr: { type: mongoose.Schema.Types.Mixed, default: () => ({ color: '#1b1b2a', background: '#ffffff', correction: 'H', frame: 0 }) },
  stats: { views: { type: Number, default: 0 } }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 24, match: /^[a-z0-9_]+$/ },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  profile: { type: profileSchema, required: true },
  createdAt: { type: Date, default: Date.now, immutable: true }
}, { timestamps: true, versionKey: false });

userSchema.index({ 'profile.alias': 1 }, { unique: true });
export default mongoose.model('User', userSchema);
