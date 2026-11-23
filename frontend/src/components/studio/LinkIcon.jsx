import {
  Globe, Mail, Phone, CalendarDays, Briefcase, ShoppingBag, Link2,
  Store, MapPin, FileText, Music2, Video, MessageCircle
} from 'lucide-react';
import * as SiIcons from 'react-icons/si';
import {
  FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaTwitter, FaLinkedinIn,
  FaGithub, FaPinterestP, FaDiscord, FaSpotify, FaWhatsapp, FaTelegram,
  FaRedditAlien, FaTwitch, FaSnapchatGhost, FaDribbble, FaBehance,
  FaAmazon, FaEtsy, FaMedium, FaFigma, FaCodepen, FaGlobe,
  FaEnvelope, FaPhone, FaLink, FaStore, FaCalendarAlt, FaBriefcase
} from 'react-icons/fa';

const brandIcons = {
  Instagram: SiIcons.SiInstagram, Facebook: SiIcons.SiFacebook, TikTok: SiIcons.SiTiktok, YouTube: SiIcons.SiYoutube,
  X: SiIcons.SiX, Threads: SiIcons.SiThreads, LinkedIn: SiIcons.SiLinkedin, GitHub: SiIcons.SiGithub, Behance: SiIcons.SiBehance,
  Dribbble: SiIcons.SiDribbble, Pinterest: SiIcons.SiPinterest, Snapchat: SiIcons.SiSnapchat, Discord: SiIcons.SiDiscord,
  Twitch: SiIcons.SiTwitch, Spotify: SiIcons.SiSpotify, SoundCloud: SiIcons.SiSoundcloud, WhatsApp: SiIcons.SiWhatsapp,
  Telegram: SiIcons.SiTelegram, Reddit: SiIcons.SiReddit, Medium: SiIcons.SiMedium, Substack: SiIcons.SiSubstack,
  Figma: SiIcons.SiFigma, CodePen: SiIcons.SiCodepen, 'Stack Overflow': SiIcons.SiStackoverflow,
  'Product Hunt': SiIcons.SiProducthunt, Patreon: SiIcons.SiPatreon, 'Buy Me a Coffee': SiIcons.SiBuymeacoffee,
  'Ko-fi': SiIcons.SiKofi, Amazon: SiIcons.SiAmazon, Etsy: SiIcons.SiEtsy
};
const faIcons = {
  Instagram: FaInstagram, Facebook: FaFacebookF, TikTok: FaTiktok, YouTube: FaYoutube,
  X: FaTwitter, Threads: FaTwitter, LinkedIn: FaLinkedinIn, GitHub: FaGithub,
  Pinterest: FaPinterestP, Discord: FaDiscord, Spotify: FaSpotify, WhatsApp: FaWhatsapp,
  Telegram: FaTelegram, Reddit: FaRedditAlien, Twitch: FaTwitch, Snapchat: FaSnapchatGhost,
  Dribbble: FaDribbble, Behance: FaBehance, Amazon: FaAmazon, Etsy: FaEtsy,
  Medium: FaMedium, Figma: FaFigma, CodePen: FaCodepen, Website: FaGlobe,
  Portfolio: FaBriefcase, Email: FaEnvelope, Phone: FaPhone, Custom: FaLink,
  Store: FaStore, Calendar: FaCalendarAlt
};
const lucideIcons = {
  Website: Globe, Portfolio: Briefcase, Email: Mail, Phone, Calendar: CalendarDays,
  Store, Shop: ShoppingBag, Custom: Link2, Podcast: Music2, Video, Message: MessageCircle,
  Location: MapPin, Document: FileText
};
const officialColors = {
  Instagram: '#D62976', Facebook: '#0866FF', TikTok: '#111111', YouTube: '#FF0033',
  X: '#111111', Threads: '#111111', LinkedIn: '#0A66C2', GitHub: '#181717',
  Behance: '#1769FF', Dribbble: '#EA4C89', Pinterest: '#BD081C', Snapchat: '#F5C518',
  Discord: '#5865F2', Twitch: '#9146FF', Spotify: '#1DB954', SoundCloud: '#FF5500',
  WhatsApp: '#25D366', Telegram: '#26A5E4', Reddit: '#FF4500', Medium: '#111111',
  Substack: '#FF6719', Figma: '#F24E1E', CodePen: '#111111', 'Stack Overflow': '#F48024',
  'Product Hunt': '#DA552F', Patreon: '#FF424D', 'Buy Me a Coffee': '#FFDD00',
  'Ko-fi': '#FF5E5B', Amazon: '#FF9900', Etsy: '#F1641E'
};

export function LinkIcon({ link, size = 22 }) {
  const name = link?.icon || link?.platform || 'Website';
  const family = link?.iconFamily || 'brand';
  const Icon = family === 'lucide' ? (lucideIcons[name] || Link2) : family === 'fontawesome' ? (faIcons[name] || FaLink) : (brandIcons[name] || faIcons[name] || lucideIcons[name] || Link2);
  const style = link?.iconStyle || 'brand';
  const color = style === 'brand' ? (officialColors[name] || link?.iconColor || 'currentColor') : style === 'white' ? '#FFFFFF' : style === 'custom' ? (link?.iconColor || '#333333') : '#171717';
  return <Icon size={size} color={color} aria-hidden="true" />;
}

export const iconFamilies = [
  { id: 'brand', label: 'Simple Icons · official brand marks' },
  { id: 'fontawesome', label: 'Font Awesome' },
  { id: 'lucide', label: 'Lucide outline icons' }
];
export const iconStyles = [
  { id: 'brand', label: 'Official brand colour' },
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
  { id: 'custom', label: 'Custom colour' }
];

export const iconOptions = {
  brand: Object.keys(brandIcons),
  fontawesome: Object.keys(faIcons),
  lucide: Object.keys(lucideIcons)
};
