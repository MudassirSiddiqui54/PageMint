import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('dashboard has both named and default exports', async () => {
  const source = await read('./src/pages/Dashboard.jsx');
  assert.match(source, /export function Dashboard\(/);
  assert.match(source, /export default Dashboard/);
});

test('frontend is client-rendered and uses the configurable API origin', async () => {
  const [entry, api, viteConfig] = await Promise.all([
    read('./src/main.jsx'),
    read('./src/lib/api.js'),
    read('./vite.config.js')
  ]);
  assert.match(entry, /createRoot\(/);
  assert.doesNotMatch(entry, /hydrateRoot\(/);
  assert.match(api, /import\.meta\.env\.VITE_API_URL/);
  assert.match(viteConfig, /env\.VITE_PORT \|\| 5173/);
});

test('backend and frontend each have their own package manifest', async () => {
  await access(new URL('../backend/package.json', import.meta.url));
  await access(new URL('./package.json', import.meta.url));
  await assert.rejects(access(new URL('../package.json', import.meta.url)));
});

test('ImageKit uploads use the file upload endpoint and validate returned identifiers', async () => {
  const source = await read('./src/lib/imagekit.js');
  assert.match(source, /api\/v1\/files\/upload/);
  assert.match(source, /result\.fileId/);
  assert.match(source, /result\.url/);
});

test('signed-out bootstrap uses the quiet session endpoint', async () => {
  const source = await read('./src/lib/AuthContext.jsx');
  assert.match(source, /api\.get\('\/auth\/session'\)/);
  assert.match(source, /sessionBootstrap/);
});

test('visual page editor uses the full-page canvas and floating contextual inspector', async () => {
  const [editor, canvas, styles] = await Promise.all([
    read('./src/components/studio/VisualPageStudio.jsx'),
    read('./src/components/studio/PageCanvas.jsx'),
    read('./src/components/studio/studio.css')
  ]);
  assert.match(editor, /PageCanvas profile=\{draft\}/);
  assert.match(editor, /onPointerMove|onMove=\{\(id, point\) => id\.startsWith\('text:'\)/);
  assert.match(editor, /pm-inspector-close/);
  assert.match(canvas, /backgroundColor: appearance\.backgroundColor/);
  assert.match(styles, /\.pm-page-shell\{width:100%;max-width:none/);
});

test('birthday pages require a date, support batch memories and expose multiple collage layouts', async () => {
  const [studio, routes, canvas] = await Promise.all([
    read('./src/components/BirthdayStudio.jsx'),
    read('../backend/src/routes/birthday.routes.js'),
    read('./src/components/studio/BirthdayCanvas.jsx')
  ]);
  assert.match(studio, /dateOfBirth: form\.dateOfBirth/);
  assert.match(studio, /multiple accept=/);
  assert.match(studio, /saveMemoryCaption/);
  assert.match(routes, /dateOfBirth: z\.coerce\.date\(\)/);
  for (const layout of ['collage','masonry','grid','polaroid','filmstrip']) assert.ok(studio.includes(`value=\"${layout}\"`), `missing ${layout} option`);
  assert.match(canvas, /layout-\$\{galleryLayout\}/);
});

test('QR designer exposes styled module geometry, finder eyes, pupils and shape options', async () => {
  const source = await read('./src/components/QRSettings.jsx');
  assert.match(source, /from 'qr-code-styling'/);
  assert.match(source, /cornersSquareOptions/);
  assert.match(source, /cornersDotOptions/);
  assert.match(source, /Outer eye frame/);
  assert.match(source, /Inner pupil/);
  assert.match(source, /MiniQrPreset/);
  assert.match(source, /shape: settings\.shape/);
  assert.match(source, /Download SVG/);
  assert.match(source, /Download PNG/);
  assert.match(source, /function MiniQrPreset/);
  assert.match(source, /new QRCodeStyling\(\{/);
  assert.match(source, /<MiniQrPreset preset=\{preset\}\/>/);
  const styles = await read('./src/components/studio/studio.css');
  assert.match(styles, /\.pm-qr-workspace\{[^}]*grid-template-columns/);
  assert.match(styles, /\.pm-qr-mini-preview/);
});


test('link editor displays searchable icon-family choices and colour treatments', async () => {
  const [editor, icons] = await Promise.all([
    read('./src/components/studio/VisualPageStudio.jsx'),
    read('./src/components/studio/LinkIcon.jsx')
  ]);
  assert.match(editor, /Find an icon/);
  assert.match(editor, /pm-icon-choice-grid/);
  assert.match(icons, /Simple Icons/);
  assert.match(icons, /Font Awesome/);
  assert.match(icons, /Lucide/);
  assert.match(icons, /Official brand colour/);
  assert.match(icons, /Custom colour/);
});

test('the visual sticker library contains at least 40 searchable non-emoji vector assets', async () => {
  const source = await read('./src/components/studio/StickerArt.jsx');
  const rows = source.split('].map(([id, name, Icon, bg, fg])')[0].match(/^\s+\['[^']+'/gm) || [];
  assert.ok(rows.length >= 40, `found only ${rows.length} sticker entries`);
  assert.match(source, /Search illustrated stickers/);
  assert.match(source, /<Icon size=\{/);
});

test('profile and birthday canvases render centered responsive cards with independent page backgrounds', async () => {
  const [profile, birthday] = await Promise.all([read('./src/components/studio/PageCanvas.jsx'), read('./src/components/studio/BirthdayCanvas.jsx')]);
  assert.match(profile, /pm-profile-card/);
  assert.match(birthday, /pm-profile-card/);
  assert.match(profile, /cardBackground/);
  assert.match(birthday, /cardBackground/);
});

test('element inspector exposes transform and common CSS controls', async () => {
  const [editor, birthday] = await Promise.all([read('./src/components/studio/VisualPageStudio.jsx'), read('./src/components/BirthdayStudio.jsx')]);
  for (const source of [editor, birthday]) {
    assert.match(source, /Rotation/);
    assert.match(source, /Font size/);
    assert.match(source, /Border radius/);
    assert.match(source, /Shadow/);
  }
});

test('custom sticker upload supports GIF and ImageKit-backed assets', async () => {
  const [editor, birthday, art] = await Promise.all([read('./src/components/studio/VisualPageStudio.jsx'), read('./src/components/BirthdayStudio.jsx'), read('./src/components/studio/StickerArt.jsx')]);
  assert.match(editor, /image\/gif/);
  assert.match(birthday, /image\/gif/);
  assert.match(art, /customUrl/);
});

test('inspector panel has pointer-driven movable behavior', async () => {
  const [hook, editor, birthday] = await Promise.all([read('./src/components/studio/useMovablePanel.js'), read('./src/components/studio/VisualPageStudio.jsx'), read('./src/components/BirthdayStudio.jsx')]);
  assert.match(hook, /pointermove/);
  assert.match(editor, /movablePanel\.handlePointerDown/);
  assert.match(birthday, /movablePanel\.handlePointerDown/);
});

test('profile and birthday canvases render persisted custom text elements', async () => {
  const profileCanvas = await read('src/components/studio/PageCanvas.jsx');
  const birthdayCanvas = await read('src/components/studio/BirthdayCanvas.jsx');
  const textCanvas = await read('src/components/studio/TextCanvasItems.jsx');
  assert.match(profileCanvas, /TextCanvasItems/);
  assert.match(birthdayCanvas, /TextCanvasItems/);
  assert.match(textCanvas, /onPointerMove/);
  assert.match(textCanvas, /fontFamily/);
});

test('custom text inspector exposes typography, transforms, spacing, borders and shadows', async () => {
  const inspector = await read('src/components/studio/TextElementInspector.jsx');
  for (const property of ['fontSize','fontWeight','fontFamily','letterSpacing','rotation','padding','borderRadius','boxShadow','textShadow','opacity']) assert.ok(inspector.includes(property), `Missing ${property}`);
});

test('birthday copy is independently selectable, styled and removable', async () => {
  const [canvas, studio] = await Promise.all([
    read('./src/components/studio/BirthdayCanvas.jsx'),
    read('./src/components/BirthdayStudio.jsx')
  ]);
  for (const id of ['headline', 'recipientName', 'birthdayMessage']) {
    assert.match(canvas, new RegExp(`id="${id}"`));
    assert.match(studio, new RegExp(`updateElementStyle\\(selected`));
  }
  assert.match(canvas, /appearance\.elementStyles/);
  assert.match(studio, /Remove this element from the page/);
  assert.match(studio, /delete layout\[key\]/);
});

test('celebration effects are mounted as a full-page sibling, not clipped inside the birthday card', async () => {
  const [canvas, styles] = await Promise.all([
    read('./src/components/studio/BirthdayCanvas.jsx'),
    read('./src/components/studio/studio.css')
  ]);
  assert.match(canvas, /<CelebrationEffects effects=\{effectList\} settings=\{effectSettings\}\/?>/);
  assert.match(canvas, /<div className="pm-bday-stage pm-profile-card"/);
  assert.match(styles, /\.pm-bday-page-effects\{position:absolute;inset:0/);
});

test('profile and birthday cards use independent page-background presets without overriding page themes', async () => {
  const [profileEditor, profileCanvas, birthdayEditor, birthdayCanvas] = await Promise.all([
    read('./src/components/studio/VisualPageStudio.jsx'),
    read('./src/components/studio/PageCanvas.jsx'),
    read('./src/components/BirthdayStudio.jsx'),
    read('./src/components/studio/BirthdayCanvas.jsx')
  ]);
  for (const source of [profileEditor, birthdayEditor]) {
    assert.match(source, /Card background/);
    assert.match(source, /pageBackgrounds\.map/);
    assert.match(source, /cardBackgroundId/);
    assert.match(source, /backgroundImageUrl: ''/);
  }
  assert.match(profileEditor, /setCardBackground/);
  assert.match(birthdayEditor, /setCardBackground/);
  assert.match(profileCanvas, /appearance\.cardBackgroundImage/);
  assert.match(birthdayCanvas, /appearance\.cardBackgroundImage/);
  assert.doesNotMatch(profileEditor, /cardThemes\.map|Card fine tuning/);
  assert.doesNotMatch(birthdayEditor, /cardThemes\.map|Card fine tuning/);
  assert.doesNotMatch(profileCanvas, /appearance\.cardText|appearance\.cardAccent|appearance\.cardFont/);
  assert.doesNotMatch(birthdayCanvas, /appearance\.cardText|appearance\.cardAccent|appearance\.cardFont/);
});

test('birthday celebration CTA only appears when an active celebration effect is selected', async () => {
  const canvas = await read('./src/components/studio/BirthdayCanvas.jsx');
  assert.match(canvas, /const activeCelebration = \(appearance\.effects \|\| \[\]\)\.some/);
  assert.match(canvas, /!editable && activeCelebration && <button/);
  assert.match(canvas, /snowAmount/);
  assert.match(canvas, /rainAmount/);
  assert.match(canvas, /windAmount/);
  assert.match(canvas, /sparklesAmount/);
});

test('QR logo upload receives the authenticated user and validates image upload state', async () => {
  const [dashboard, qr] = await Promise.all([read('./src/pages/Dashboard.jsx'), read('./src/components/QRSettings.jsx')]);
  assert.match(dashboard, /<QRSettings profile=\{profile\} user=\{user\}/);
  assert.match(qr, /uploadImage\(file, `pagemint\/\$\{user\.id\}\/qr`\)/);
  assert.match(qr, /QR logo uploaded and applied to the preview/);
});

test('emoji stickers can be typed on both editors and custom GIFs can be uploaded', async () => {
  const [profile, birthday] = await Promise.all([read('./src/components/studio/VisualPageStudio.jsx'), read('./src/components/BirthdayStudio.jsx')]);
  for (const source of [profile, birthday]) {
    assert.match(source, /Type an emoji sticker/);
    assert.match(source, /onPaste=\{handleStickerPaste\}/);
    assert.match(source, /image\/gif/);
  }
});

test('inspectors are portaled outside the preview and can be dragged against the viewport', async () => {
  const [profile, birthday, hook] = await Promise.all([read('./src/components/studio/VisualPageStudio.jsx'), read('./src/components/BirthdayStudio.jsx'), read('./src/components/studio/useMovablePanel.js')]);
  assert.match(profile, /createPortal\([\s\S]*document\.body\)/);
  assert.match(birthday, /createPortal\([\s\S]*document\.body\)/);
  assert.match(hook, /window\.innerWidth/);
  assert.match(hook, /window\.innerHeight/);
});

test('custom text boxes can be resized directly on the canvas', async () => {
  const textCanvas = await read('./src/components/studio/TextCanvasItems.jsx');
  const styles = await read('./src/components/studio/studio.css');
  assert.match(textCanvas, /data-resize-handle/);
  assert.match(textCanvas, /mode: 'resize'/);
  assert.match(textCanvas, /startWidth/);
  assert.match(styles, /\.pm-text-resize-handle/);
});

test('profile card height ignores stale saved layoutHeight and deleted elements', async () => {
  const canvas = await read('./src/components/studio/PageCanvas.jsx');
  assert.match(canvas, /activeLayoutIds/);
  assert.match(canvas, /if \(!activeLayoutIds\.has\(id\)\) return bottom/);
  assert.match(canvas, /const pageHeight = Math\.max\(layoutBottom, stickerBottom, textBottom\)/);
  assert.doesNotMatch(canvas, /appearance\.layoutHeight\s*\|\|/);
});


test('profile studio exposes a persistent publish/unpublish control', async () => {
  const editor = await read('./src/components/studio/VisualPageStudio.jsx');
  const styles = await read('./src/components/studio/studio.css');
  assert.match(editor, /togglePublished/);
  assert.match(editor, /api\.patch\('\/profile\/me', \{ published: nextPublished \}\)/);
  assert.match(editor, /Unpublish page/);
  assert.match(editor, /Publish page/);
  assert.match(styles, /\.pm-publish-status/);
});
