// Active design catalogues only. Legacy card/emoji/colour-only presets were removed.

export const logoPresets = [
  ['Instagram','◎'],['Facebook','f'],['TikTok','♪'],['YouTube','▶'],['X','𝕏'],['Threads','@'],['LinkedIn','in'],['GitHub','⌘'],['Behance','Bē'],['Dribbble','◉'],
  ['Pinterest','ℙ'],['Snapchat','♢'],['Discord','◈'],['Twitch','▣'],['Spotify','◖'],['SoundCloud','☁'],['WhatsApp','◔'],['Telegram','➤'],['Reddit','●'],['Medium','M'],
  ['Substack','✉'],['Website','↗'],['Portfolio','▤'],['Email','✉'],['Phone','⌕'],['Calendar','▦'],['Store','◇'],['Shop','▣'],['Amazon','a'],['Etsy','E'],
  ['Figma','◉'],['CodePen','⌘'],['Stack Overflow','∩'],['Product Hunt','P'],['Patreon','P'],['Buy Me a Coffee','☕'],['Ko-fi','♥'],['Twitch Live','▣'],['Podcast','◉'],['Custom','＋']
].map(([name, glyph], id) => ({ id, name, glyph }));


const platformUrls = {
  Instagram: 'https://www.instagram.com/', Facebook: 'https://www.facebook.com/', TikTok: 'https://www.tiktok.com/',
  YouTube: 'https://www.youtube.com/', X: 'https://x.com/', Threads: 'https://www.threads.net/',
  LinkedIn: 'https://www.linkedin.com/', GitHub: 'https://github.com/', Behance: 'https://www.behance.net/',
  Dribbble: 'https://dribbble.com/', Pinterest: 'https://www.pinterest.com/', Snapchat: 'https://www.snapchat.com/',
  Discord: 'https://discord.com/', Twitch: 'https://www.twitch.tv/', Spotify: 'https://open.spotify.com/',
  SoundCloud: 'https://soundcloud.com/', WhatsApp: 'https://wa.me/', Telegram: 'https://t.me/',
  Reddit: 'https://www.reddit.com/', Medium: 'https://medium.com/', Substack: 'https://substack.com/',
  Website: 'https://', Portfolio: 'https://', Email: 'mailto:you@example.com', Phone: 'tel:+10000000000', Calendar: 'https://',
  Store: 'https://', Shop: 'https://', Amazon: 'https://www.amazon.com/', Etsy: 'https://www.etsy.com/',
  Figma: 'https://www.figma.com/', CodePen: 'https://codepen.io/', 'Stack Overflow': 'https://stackoverflow.com/',
  'Product Hunt': 'https://www.producthunt.com/', Patreon: 'https://www.patreon.com/',
  'Buy Me a Coffee': 'https://www.buymeacoffee.com/', 'Ko-fi': 'https://ko-fi.com/',
  'Twitch Live': 'https://www.twitch.tv/', Podcast: 'https://'
};
export const platformPresets = logoPresets.slice(0, 40).map((preset) => ({
  ...preset,
  label: preset.name,
  url: platformUrls[preset.name] || 'https://'
}));


