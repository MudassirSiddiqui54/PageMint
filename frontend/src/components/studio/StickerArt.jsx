import {
  Sparkles, Heart, Flower2, Gift, CakeSlice, PartyPopper, Star, Music2,
  Camera, Cat, PawPrint, Sun, MoonStar, Coffee, Crown, Cherry, Rainbow,
  Rocket, Flame, Gem, Bell, Ghost, Waves, Cloud, Snowflake, Leaf, TreePine,
  Mountain, Plane, Bike, Car, Footprints, BookOpen, Trophy, Medal, Anchor,
  Fish, Dog, Home, Lightbulb, Headphones, Mic, Film, Paintbrush, Palette,
  Laptop, Gamepad2, Glasses
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const stickerCatalog = [
  ['sparkles', 'Sparkle burst', Sparkles, '#FFE07A', '#8A5A00'],
  ['heart', 'Heart', Heart, '#FF8FA8', '#8C1735'],
  ['flower', 'Flower', Flower2, '#F8B4D9', '#74345E'],
  ['gift', 'Gift box', Gift, '#8ED8B5', '#15583E'],
  ['cake', 'Birthday cake', CakeSlice, '#FFBF91', '#81421D'],
  ['party', 'Party popper', PartyPopper, '#BBA8FF', '#49318A'],
  ['star', 'Star', Star, '#FFD36B', '#77500B'],
  ['music', 'Music note', Music2, '#A5C9FF', '#204D91'],
  ['camera', 'Camera', Camera, '#9FD9DC', '#1C5D62'],
  ['cat', 'Lucky cat', Cat, '#FFD0A8', '#87451F'],
  ['paw', 'Paw print', PawPrint, '#D4B6FF', '#51317E'],
  ['sun', 'Sunshine', Sun, '#FFE18B', '#875900'],
  ['moon', 'Moon', MoonStar, '#C7D2FF', '#374C9A'],
  ['coffee', 'Coffee cup', Coffee, '#DAB69A', '#60422D'],
  ['crown', 'Crown', Crown, '#F6D36B', '#795500'],
  ['cherry', 'Cherry', Cherry, '#FF9BA5', '#9A263B'],
  ['rainbow', 'Rainbow', Rainbow, '#B7C9FF', '#3E4F97'],
  ['rocket', 'Rocket', Rocket, '#FFA98E', '#87361D'],
  ['flame', 'Flame', Flame, '#FFB66F', '#8E381B'],
  ['gem', 'Gemstone', Gem, '#9DE0D5', '#1D6F67'],
  ['bell', 'Bell', Bell, '#FFE1A2', '#805A14'],
  ['ghost', 'Friendly ghost', Ghost, '#D8DDF5', '#596181'],
  ['balloon', 'Balloon', PartyPopper, '#FFC0D0', '#8B3453'],
  ['shell', 'Seashell', Waves, '#B7D8EA', '#315A76'],
  ['cloud', 'Cloud puff', Cloud, '#DDEAF8', '#42617D'],
  ['snowflake', 'Snowflake', Snowflake, '#C7E8F4', '#27617B'],
  ['leaf', 'Little leaf', Leaf, '#B9E0B9', '#326A3B'],
  ['tree', 'Tiny tree', TreePine, '#B8D8B5', '#2F6540'],
  ['mountain', 'Mountain peak', Mountain, '#C8D4E7', '#415A7B'],
  ['plane', 'Paper plane', Plane, '#C6D9F5', '#365B96'],
  ['bike', 'Bicycle', Bike, '#FFD0A1', '#8B4B20'],
  ['car', 'Little car', Car, '#FFC2C2', '#963E42'],
  ['footprints', 'Footprints', Footprints, '#D7C7F3', '#5D4887'],
  ['book', 'Open book', BookOpen, '#F4D79B', '#76551D'],
  ['trophy', 'Trophy', Trophy, '#F8D77D', '#855D13'],
  ['medal', 'Medal', Medal, '#F5C4A0', '#8C5129'],
  ['anchor', 'Anchor', Anchor, '#BCDCE9', '#2F6178'],
  ['fish', 'Little fish', Fish, '#A9DDE0', '#24666B'],
  ['dog', 'Happy dog', Dog, '#E7C3A0', '#704A2E'],
  ['home', 'Cozy home', Home, '#F4C7B6', '#884C3A'],
  ['lightbulb', 'Bright idea', Lightbulb, '#FFE69A', '#86600C'],
  ['headphones', 'Headphones', Headphones, '#C6D4F4', '#40558D'],
  ['microphone', 'Microphone', Mic, '#D6C8F0', '#5D4787'],
  ['film', 'Film frame', Film, '#D7DCE6', '#49556A'],
  ['paintbrush', 'Paintbrush', Paintbrush, '#F3C6D9', '#874663'],
  ['palette', 'Artist palette', Palette, '#E9C9A9', '#825331'],
  ['laptop', 'Laptop', Laptop, '#C7D7E8', '#3E5875'],
  ['gamepad', 'Game controller', Gamepad2, '#C8D3F5', '#43538E'],
  ['glasses', 'Cool glasses', Glasses, '#F4C2BB', '#8E4545']
].map(([id, name, Icon, bg, fg]) => ({ id, name, Icon, bg, fg }));

export function StickerArt({ stickerId, customUrl, size = 68, selected = false }) {
  const emoji = typeof stickerId === 'string' && stickerId.startsWith('emoji:') ? stickerId.slice(6) : '';
  const item = stickerCatalog.find((entry) => entry.id === stickerId) || stickerCatalog[0];
  const Icon = item.Icon;
  return (
    <span className={`pm-sticker-art${selected ? ' is-selected' : ''}${customUrl ? ' pm-custom-sticker' : ''}`} style={{ width: size, height: size, background: customUrl ? 'transparent' : emoji ? 'transparent' : item.bg, color: item.fg }} aria-label={customUrl ? 'Custom sticker' : item.name}>
      {customUrl ? <img src={customUrl} alt="Custom sticker" draggable="false"/> : emoji ? <span className="pm-sticker-emoji" style={{ fontSize: `${size * 0.82}px` }} aria-hidden="true">{emoji}</span> : <Icon size={Math.round(size * 0.57)} strokeWidth={2.35} />}
    </span>
  );
}

export function StickerPicker({ onChoose, selected = [] }) {
  const [query, setQuery] = useState('');
  const items = useMemo(() => stickerCatalog.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="pm-sticker-library-content">
      <label className="pm-sticker-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search illustrated stickers…"/></label>
      <div className="pm-sticker-picker">
      {items.map((item) => (
        <button type="button" key={item.id} onClick={() => onChoose(item.id)} className={selected.includes(item.id) ? 'is-active' : ''} title={item.name}>
          <StickerArt stickerId={item.id} size={48} />
          <span>{item.name}</span>
        </button>
      ))}
      {!items.length && <p className="pm-sticker-empty">No stickers match that search.</p>}
      </div>
    </div>
  );
}

export { stickerCatalog };
