import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Eye, Gift, ImagePlus, Plus, Save, Search, Sticker, Trash2, Upload, X } from 'lucide-react';
import { api, apiError } from '../lib/api';
import { uploadImage } from '../lib/imagekit';
import { pageBackgrounds, pageThemes, typefaces } from '../lib/presets';
import BirthdayCanvas from './studio/BirthdayCanvas';
import TextElementInspector from './studio/TextElementInspector';
import GradientBuilder from './studio/GradientBuilder';
import CardAppearanceControls from './studio/CardAppearanceControls';
import { StickerPicker, StickerArt } from './studio/StickerArt';
import './studio/studio.css';
import useMovablePanel from './studio/useMovablePanel';

const emptyDraft = {
  recipientName: '', dateOfBirth: '', alias: '',
  headline: 'A little celebration, made just for you',
  message: 'Wishing you a day filled with joy, laughter and everything you love.'
};
const defaultAppearance = {
  backgroundId: 4, backgroundColor: '#fff6f0', theme: pageThemes[4], typeface: 6, cardBackgroundId: 0, cardBackgroundColor: pageBackgrounds[0].color, cardBackgroundImage: pageBackgrounds[0].image, cardBackgroundSize: pageBackgrounds[0].size,
  alignment: 'center', galleryLayout: 'collage', effects: ['confetti', 'sparkles'],
  layout: {}, layoutMode: 'flow-v2', stickerItems: [], layoutHeight: 0, coverRadius: 18, effectSettings: { snowAmount: 42, rainAmount: 48, windAmount: 4, sparklesAmount: 18 },
  visibility: { eyebrow: true, headline: true, recipientName: true, birthdayDate: true, countdown: true, birthdayMessage: true, cover: true, gallery: true, wishes: true },
  elementStyles: {}
};

const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const replacePage = (pages, page) => pages.map((item) => item._id === page._id ? page : item);