// Pagemint's page-level design catalogue. Backgrounds are intentionally varied:
// solids, paper textures, grids, dots, stripes, checks and layered colour fields.
const backgroundSeeds = [
  ['Warm paper', '#F5F0E7', 'none'], ['Gallery white', '#FAFAF8', 'none'], ['Ink black', '#111318', 'none'],
  ['Midnight blue', '#101B31', 'none'], ['Sage canvas', '#DCE6D7', 'none'], ['Blush canvas', '#F8E4E8', 'none'],
  ['Lemon paper', '#FFF5C9', 'none'], ['Lavender wash', '#EDE6FA', 'none'], ['Clay', '#EBD3C3', 'none'],
  ['Ice blue', '#E2F0F4', 'none'], ['Dot paper', '#F8F6F0', 'radial-gradient(#C9C2B5 1px, transparent 1px)'],
  ['Fine grid', '#F8F8F5', 'linear-gradient(#D9DED9 1px,transparent 1px),linear-gradient(90deg,#D9DED9 1px,transparent 1px)'],
  ['Graph paper', '#EEF2F7', 'linear-gradient(#C7D4E5 1px,transparent 1px),linear-gradient(90deg,#C7D4E5 1px,transparent 1px)'],
  ['Diagonal pinstripe', '#F7F3EB', 'repeating-linear-gradient(135deg,transparent 0 9px,#E8DFD2 10px 11px)'],
  ['Wide stripes', '#F8E9DA', 'repeating-linear-gradient(135deg,transparent 0 28px,#EFD4C0 28px 56px)'],
  ['Checkerboard', '#F8F7F1', 'linear-gradient(45deg,#E5E1D8 25%,transparent 25%),linear-gradient(-45deg,#E5E1D8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E1D8 75%),linear-gradient(-45deg,transparent 75%,#E5E1D8 75%)'],
  ['Soft mesh', '#F2EAF7', 'radial-gradient(at 15% 15%,#F6C9D7 0,transparent 45%),radial-gradient(at 85% 20%,#C6D8F4 0,transparent 45%),radial-gradient(at 50% 95%,#D4EAD9 0,transparent 48%)'],
  ['Sunset field', '#FBE1CE', 'linear-gradient(140deg,#F8C8A6 0%,#F4B9C8 50%,#C8B8E8 100%)'],
  ['Ocean field', '#D9EAF1', 'linear-gradient(145deg,#D7EEF0 0%,#B8D1E9 50%,#C6C8E8 100%)'],
  ['Forest field', '#DDE8D8', 'linear-gradient(145deg,#DDE8D8 0%,#AFC8B4 52%,#668F7F 100%)'],
  ['Noir grain', '#23262A', 'radial-gradient(#ffffff18 0.7px,transparent 0.7px)'],
  ['Rose lattice', '#FAEAF0', 'repeating-linear-gradient(45deg,transparent 0 16px,#EBCAD6 17px 18px),repeating-linear-gradient(-45deg,transparent 0 16px,#EBCAD6 17px 18px)'],
  ['Vertical rhythm', '#F2F2ED', 'repeating-linear-gradient(90deg,transparent 0 18px,#D9DDD5 19px 20px)'],
  ['Horizontal rhythm', '#F1F5F6', 'repeating-linear-gradient(0deg,transparent 0 18px,#D5E0E1 19px 20px)'],
  ['Polka rose', '#FCEEF1', 'radial-gradient(#E8B6C3 2px,transparent 2.5px)'],
  ['Polka mint', '#E9F5EE', 'radial-gradient(#A6CDB7 2px,transparent 2.5px)'],
  ['Terrazzo', '#F4F0E8', 'radial-gradient(ellipse at 15% 20%,#D9AFA3 0 3px,transparent 4px),radial-gradient(ellipse at 70% 65%,#A7BDB0 0 4px,transparent 5px),radial-gradient(ellipse at 85% 15%,#D8C58D 0 3px,transparent 4px)'],
  ['Soft waves', '#E8F0F2', 'repeating-radial-gradient(ellipse at 0 0,transparent 0 18px,#BFD4D9 19px 20px,transparent 21px 36px)'],
  ['Topographic', '#F0EFE7', 'repeating-radial-gradient(ellipse at 40% 50%,transparent 0 12px,#D5D1C3 13px 14px,transparent 15px 26px)'],
  ['Canvas weave', '#EFE8DD', 'repeating-linear-gradient(0deg,#DED4C6 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,#DED4C6 0 1px,transparent 1px 4px)'],
  ['Blueprint', '#172D49', 'linear-gradient(#446381 1px,transparent 1px),linear-gradient(90deg,#446381 1px,transparent 1px)'],
  ['Charcoal dots', '#202329', 'radial-gradient(#65707D 1px,transparent 1.5px)'],
  ['Lilac lines', '#F0ECF8', 'repeating-linear-gradient(0deg,transparent 0 12px,#D9D0EA 13px 14px)'],
  ['Apricot bands', '#F9E9D9', 'repeating-linear-gradient(135deg,#F5D6B7 0 2px,transparent 2px 22px)'],
  ['Speckled linen', '#F5F1E9', 'radial-gradient(#B9B1A4 0.55px,transparent 0.9px)'],
  ['Deep plum', '#302238', 'radial-gradient(at 85% 10%,#694A70 0,transparent 40%),radial-gradient(at 10% 90%,#523C65 0,transparent 45%)'],
  ['Citrus blocks', '#F7F0D8', 'linear-gradient(125deg,#F7E6A6 0 33%,transparent 33% 66%,#E8D7A0 66%)'],
  ['Sea glass', '#E1F0EC', 'radial-gradient(at 20% 20%,#C3E1D9 0,transparent 50%),radial-gradient(at 90% 90%,#A6CFC8 0,transparent 45%)'],
  ['Concrete', '#D8D9D5', 'radial-gradient(#B9BDB8 0.7px,transparent 1px)'],
  ['Night sky', '#171C36', 'radial-gradient(#F6E8B8 0.7px,transparent 1px),radial-gradient(#9DA9E0 0.7px,transparent 1px)'],
  ['Candy blocks', '#FFF0F1', 'linear-gradient(135deg,#F5C5D2 25%,transparent 25%),linear-gradient(315deg,#D9D0F1 25%,transparent 25%)']
];
export const pageBackgrounds = backgroundSeeds.map(([name, color, image], id) => ({
  id, name, color, image: image === 'none' ? 'none' : image,
  size: ['Dot paper','Polka rose','Polka mint','Charcoal dots','Speckled linen'].includes(name) ? '18px 18px' :
    ['Fine grid','Graph paper','Blueprint'].includes(name) ? '22px 22px' :
    ['Checkerboard'].includes(name) ? '24px 24px' : 'auto'
}));

const fontNames = [
  'Bodoni Moda','Playfair Display','DM Serif Display','Cormorant Garamond','Fraunces','Abril Fatface','Cinzel Decorative','Dancing Script','Great Vibes','Sacramento','Allura','Pacifico','Lobster','Righteous','Bebas Neue','Bungee','Unbounded','Syne','Outfit','Sora','Marcellus','Italiana','Yeseva One','Prata','Kaushan Script','Yellowtail','Cookie','Parisienne','Amatic SC','Comfortaa','Baloo 2','Josefin Sans','Quicksand','Josefin Slab','DM Sans','Manrope','Space Grotesk','Plus Jakarta Sans','Archivo','Archivo Black','DM Mono','IBM Plex Sans','Urbanist','Instrument Serif','Gloock','Bricolage Grotesque'
];
export const typefaces = fontNames.map((name, id) => ({
  id, name,
  value: `'${name}', ${['Bodoni Moda','Playfair Display','DM Serif Display','Cormorant Garamond','Fraunces','Abril Fatface','Cinzel Decorative','Marcellus','Italiana','Yeseva One','Prata','Josefin Slab','Instrument Serif','Gloock'].includes(name) ? 'Georgia, serif' : ['JetBrains Mono','Space Mono','IBM Plex Mono','Fira Code','Roboto Mono','Inconsolata'].includes(name) ? 'monospace' : ['Dancing Script','Great Vibes','Sacramento','Allura','Pacifico','Lobster','Kaushan Script','Yellowtail','Cookie','Parisienne'].includes(name) ? 'cursive' : 'Arial, sans-serif'}`
}));

export const pageThemes = [
  ['Paper & ink','#F8F5EF','#22231F','#2F6B57'],['Midnight editorial','#151923','#F7F4ED','#C8A96B'],
  ['Sage studio','#E7EEE4','#24352B','#51765F'],['Rose print','#F9E8EC','#492D39','#B75F7C'],
  ['Gallery monochrome','#F4F4F1','#191919','#777777'],['Ocean notes','#E3F0F2','#1F3E4A','#367D8D'],
  ['Lavender ink','#F0EBF8','#342747','#8064A2'],['Warm terracotta','#F3E4D8','#4A3027','#B9654C'],
  ['Citrus paper','#FFF4CF','#4C401A','#C28B20'],['Forest night','#182C25','#F0F5EE','#94B99F'],
  ['Blueprint','#172D49','#F1F6FC','#76A9D8'],['Lilac dusk','#30233D','#F7F0FA','#C2A0D9'],
  ['Coral daylight','#FFF0E9','#50332D','#DC7865'],['Soft graphite','#25282D','#F1F2F3','#B3C0CE'],
  ['Mint minimal','#EAF5EF','#203B30','#54A17A'],['Plum velvet','#382638','#FFF1F7','#D89AB8'],
  ['Sand & olive','#F1ECDD','#3E3D2C','#858A59'],['Ice & slate','#ECF3F7','#263947','#6A99B7'],
  ['Cherry paper','#FAEAEC','#4B202A','#C34D61'],['Apricot studio','#FFF0E0','#493326','#D8894B'],
  ['Deep teal','#15363A','#F0F8F5','#68B7AA'],['Mauve print','#F0E4EA','#483440','#A67591'],
  ['Neon studio','#171627','#F8F5FF','#A58AFF'],['Cocoa & cream','#F4ECE2','#392D25','#967054'],
  ['Rose gold','#F3E6E1','#4D332C','#B9826D'],['Monsoon blue','#E6ECF6','#283C5A','#6488C4'],
  ['Pistachio','#EDF2DF','#37422B','#819C55'],['Berry paper','#F4E8F3','#4E2F4C','#A66A9F'],
  ['Stone & moss','#E8E7DE','#343A30','#73806A'],['Electric violet','#282047','#F8F4FF','#A58AF5'],
  ['Powder blue','#E8F3FF','#243D56','#6298C5'],['Tangerine','#FFF0D8','#493421','#D87624'],
  ['Quiet luxury','#F2EFE8','#39362E','#9B8966'],['Dark academia','#282622','#F3EADB','#C59C5B'],
  ['Cotton candy','#FCECF4','#493448','#BA7FA8'],['Coastal sage','#E6F0EB','#2D4239','#6A9A86'],
  ['Steel & lilac','#E7E7F1','#303047','#8181AD'],['Olive night','#252B22','#F3F0E4','#B0B77A'],
  ['Soft red','#F8E8E4','#472A28','#C85D51'],['Cloud & charcoal','#EFF1F3','#282D33','#7C8B9A']
].map(([name, background, text, accent], id) => ({ id, name, background, text, accent }));