export default function BirthdayStudio({ pages, onPages, onMessage, user }) {
  const movablePanel = useMovablePanel();
  const memoryInputRef = useRef(null);
  const [creating, setCreating] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [mode, setMode] = useState('edit');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [form, setForm] = useState(emptyDraft);
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [selected, setSelected] = useState('recipientName');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showStickerLibrary, setShowStickerLibrary] = useState(false);
  const [search, setSearch] = useState('');
  const [customBackground, setCustomBackground] = useState('#fff6f0');
  const [stickerText, setStickerText] = useState('');

  const draftPage = useMemo(() => selectedPage ? ({ ...selectedPage, ...form, appearance }) : null, [selectedPage, form, appearance]);
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setAppearanceValue = (changes) => setAppearance((current) => ({ ...current, ...changes }));

  const startCreate = () => {
    setSelectedPage(null);
    setForm(emptyDraft);
    setAppearance(defaultAppearance);
    setSelected('recipientName');
    setInspectorOpen(true);
    setCreating(true);
  };

  const createPage = async (event) => {
    event.preventDefault();
    if (!form.dateOfBirth) { onMessage('Enter their birthday date first.'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/birthday-pages', {
        recipientName: form.recipientName,
        dateOfBirth: form.dateOfBirth,
        headline: form.headline,
        message: form.message,
        ...(form.alias.trim() ? { alias: form.alias.trim() } : {})
      });
      const page = data.page;
      onPages([page, ...pages]);
      setSelectedPage(page);
      setForm({ ...form, alias: page.alias, dateOfBirth: toDateInput(page.dateOfBirth) });
      setAppearance({ ...defaultAppearance, ...(page.appearance || {}), layoutMode: 'flow-v2', layout: page.appearance?.layoutMode === 'flow-v2' ? (page.appearance.layout || {}) : {}, visibility: { ...defaultAppearance.visibility, ...(page.appearance?.visibility || {}) }, elementStyles: { ...(page.appearance?.elementStyles || {}) } });
      setCreating(false);
      setMode('edit');
      setInspectorOpen(true);
      onMessage('Birthday page created. Add photos and customise the page.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setBusy(false); }
  };

  const openEditor = (page) => {
    setSelectedPage(page);
    setForm({ recipientName: page.recipientName || '', dateOfBirth: toDateInput(page.dateOfBirth), alias: page.alias || '', headline: page.headline || '', message: page.message || '' });
    setAppearance({ ...defaultAppearance, ...(page.appearance || {}), layoutMode: 'flow-v2', layout: page.appearance?.layoutMode === 'flow-v2' ? (page.appearance.layout || {}) : {}, visibility: { ...defaultAppearance.visibility, ...(page.appearance?.visibility || {}) }, elementStyles: { ...(page.appearance?.elementStyles || {}) } });
    setSelected('recipientName');
    setCreating(false);
    setMode('edit');
    setInspectorOpen(true);
  };

  const savePage = async () => {
    if (!selectedPage) return;
    if (!form.dateOfBirth) { onMessage('A birthday date is required.'); setSelected('details'); return; }
    setBusy(true);
    try {
      const payload = {
        recipientName: form.recipientName,
        dateOfBirth: form.dateOfBirth,
        alias: form.alias,
        headline: form.headline,
        message: form.message,
        appearance
      };
      const { data } = await api.patch(`/birthday-pages/${selectedPage._id}`, payload);
      setSelectedPage(data.page);
      setForm((current) => ({ ...current, dateOfBirth: toDateInput(data.page.dateOfBirth), alias: data.page.alias }));
      onPages(replacePage(pages, data.page));
      onMessage('Birthday page saved.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setBusy(false); }
  };

  const uploadPageBackground = async (event) => {
    const file = event.target.files?.[0]; if (!file) return; setUploading(true);
    try { const image = await uploadImage(file, `pagemint/${user.id}/birthday/${selectedPage?.alias || 'draft'}/backgrounds`); setAppearanceValue({ backgroundImage: image, backgroundImageUrl: image.url, backgroundGradient: null }); onMessage('Birthday page background uploaded.'); }
    catch (error) { onMessage(apiError(error)); } finally { setUploading(false); event.target.value = ''; }
  };

  const uploadCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPage) return;
    setUploading(true);
    try {
      const cover = await uploadImage(file, `pagemint/${user.id}/birthday/${selectedPage.alias}/cover`);
      const { data } = await api.patch(`/birthday-pages/${selectedPage._id}`, { cover });
      setSelectedPage(data.page); onPages(replacePage(pages, data.page)); onMessage('Cover image updated.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setUploading(false); event.target.value = ''; }
  };

  const uploadMemories = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !selectedPage) return;
    const existing = selectedPage.gallery || [];
    const allowed = Math.max(0, 30 - existing.length);
    if (!allowed) { onMessage('A birthday page can contain up to 30 memory photos.'); event.target.value = ''; return; }
    const batch = files.slice(0, allowed);
    setUploading(true);
    try {
      const uploaded = [];
      for (let offset = 0; offset < batch.length; offset += 3) {
        const chunk = batch.slice(offset, offset + 3);
        uploaded.push(...await Promise.all(chunk.map((file) => uploadImage(file, `pagemint/${user.id}/birthday/${selectedPage.alias}/memories`))));
      }
      const gallery = [...existing, ...uploaded.map((image) => ({ ...image, caption: '' }))];
      const { data } = await api.patch(`/birthday-pages/${selectedPage._id}`, { gallery });
      setSelectedPage(data.page); onPages(replacePage(pages, data.page));
      onMessage(`${uploaded.length} ${uploaded.length === 1 ? 'memory' : 'memories'} added.`);
    } catch (error) { onMessage(apiError(error)); }
    finally { setUploading(false); event.target.value = ''; }
  };

  const updateGallery = async (gallery) => {
    if (!selectedPage) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/birthday-pages/${selectedPage._id}`, { gallery });
      setSelectedPage(data.page); onPages(replacePage(pages, data.page));
    } catch (error) { onMessage(apiError(error)); }
    finally { setBusy(false); }
  };

  const moveMemory = (index, direction) => {
    const gallery = [...(selectedPage.gallery || [])];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= gallery.length) return;
    [gallery[index], gallery[nextIndex]] = [gallery[nextIndex], gallery[index]];
    updateGallery(gallery);
  };

  const saveMemoryCaption = (index, caption) => {
    const gallery = (selectedPage.gallery || []).map((image, imageIndex) => imageIndex === index ? { ...image, caption: caption.slice(0, 160) } : image);
    updateGallery(gallery);
  };

  const deletePage = async (page) => {
    if (!window.confirm(`Delete the birthday page for ${page.recipientName}?`)) return;
    try {
      await api.delete(`/birthday-pages/${page._id}`);
      onPages(pages.filter((item) => item._id !== page._id));
      if (selectedPage?._id === page._id) setSelectedPage(null);
      onMessage('Birthday page deleted. Its stored images have been queued for cleanup.');
    } catch (error) { onMessage(apiError(error)); }
  };

  const togglePublished = async (page) => {
    try {
      const { data } = await api.patch(`/birthday-pages/${page._id}`, { published: !page.published });
      onPages(replacePage(pages, data.page));
      if (selectedPage?._id === page._id) setSelectedPage(data.page);
    } catch (error) { onMessage(apiError(error)); }
  };

  const selectBirthdayElement = (id) => { setSelected(id); setInspectorOpen(true); };

  const updateNode = (id, point) => {
    if (id.startsWith('sticker:')) {
      const stickerId = id.slice(8);
      setAppearanceValue({ stickerItems: (appearance.stickerItems || []).map((item) => item.id === stickerId ? { ...item, x: point.x, y: point.y } : item), layoutHeight: Math.max(appearance.layoutHeight || 0, point.y + 180) });
    } else {
      setAppearanceValue({ layoutMode: 'flow-v2', layout: { ...(appearance.layout || {}), [id]: { ...(appearance.layout?.[id] || {}), ...point } }, layoutHeight: Math.max(appearance.layoutHeight || 0, point.y + 300) });
    }
  };

  const addTextBox = () => {
    const items = appearance.textItems || [];
    const item = { id: crypto.randomUUID(), text: 'A little note just for you', x: 50, y: 350 + items.length * 90, width: 82, fontSize: 27, fontWeight: 600, fontFamily: "'Dancing Script', cursive", color: appearance.theme?.text || '#30243a', textAlign: 'center', rotation: 0 };
    setAppearanceValue({ textItems: [...items, item], layoutHeight: Math.max(appearance.layoutHeight || 0, item.y + 180) });
    setSelected(`text:${item.id}`); setInspectorOpen(true);
  };
  const updateTextItem = (id, changes) => { const items = (appearance.textItems || []).map((item) => item.id === id ? { ...item, ...changes } : item); setAppearanceValue({ textItems: items, layoutHeight: Math.max(appearance.layoutHeight || 0, ...items.map((item) => (item.y || 0) + (item.fontSize || 24) * 4)) }); };
  const addSticker = (stickerId) => {
    const existing = appearance.stickerItems || [];
    const sticker = { id: crypto.randomUUID(), stickerId, x: 12 + (existing.length % 5) * 18, y: 270 + existing.length * 55, size: 76, rotation: 0 };
    setAppearanceValue({ stickerItems: [...existing, sticker], layoutHeight: Math.max(appearance.layoutHeight || 0, sticker.y + 180) });
    setSelected(`sticker:${sticker.id}`); setInspectorOpen(true); setShowStickerLibrary(false);
  };
  const addEmojiSticker = (value) => {
    const emoji = String(value || '').trim().slice(0, 12);
    if (!emoji) return;
    addSticker(`emoji:${emoji}`);
    setStickerText('');
  };
  const uploadStickerFile = async (file) => {
    if (!file || !selectedPage) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { onMessage('Sticker uploads must be PNG, JPEG, WebP or GIF images.'); return; }
    setUploading(true);
    try {
      const uploaded = await uploadImage(file, `pagemint/${user.id}/birthday/${selectedPage.alias}/stickers`);
      const existing = appearance.stickerItems || [];
      const item = { id: crypto.randomUUID(), stickerId: 'sparkles', url: uploaded.url, fileId: uploaded.fileId, x: 50, y: 280 + existing.length * 28, size: 100, rotation: 0 };
      setAppearanceValue({ stickerItems: [...existing, item] });
      setSelected(`sticker:${item.id}`); setInspectorOpen(true); setShowStickerLibrary(false);
      onMessage('Sticker uploaded. Save the page to keep it.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setUploading(false); }
  };
  const handleStickerPaste = async (event) => {
    const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith('image/'));
    const file = item?.getAsFile?.();
    if (file) { event.preventDefault(); await uploadStickerFile(file); }
  };
  const selectedSticker = selected.startsWith('sticker:') ? (appearance.stickerItems || []).find((item) => item.id === selected.slice(8)) : null;
  const selectedText = selected.startsWith('text:') ? (appearance.textItems || []).find((item) => item.id === selected.slice(5)) : null;
  const birthdayNodeDefaults = { headline: { x: 50, y: 90, width: 88 }, recipientName: { x: 50, y: 160, width: 88 }, birthdayDate: { x: 50, y: 245, width: 88 }, countdown: { x: 50, y: 300, width: 88 }, birthdayMessage: { x: 50, y: 360, width: 88 }, cover: { x: 50, y: 500, width: 88 }, gallery: { x: 50, y: 920, width: 90 }, wishes: { x: 50, y: 1420, width: 88 } };
  // Flow elements stay in document flow until the user actually drags them.
  // Do not expose numeric position controls before that point: changing width
  // or rotation must not silently pin an element at an obsolete default Y.
  const selectedNodePosition = birthdayNodeDefaults[selected] && appearance.layout?.[selected]
    ? { ...birthdayNodeDefaults[selected], ...appearance.layout[selected] }
    : null;
  const editableFields = ['headline', 'recipientName', 'birthdayMessage', 'birthdayDate', 'countdown'];
  const selectedEditableField = editableFields.includes(selected) ? selected : null;
  const updateElementStyle = (key, changes) => setAppearanceValue({ elementStyles: { ...(appearance.elementStyles || {}), [key]: { ...(appearance.elementStyles?.[key] || {}), ...changes } } });
  const selectedElementStyle = selectedEditableField ? (appearance.elementStyles?.[selectedEditableField] || {}) : {};
  const updateSelectedNodePosition = (changes) => {
    if (!selectedNodePosition) return;
    setAppearanceValue({ layoutMode: 'flow-v2', layout: { ...(appearance.layout || {}), [selected]: { ...selectedNodePosition, ...changes } } });
  };
  const removeSticker = (id) => { setAppearanceValue({ stickerItems: (appearance.stickerItems || []).filter((item) => item.id !== id) }); setSelected('recipientName'); };
  const backgrounds = useMemo(() => pageBackgrounds.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [search]);
  const setTheme = (theme) => { setCustomBackground(theme.background); setAppearanceValue({ theme, backgroundColor: theme.background, backgroundGradient: null }); };
  const setCustomColor = (value, key) => {
    if (key === 'background') setCustomBackground(value);
    const theme = { ...(appearance.theme || pageThemes[4]), [key]: value, id: -1, name: 'Custom' };
    setAppearanceValue({ theme, ...(key === 'background' ? { backgroundColor: value, backgroundGradient: null } : {}) });
  };
  const setCardBackground = (item) => setAppearanceValue({ cardBackgroundId: item.id, cardBackgroundColor: item.color, cardBackgroundImage: item.image, cardBackgroundSize: item.size, cardBackgroundGradient: null });

  if (selectedPage && draftPage) {
    const fieldNames = { headline: 'Headline', recipientName: 'Recipient name', birthdayMessage: 'Birthday message', birthdayDate: 'Birthday date', countdown: 'Countdown' };
    const selectedFieldContent = selected === 'headline' ? form.headline : selected === 'recipientName' ? form.recipientName : selected === 'birthdayMessage' ? form.message : '';
    const setVisibility = (key, visible) => { const layout = { ...(appearance.layout || {}) }; if (!visible) delete layout[key]; setAppearanceValue({ visibility: { ...(appearance.visibility || {}), [key]: visible }, layout }); if (!visible && selected === key) setSelected('background'); };
    const panel = mode === 'edit' && inspectorOpen ? createPortal(<aside className="pm-inspector pm-floating-inspector" style={movablePanel.panelStyle}>
      <div className="pm-inspector-heading" onPointerDown={movablePanel.handlePointerDown} title="Drag this panel anywhere on screen">
        <div><span className="pm-kicker">PAGE ELEMENT</span><h2>{selectedText ? 'Text box' : selectedSticker ? 'Sticker' : fieldNames[selected] || ({ details: 'Birthday settings', cover: 'Cover image', gallery: 'Memory gallery', wishes: 'Wish section', background: 'Page design' }[selected] || 'Edit element')}</h2></div>
        <button className="pm-inspector-close" type="button" onClick={() => setInspectorOpen(false)} aria-label="Close editor panel"><X size={17}/></button>
      </div>
      <div className="pm-inspector-body">
        {selectedEditableField && <>
          {selected === 'headline' && <InspectorLabel>Headline<input value={form.headline} onChange={(event) => setField('headline', event.target.value)} maxLength={120}/></InspectorLabel>}
          {selected === 'recipientName' && <InspectorLabel>Recipient name<input value={form.recipientName} onChange={(event) => setField('recipientName', event.target.value)} maxLength={80}/></InspectorLabel>}
          {selected === 'birthdayMessage' && <InspectorLabel>Birthday message<textarea rows={6} value={form.message} onChange={(event) => setField('message', event.target.value)} maxLength={3000}/></InspectorLabel>}
          {selected === 'birthdayDate' && <InspectorLabel>Birthday date<input type="date" required value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)}/></InspectorLabel>}
          {selected === 'countdown' && <p className="pm-inspector-help">The countdown is calculated from the birthday date. Its text size and appearance can be styled here.</p>}
          <div className="pm-inspector-section"><h3>Independent typography</h3>
            <InspectorLabel>Font family<select value={selectedElementStyle.fontFamily || 'inherit'} onChange={(event) => updateElementStyle(selected, { fontFamily: event.target.value })}><option value="inherit">Use page font</option>{typefaces.map((font) => <option key={font.id} value={font.value}>{font.name}</option>)}</select></InspectorLabel>
            <InspectorLabel>Font size · {selectedElementStyle.fontSize ?? (selected === 'recipientName' ? 36 : selected === 'birthdayMessage' ? 23 : 24)}px<input type="range" min="8" max="112" value={selectedElementStyle.fontSize ?? (selected === 'recipientName' ? 36 : selected === 'birthdayMessage' ? 23 : 24)} onChange={(event) => updateElementStyle(selected, { fontSize: Number(event.target.value) })}/></InspectorLabel>
            <InspectorLabel>Font weight<select value={selectedElementStyle.fontWeight || 500} onChange={(event) => updateElementStyle(selected, { fontWeight: Number(event.target.value) })}>{[300,400,500,600,700,800,900].map((n) => <option key={n} value={n}>{n}</option>)}</select></InspectorLabel>
            <InspectorLabel>Font style<select value={selectedElementStyle.fontStyle || 'normal'} onChange={(event) => updateElementStyle(selected, { fontStyle: event.target.value })}><option value="normal">Normal</option><option value="italic">Italic</option></select></InspectorLabel>
            <InspectorLabel>Line height · {selectedElementStyle.lineHeight || 1.45}<input type="range" min="0.8" max="2.4" step="0.05" value={selectedElementStyle.lineHeight || 1.45} onChange={(event) => updateElementStyle(selected, { lineHeight: Number(event.target.value) })}/></InspectorLabel>
            <InspectorLabel>Letter spacing · {selectedElementStyle.letterSpacing || 0}px<input type="range" min="-3" max="12" step="0.5" value={selectedElementStyle.letterSpacing || 0} onChange={(event) => updateElementStyle(selected, { letterSpacing: Number(event.target.value) })}/></InspectorLabel>
            <div className="pm-text-color-row"><label>Text colour<input type="color" value={selectedElementStyle.color || appearance.theme?.text || '#30243a'} onChange={(event) => updateElementStyle(selected, { color: event.target.value })}/></label><label>Alignment<select value={selectedElementStyle.textAlign || 'center'} onChange={(event) => updateElementStyle(selected, { textAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div>
          </div>
          <button className="pm-danger-button pm-full-button" onClick={() => setVisibility(selected, false)}><Trash2 size={14}/> Remove this element from the page</button>
        </>}
        {selected === 'details' && <>
          <InspectorLabel>Birthday date<input type="date" required value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)}/></InspectorLabel>
          <InspectorLabel>Page alias<div className="pm-input-prefix"><span>/bday/</span><input value={form.alias} onChange={(event) => setField('alias', event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} minLength={3} maxLength={40}/></div></InspectorLabel>
        </>}
        {selected === 'cover' && <>
          <p className="pm-inspector-help">The cover image has independent styling and is no longer restricted to the section's default radius.</p>
          <label className="pm-upload-drop"><Upload size={20}/><b>{uploading ? 'Uploading image…' : 'Choose cover image'}</b><small>JPG, PNG or WebP · ImageKit hosted</small><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadCover} disabled={uploading}/></label>
          {selectedPage.cover?.url && <img className="pm-inspector-wide-image" src={selectedPage.cover.url} alt="Current cover"/>}
          <InspectorLabel>Image corner radius · {appearance.coverRadius ?? 18}px<input type="range" min="0" max="120" value={appearance.coverRadius ?? 18} onChange={(event) => setAppearanceValue({ coverRadius: Number(event.target.value) })}/></InspectorLabel>
          <InspectorLabel>Image fit<select value={appearance.coverFit || 'cover'} onChange={(event) => setAppearanceValue({ coverFit: event.target.value })}><option value="cover">Cover / crop</option><option value="contain">Contain / show full image</option><option value="fill">Stretch to fill</option></select></InspectorLabel>
          <InspectorLabel>Image height · {appearance.coverHeight || 300}px<input type="range" min="120" max="700" step="10" value={appearance.coverHeight || 300} onChange={(event) => setAppearanceValue({ coverHeight: Number(event.target.value) })}/></InspectorLabel>
        </>}
        {selected === 'gallery' && <>
          <p className="pm-inspector-help">Add up to 30 photos. Choose a composition that suits the memories.</p>
          <button type="button" className="pm-upload-drop pm-upload-drop-button" onClick={() => memoryInputRef.current?.click()} disabled={uploading}><ImagePlus size={20}/><b>{uploading ? 'Uploading photos…' : 'Add multiple photos'}</b><small>{(selectedPage.gallery || []).length} / 30 photos · Select several files at once</small></button>
          <InspectorLabel>Gallery composition<select value={appearance.galleryLayout || 'collage'} onChange={(event) => setAppearanceValue({ galleryLayout: event.target.value })}><option value="collage">Editorial collage</option><option value="masonry">Masonry wall</option><option value="grid">Even grid</option><option value="polaroid">Polaroid snapshots</option><option value="filmstrip">Film strip</option></select></InspectorLabel>
          <div className="pm-bday-memory-list">{(selectedPage.gallery || []).map((image, index) => <div key={image.fileId || index}><img src={image.url} alt="Memory thumbnail"/><span><b>Memory {index + 1}</b><input aria-label={`Caption for memory ${index + 1}`} defaultValue={image.caption || ''} placeholder="Add a caption" maxLength={160} onBlur={(event) => event.target.value !== (image.caption || '') && saveMemoryCaption(index, event.target.value)}/></span><div className="pm-bday-memory-actions"><button type="button" disabled={index === 0} onClick={() => moveMemory(index, -1)} aria-label={`Move memory ${index + 1} earlier`}>↑</button><button type="button" disabled={index === selectedPage.gallery.length - 1} onClick={() => moveMemory(index, 1)} aria-label={`Move memory ${index + 1} later`}>↓</button><button type="button" onClick={() => updateGallery((selectedPage.gallery || []).filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove memory ${index + 1}`}><Trash2 size={14}/></button></div></div>)}</div>
        </>}
        {selected === 'wishes' && <><p className="pm-inspector-help">The public page can collect wishes from visitors. Turn this section off in Page visibility to remove it.</p><InspectorLabel>Section alignment<select value={appearance.alignment || 'center'} onChange={(event) => setAppearanceValue({ alignment: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></InspectorLabel></>}
        {birthdayNodeDefaults[selected] && !selectedNodePosition && <p className="pm-inspector-help">This element is using automatic flow layout to prevent empty gaps. Drag it on the canvas to switch to free positioning; numeric position and size controls will then appear here.</p>}
        {selectedNodePosition && <div className="pm-inspector-section pm-position-controls"><h3>Position & dimensions</h3><button type="button" className="pm-quiet-button" onClick={() => { const next = { ...(appearance.layout || {}) }; delete next[selected]; setAppearanceValue({ layout: next }); }}>Reset to auto layout</button>
          <InspectorLabel>Horizontal · {Math.round(selectedNodePosition.x)}%<input type="range" min="3" max="97" value={selectedNodePosition.x} onChange={(event) => updateSelectedNodePosition({ x: Number(event.target.value) })}/></InspectorLabel>
          <InspectorLabel>Vertical · {Math.round(selectedNodePosition.y)}px<input type="range" min="0" max="7000" step="10" value={selectedNodePosition.y} onChange={(event) => updateSelectedNodePosition({ y: Number(event.target.value) })}/></InspectorLabel>
          <InspectorLabel>Width · {Math.round(selectedNodePosition.width)}%<input type="range" min="35" max="100" value={selectedNodePosition.width} onChange={(event) => updateSelectedNodePosition({ width: Number(event.target.value) })}/></InspectorLabel>
          <InspectorLabel>Rotation · {selectedNodePosition.rotation || 0}°<input type="range" min="-180" max="180" value={selectedNodePosition.rotation || 0} onChange={(event) => updateSelectedNodePosition({ rotation: Number(event.target.value) })}/></InspectorLabel>
          <InspectorLabel>Height · {selectedNodePosition.height || 'Auto'}px<input type="range" min="0" max="900" step="5" value={selectedNodePosition.height || 0} onChange={(event) => updateSelectedNodePosition({ height: Number(event.target.value) || undefined })}/></InspectorLabel>
          <InspectorLabel>Padding · {selectedNodePosition.padding ?? 0}px<input type="range" min="0" max="64" value={selectedNodePosition.padding ?? 0} onChange={(event) => updateSelectedNodePosition({ padding: Number(event.target.value) })}/></InspectorLabel>
          <InspectorLabel>Border radius · {selectedNodePosition.borderRadius ?? 0}px<input type="range" min="0" max="100" value={selectedNodePosition.borderRadius ?? 0} onChange={(event) => updateSelectedNodePosition({ borderRadius: Number(event.target.value) })}/></InspectorLabel>
          <InspectorLabel>Background<input type="color" value={selectedNodePosition.nodeBackground || '#ffffff'} onChange={(event) => updateSelectedNodePosition({ nodeBackground: event.target.value })}/></InspectorLabel>
          <InspectorLabel>Text colour<input type="color" value={selectedNodePosition.nodeColor || '#30243a'} onChange={(event) => updateSelectedNodePosition({ nodeColor: event.target.value })}/></InspectorLabel>
          <InspectorLabel>Shadow<select value={selectedNodePosition.boxShadow || 'none'} onChange={(event) => updateSelectedNodePosition({ boxShadow: event.target.value })}><option value="none">None</option><option value="0 4px 12px rgba(0,0,0,.12)">Soft</option><option value="0 12px 30px rgba(0,0,0,.2)">Strong</option></select></InspectorLabel>
        </div>}
        {selected === 'background' && <>
          <div className="pm-inspector-section"><h3>Card background</h3><p className="pm-inspector-help">Choose a background independently from the page and its colour theme.</p><div className="pm-background-grid">{pageBackgrounds.map((item) => <button type="button" key={item.id} title={item.name} className={Number(appearance.cardBackgroundId ?? 0) === item.id && !appearance.cardBackgroundGradient ? 'is-active' : ''} onClick={() => setCardBackground(item)} style={{ backgroundColor: item.color, backgroundImage: item.image, backgroundSize: item.size }}><span>{item.name}</span></button>)}</div></div>
          <GradientBuilder title="Custom card gradient" value={appearance.cardBackgroundGradient} onChange={(config) => setAppearanceValue({ cardBackgroundGradient: config, cardBackgroundImage: null })}/>
          <CardAppearanceControls appearance={appearance} onChange={setAppearanceValue}/>
          <div className="pm-inspector-section"><h3>Page background image</h3><label className="pm-upload-drop"><Upload size={17}/><b>Upload background image</b><small>Displayed behind the centered birthday card</small><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadPageBackground}/></label>{appearance.backgroundImageUrl && <button className="pm-danger-button" onClick={() => setAppearanceValue({ backgroundImage: null, backgroundImageUrl: '' })}>Remove background image</button>}</div>
          <div className="pm-inspector-section"><h3>Page background · {pageBackgrounds.length} designs</h3><input className="pm-background-search" placeholder="Search backgrounds…" value={search} onChange={(event) => setSearch(event.target.value)}/><div className="pm-background-grid">{backgrounds.map((item) => <button key={item.id} className={Number(appearance.backgroundId || 0) === item.id && !appearance.backgroundGradient && !appearance.backgroundImageUrl ? 'is-active' : ''} title={item.name} onClick={() => setAppearanceValue({ backgroundId: item.id, backgroundColor: item.color, backgroundImage: null, backgroundImageUrl: '', backgroundGradient: null })} style={{ backgroundColor: item.color, backgroundImage: item.image, backgroundSize: item.size }}><span>{item.name}</span></button>)}</div></div>
          <GradientBuilder title="Custom page gradient" value={appearance.backgroundGradient} onChange={(config) => setAppearanceValue({ backgroundGradient: config, backgroundImage: null, backgroundImageUrl: '', backgroundId: -1 })}/>
          <div className="pm-inspector-section"><h3>Page colour themes · {pageThemes.length} themes</h3><div className="pm-theme-grid">{pageThemes.map((item) => <button key={item.id} className={appearance.theme?.id === item.id ? 'is-active' : ''} onClick={() => setTheme(item)} title={item.name}><span style={{ background: item.background, color: item.text }}>Aa</span><i style={{ background: item.accent }}/><small>{item.name}</small></button>)}</div></div>
          <div className="pm-inspector-section"><h3>Page visibility</h3><p className="pm-inspector-help">Hide sections you don't need. Hidden sections collapse completely and don't leave reserved space.</p><div className="pm-bday-effects">{[['eyebrow','Top label'],['headline','Headline'],['recipientName','Recipient name'],['birthdayDate','Birthday date'],['countdown','Countdown'],['birthdayMessage','Birthday message'],['cover','Cover image'],['gallery','Memory gallery'],['wishes','Wish wall']].map(([key,label]) => <label key={key}><input type="checkbox" checked={(appearance.visibility?.[key] ?? defaultAppearance.visibility[key]) !== false} onChange={(event) => setVisibility(key, event.target.checked)}/>{label}</label>)}</div></div>
          <div className="pm-inspector-section"><h3>Fine tune page colours</h3><div className="pm-color-controls"><label>Background<input type="color" value={customBackground} onChange={(event) => setCustomColor(event.target.value, 'background')}/></label><label>Text<input type="color" value={appearance.theme?.text || '#30243a'} onChange={(event) => setCustomColor(event.target.value, 'text')}/></label><label>Accent<input type="color" value={appearance.theme?.accent || '#d46b91'} onChange={(event) => setCustomColor(event.target.value, 'accent')}/></label></div></div>
          <InspectorLabel>Page typography<select value={Number(appearance.typeface ?? 6)} onChange={(event) => setAppearanceValue({ typeface: Number(event.target.value) })}>{typefaces.map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select></InspectorLabel>
          <div className="pm-inspector-section"><h3>Full-page celebration effects</h3><p className="pm-inspector-help">Effects cover the page and continue outside the card.</p><div className="pm-bday-effects">{[['confetti','Confetti'],['fireworks','Fireworks'],['sparklers','Sparklers'],['balloons','Floating balloons'],['sparkles','Sparkle drift'],['snow','Snowfall'],['rain','Rain'],['wind','Wind']].map(([value,label]) => <label key={value}><input type="checkbox" checked={(appearance.effects || []).includes(value)} onChange={(event) => setAppearanceValue({ effects: event.target.checked ? [...(appearance.effects || []), value] : (appearance.effects || []).filter((item) => item !== value) })}/>{label}</label>)}</div><div className="pm-inspector-section"><h3>Passive effect intensity</h3><p className="pm-inspector-help">Adjust particle density and movement. These effects are atmospheric and do not trigger the celebration button.</p>{[['snowAmount','Snowflake amount',8,120,1,42],['rainAmount','Rain density',8,120,1,48],['windAmount','Wind stream count',1,10,1,4],['sparklesAmount','Sparkle amount',4,60,1,18]].map(([key,label,min,max,step,fallback]) => <InspectorLabel key={key}>{label} · {appearance.effectSettings?.[key] ?? fallback}<input type="range" min={min} max={max} step={step} value={appearance.effectSettings?.[key] ?? fallback} onChange={(event) => setAppearanceValue({ effectSettings: { ...(appearance.effectSettings || {}), [key]: Number(event.target.value) } })}/></InspectorLabel>)}</div></div>
        </>}
        {selectedText && <TextElementInspector item={selectedText} onChange={(changes) => updateTextItem(selectedText.id, changes)} onDelete={() => { setAppearanceValue({ textItems: (appearance.textItems || []).filter((item) => item.id !== selectedText.id) }); setSelected('recipientName'); }}/ >}
        {selectedSticker && <><div className="pm-selected-sticker"><StickerPicker selected={[selectedSticker.stickerId]} onChoose={(stickerId) => setAppearanceValue({ stickerItems: appearance.stickerItems.map((item) => item.id === selectedSticker.id ? { ...item, stickerId } : item) })}/></div><InspectorLabel>Size · {selectedSticker.size || 76}px<input type="range" min="24" max="240" value={selectedSticker.size || 76} onChange={(event) => setAppearanceValue({ stickerItems: appearance.stickerItems.map((item) => item.id === selectedSticker.id ? { ...item, size: Number(event.target.value) } : item) })}/></InspectorLabel><InspectorLabel>Rotation · {selectedSticker.rotation || 0}°<input type="range" min="-180" max="180" value={selectedSticker.rotation || 0} onChange={(event) => setAppearanceValue({ stickerItems: appearance.stickerItems.map((item) => item.id === selectedSticker.id ? { ...item, rotation: Number(event.target.value) } : item) })}/></InspectorLabel><button className="pm-danger-button pm-full-button" onClick={() => removeSticker(selectedSticker.id)}><Trash2 size={15}/> Remove sticker</button></>}
      </div>
      <div className="pm-inspector-footer"><button className="pm-save-bottom" onClick={savePage} disabled={busy}><Save size={15}/>{busy ? 'Saving…' : 'Save birthday page'}</button></div>
    </aside>, document.body) : null;

    return <section className="pm-studio pm-bday-studio">
      <header className="pm-studio-toolbar">
        <div className="pm-studio-title"><span className="pm-kicker">PAGEMINT / BIRTHDAY STUDIO</span><h1>A page made just for them.</h1><p>Select an individual element to edit its typography. Drag elements on the page; use the inspector for precise position and size.</p></div>
        <div className="pm-toolbar-actions">
          <button className="pm-quiet-button" onClick={() => setSelectedPage(null)}><ArrowLeft size={15}/> All birthday pages</button>
          <a className="pm-quiet-button" href={`/bday/${form.alias}`} target="_blank" rel="noreferrer"><ArrowUpRight size={15}/> Open page</a>
          <div className="pm-mode-switch"><button className={mode === 'view' ? 'is-active' : ''} onClick={() => setMode('view')}><Eye size={15}/> View</button><button className={mode === 'edit' ? 'is-active' : ''} onClick={() => { setMode('edit'); setInspectorOpen(true); }}>Edit</button></div>
          <button className="pm-primary-button" onClick={savePage} disabled={busy}><Save size={15}/>{busy ? 'Saving…' : 'Save page'}</button>
        </div>
      </header>
      <input ref={memoryInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={uploadMemories} disabled={uploading}/>
      <div className="pm-studio-workspace">
        <nav className="pm-studio-tools" aria-label="Birthday page tools">
          {[['headline','H'],['recipientName','N'],['birthdayMessage','M'],['birthdayDate','D'],['cover','▧'],['gallery','▦'],['wishes','♡'],['background','◐'],['details','⚙']].map(([id, label]) => <button key={id} className={selected === id ? 'is-active' : ''} onClick={() => selectBirthdayElement(id)} title={fieldNames[id] || id}>{label}</button>)}
          <button onClick={addTextBox} title="Add text box"><span style={{fontWeight:900,fontSize:17}}>T</span></button>
          <button onClick={() => { setInspectorOpen(false); setShowStickerLibrary(true); }} title="Add sticker"><Sticker/></button>
        </nav>
        <div className="pm-preview-viewport">
          <div className="pm-preview-topline"><span><i className="pm-preview-dot"/> {mode === 'edit' ? 'EDITING THE ACTUAL PAGE' : 'VIEW MODE'}</span><span>/bday/{form.alias}</span></div>
          <BirthdayCanvas page={draftPage} editable={mode === 'edit'} selected={selected} onSelect={selectBirthdayElement} onMove={(id, point) => id.startsWith('text:') ? updateTextItem(id.slice(5), point) : updateNode(id, point)} onAddMemory={() => { selectBirthdayElement('gallery'); memoryInputRef.current?.click(); }}/>
        </div>
        {panel}
        {mode === 'edit' && !inspectorOpen && <button className="pm-open-inspector" onClick={() => setInspectorOpen(true)}>Open editor panel</button>}
      </div>
      {showStickerLibrary && <div className="pm-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowStickerLibrary(false)}><section className="pm-modal pm-sticker-modal"><header><div><span className="pm-kicker">STICKER LIBRARY</span><h2>Decorate the birthday page</h2><p>Search illustrations, type or paste emojis, or upload your own artwork—including animated GIFs.</p></div><button onClick={() => setShowStickerLibrary(false)}><X/></button></header>
        <StickerPicker onChoose={addSticker}/>
        <div className="pm-sticker-emoji-entry"><label>Type an emoji sticker<input value={stickerText} onChange={(event) => setStickerText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addEmojiSticker(stickerText); } }} onPaste={handleStickerPaste} placeholder="🎂 💖 🎉 🌸 — type or paste here"/></label><button className="pm-primary-button" type="button" onClick={() => addEmojiSticker(stickerText)} disabled={!stickerText.trim()}>Add emoji</button></div>
        <div className="pm-emoji-quick-picks" aria-label="Quick emoji stickers">{['🎂','🎉','🥳','🎈','💖','🎁','✨','🌸','🥰','🧁','🎊','🎇','❤️','🌷','🦋','⭐'].map((emoji) => <button key={emoji} type="button" onClick={() => addEmojiSticker(emoji)} aria-label={`Add ${emoji} sticker`}>{emoji}</button>)}</div>
        <label className="pm-upload-drop"><Upload size={18}/><b>{uploading ? 'Uploading sticker…' : 'Upload or paste a sticker image'}</b><small>PNG, WebP, JPEG or animated GIF · up to 8 MB</small><input type="file" accept="image/png,image/webp,image/gif,image/jpeg" hidden onChange={async (event) => { await uploadStickerFile(event.target.files?.[0]); event.target.value = ''; }} disabled={uploading}/></label>
      </section></div>}
    </section>;
  }

  return <section className="pm-bday-list-page">
    <header className="pm-studio-toolbar"><div className="pm-studio-title"><span className="pm-kicker">PAGEMINT / BIRTHDAY STUDIO</span><h1>Make somebody's day.</h1><p>Create a personal birthday page, fill it with photos and send them a surprise link.</p></div><button className="pm-primary-button" onClick={startCreate}><Plus size={15}/> New birthday page</button></header>
    {creating && <form className="pm-bday-create-panel" onSubmit={createPage}><div className="pm-bday-create-heading"><div><span className="pm-kicker">START A SURPRISE</span><h2>Who are we celebrating?</h2><p>The birthday date is used for the page's countdown and celebration timing.</p></div><button type="button" onClick={() => setCreating(false)}><X size={17}/></button></div><div className="pm-bday-create-grid">
      <label>Recipient name<input autoFocus required maxLength={80} placeholder="Their name" value={form.recipientName} onChange={(event) => setField('recipientName', event.target.value)}/></label>
      <label>Birthday date<input required type="date" value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)}/></label>
      <label>Page alias (optional)<div className="pm-input-prefix"><span>/bday/</span><input maxLength={40} placeholder="surprise-for-sam" value={form.alias} onChange={(event) => setField('alias', event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}/></div></label>
      <label>Headline<input maxLength={120} value={form.headline} onChange={(event) => setField('headline', event.target.value)}/></label>
      <label className="pm-bday-create-message">Opening message<textarea rows={3} maxLength={3000} value={form.message} onChange={(event) => setField('message', event.target.value)}/></label>
    </div><div className="pm-bday-create-actions"><button type="button" className="pm-quiet-button" onClick={() => setCreating(false)}>Cancel</button><button className="pm-primary-button" disabled={busy}><Gift size={15}/>{busy ? 'Creating…' : 'Create birthday page'}</button></div></form>}
    <div className="pm-bday-page-list">{pages.length ? pages.map((page) => <article key={page._id} className="pm-bday-page-row"><div className="pm-bday-row-art">{page.cover?.url ? <img src={page.cover.url} alt=""/> : <Gift size={24}/>}</div><div className="pm-bday-row-copy"><b>{page.recipientName}</b><span>{page.dateOfBirth ? new Date(page.dateOfBirth).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Birthday date not set'} · /bday/{page.alias}</span><small>{(page.gallery || []).length} memories · {page.published ? 'Published' : 'Unpublished'}</small></div><div className="pm-bday-row-actions"><button onClick={() => togglePublished(page)}>{page.published ? 'Unpublish' : 'Publish'}</button><button className="is-primary" onClick={() => openEditor(page)}>Edit page <ArrowUpRight size={14}/></button><button className="is-danger" onClick={() => deletePage(page)} aria-label={`Delete ${page.recipientName}'s birthday page`}><Trash2 size={15}/></button></div></article>) : <div className="pm-bday-empty"><Gift size={34}/><h2>No birthday pages yet</h2><p>Create a surprise page for someone special. Start with their birthday date, then build the page visually.</p><button className="pm-primary-button" onClick={startCreate}><Plus size={15}/> Create your first page</button></div>}</div>
  </section>;
}

function InspectorLabel({ children }) { return <label className="pm-inspector-label">{children}</label>; }
