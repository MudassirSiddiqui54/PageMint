import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight, Check, ChevronDown, Eye, ImagePlus, Link2, Palette, Plus,
  Save, Search, ShoppingBag, Sticker, Trash2, Upload, X, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { api, apiError } from '../../lib/api';
import { uploadImage } from '../../lib/imagekit';
import { pageBackgrounds, pageThemes, platformPresets, typefaces } from '../../lib/presets';
import { iconFamilies, iconStyles, iconOptions, LinkIcon } from './LinkIcon';
import { StickerPicker, stickerCatalog } from './StickerArt';
import PageCanvas from './PageCanvas';
import TextCanvasItems from './TextCanvasItems';
import TextElementInspector from './TextElementInspector';
import GradientBuilder from './GradientBuilder';
import CardAppearanceControls from './CardAppearanceControls';
import './studio.css';
import useMovablePanel from './useMovablePanel';

const initialLinkDraft = { platform: 'Instagram', label: 'Instagram', url: 'https://www.instagram.com/', icon: 'Instagram', iconFamily: 'brand', iconStyle: 'brand', iconColor: '' };

function InspectorLabel({ children }) { return <label className="pm-inspector-label">{children}</label>; }

export default function VisualPageStudio({ profile, user, onProfile, onMessage }) {
  const movablePanel = useMovablePanel();
  const [draft, setDraft] = useState(profile);
  const [mode, setMode] = useState('edit');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [selected, setSelected] = useState('identity');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [showLinkLibrary, setShowLinkLibrary] = useState(false);
  const [showStickerLibrary, setShowStickerLibrary] = useState(false);
  const [linkDraft, setLinkDraft] = useState(initialLinkDraft);
  const [editingLinkId, setEditingLinkId] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [productDraft, setProductDraft] = useState({ name: '', description: '', price: '', url: '' });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImageBusy, setProductImageBusy] = useState('');
  const [stickerText, setStickerText] = useState('');
  const [themeDraft, setThemeDraft] = useState({ background: '#F8F5EF', text: '#22231F', accent: '#2F6B57' });

  useEffect(() => { setDraft(profile); }, [profile]);
  const appearance = draft.appearance || {};
  const theme = appearance.theme || pageThemes[0];
  useEffect(() => {
    setThemeDraft({ background: theme.background, text: theme.text, accent: theme.accent });
  }, [theme.background, theme.text, theme.accent]);

  const sortedLinks = useMemo(() => [...(draft.links || [])].sort((a, b) => a.position - b.position), [draft.links]);
  const filteredPresets = useMemo(() => platformPresets.filter((item) => item.name.toLowerCase().includes(linkSearch.toLowerCase())), [linkSearch]);
  const filteredIcons = useMemo(() => (iconOptions[linkDraft.iconFamily] || []).filter((name) => name.toLowerCase().includes(iconSearch.toLowerCase())), [linkDraft.iconFamily, iconSearch]);
  const selectedLink = selected.startsWith('link:') ? sortedLinks.find((item) => item._id === selected.slice(5)) : null;
  useEffect(() => {
    if (!selectedLink) return;
    setLinkDraft({ platform: selectedLink.platform || 'custom', label: selectedLink.label || '', url: selectedLink.url || '', icon: selectedLink.icon || 'Website', iconFamily: selectedLink.iconFamily || 'brand', iconStyle: selectedLink.iconStyle || 'brand', iconColor: selectedLink.iconColor || '' });
    setEditingLinkId(selectedLink._id);
    setShowLinkForm(true);
  }, [selectedLink?._id]);
  const selectedSticker = selected.startsWith('sticker:') ? (appearance.stickerItems || []).find((item) => item.id === selected.slice(8)) : null;
  const selectedText = selected.startsWith('text:') ? (appearance.textItems || []).find((item) => item.id === selected.slice(5)) : null;

  const setAppearance = (changes) => setDraft((current) => ({ ...current, appearance: { ...(current.appearance || {}), ...changes } }));
  const setCardBackground = (item) => setAppearance({ cardBackgroundId: item.id, cardBackgroundColor: item.color, cardBackgroundImage: item.image, cardBackgroundSize: item.size, cardBackgroundGradient: null });
  const setLink = (id, changes) => setDraft((current) => ({ ...current, links: current.links.map((item) => item._id === id ? { ...item, ...changes } : item) }));

  const togglePublished = async () => {
    const nextPublished = draft.published === false;
    setBusy(true);
    try {
      const { data } = await api.patch('/profile/me', { published: nextPublished });
      setDraft((current) => ({ ...current, published: data.profile.published }));
      onProfile((current) => ({ ...current, published: data.profile.published }));
      onMessage(nextPublished ? 'Your public page is now published.' : 'Your public page is now unpublished.');
    } catch (error) {
      onMessage(apiError(error, 'Could not update page visibility.'));
    } finally {
      setBusy(false);
    }
  };

  const savePage = async () => {
    setBusy(true);
    try {
      const payload = { alias: draft.alias, displayName: draft.displayName, bio: draft.bio, appearance: draft.appearance };
      const { data } = await api.patch('/profile/me', payload);
      const next = { ...draft, ...data.profile };
      setDraft(next); onProfile(next); onMessage('Your page has been saved.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setBusy(false); }
  };

  const updateLayout = (id, point) => {
    if (id.startsWith('sticker:')) {
      const stickerId = id.slice(8);
      const stickerItems = (appearance.stickerItems || []).map((item) => item.id === stickerId ? { ...item, x: point.x, y: point.y } : item);
      setAppearance({ stickerItems, layoutHeight: Math.max(appearance.layoutHeight || 0, point.y + 180) });
      return;
    }
    setAppearance({ layout: { ...(appearance.layout || {}), [id]: { ...(appearance.layout?.[id] || {}), ...point, width: appearance.layout?.[id]?.width || (id === 'avatar' ? 136 : id === 'identity' ? 88 : 86), unit: id === 'avatar' ? 'px' : '%' } }, layoutHeight: Math.max(appearance.layoutHeight || 0, point.y + 260) });
  };

  const uploadPageBackground = async (event) => {
    const file = event.target.files?.[0]; if (!file) return; setUploading(true);
    try { const image = await uploadImage(file, `pagemint/${user.id}/backgrounds`); setAppearance({ backgroundImage: image, backgroundImageUrl: image.url, backgroundId: -1, backgroundGradient: null }); onMessage('Page background image uploaded.'); }
    catch (error) { onMessage(apiError(error)); } finally { setUploading(false); event.target.value = ''; }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const avatar = await uploadImage(file, `pagemint/${user.id}/avatar`);
      const { data } = await api.patch('/profile/avatar', { avatar });
      const next = { ...draft, avatar: data.avatar };
      setDraft(next); onProfile(next); onMessage('Profile photo uploaded.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setUploading(false); event.target.value = ''; }
  };

  const choosePreset = (preset) => {
    setLinkDraft({ ...initialLinkDraft, platform: preset.name, label: preset.label, url: preset.url, icon: preset.name });
    setShowLinkLibrary(false); setEditingLinkId(''); setShowLinkForm(true); setSelected('links'); setInspectorOpen(true);
  };

  const saveLink = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      if (editingLinkId) {
        const { data } = await api.patch(`/profile/links/${editingLinkId}`, linkDraft);
        const next = { ...draft, links: data.links };
        setDraft(next); onProfile(next); onMessage('Link updated.');
      } else {
        const payload = { id: crypto.randomUUID(), ...linkDraft, enabled: true, position: sortedLinks.length };
        const { data } = await api.post('/profile/links', payload);
        const next = { ...draft, links: data.links };
        setDraft(next); onProfile(next); onMessage('Link added.');
      }
      setSelected('links'); setEditingLinkId(''); setShowLinkForm(false); setLinkDraft(initialLinkDraft);
    } catch (error) { onMessage(apiError(error)); }
    finally { setBusy(false); }
  };

  const editLink = (link) => {
    setLinkDraft({ platform: link.platform || 'custom', label: link.label, url: link.url, icon: link.icon || 'Website', iconFamily: link.iconFamily || 'brand', iconStyle: link.iconStyle || 'brand', iconColor: link.iconColor || '' });
    setEditingLinkId(link._id); setShowLinkForm(true); setSelected(`link:${link._id}`);
  };
  const deleteLink = async (id) => {
    if (!window.confirm('Remove this link from your page?')) return;
    try {
      const { data } = await api.delete(`/profile/links/${id}`);
      const next = { ...draft, links: data.links };
      setDraft(next); onProfile(next); setSelected('links'); onMessage('Link removed.');
    } catch (error) { onMessage(apiError(error)); }
  };

  const addProduct = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      const image = productImageFile ? await uploadImage(productImageFile, `pagemint/${user.id}/products`) : { url: '', fileId: '' };
      const payload = { id: crypto.randomUUID(), ...productDraft, enabled: true, position: (draft.products || []).length, image };
      const { data } = await api.post('/profile/products', payload);
      const next = { ...draft, products: data.products };
      setDraft(next); onProfile(next); setProductDraft({ name: '', description: '', price: '', url: '' }); setProductImageFile(null); onMessage('Product added.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setBusy(false); }
  };
  const updateProductImage = async (product, file) => {
    if (!file) return;
    setProductImageBusy(product._id);
    try {
      const image = await uploadImage(file, `pagemint/${user.id}/products`);
      const { data } = await api.patch(`/profile/products/${product._id}`, { image });
      const next = { ...draft, products: data.products }; setDraft(next); onProfile(next); onMessage('Product image updated.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setProductImageBusy(''); }
  };
  const clearProductImage = async (product) => {
    try {
      const { data } = await api.patch(`/profile/products/${product._id}`, { image: { url: '', fileId: '' } });
      const next = { ...draft, products: data.products }; setDraft(next); onProfile(next); onMessage('Product image removed.');
    } catch (error) { onMessage(apiError(error)); }
  };
  const deleteProduct = async (id) => {
    if (!window.confirm('Remove this product?')) return;
    try {
      const { data } = await api.delete(`/profile/products/${id}`);
      const next = { ...draft, products: data.products };
      setDraft(next); onProfile(next); onMessage('Product removed.');
    } catch (error) { onMessage(apiError(error)); }
  };

  const addTextBox = () => {
    const items = appearance.textItems || [];
    const item = { id: crypto.randomUUID(), text: 'Double-click in the inspector to write something', x: 50, y: 420 + items.length * 90, width: 82, fontSize: 26, fontWeight: 600, fontFamily: "'Playfair Display', serif", color: theme.text || '#30243a', textAlign: 'center', rotation: 0 };
    setAppearance({ textItems: [...items, item], layoutHeight: Math.max(appearance.layoutHeight || 0, item.y + 180) });
    setSelected(`text:${item.id}`); setInspectorOpen(true);
  };
  const updateTextItem = (id, changes) => { const items = (appearance.textItems || []).map((item) => item.id === id ? { ...item, ...changes } : item); setAppearance({ textItems: items, layoutHeight: Math.max(appearance.layoutHeight || 0, ...items.map((item) => (item.y || 0) + (item.fontSize || 24) * 4)) }); };
  const addSticker = (stickerId) => {
    const existing = appearance.stickerItems || [];
    const nextItem = { id: crypto.randomUUID(), stickerId, x: 16 + (existing.length % 4) * 21, y: 390 + Math.floor(existing.length / 4) * 100, size: 72, rotation: 0 };
    setAppearance({ stickerItems: [...existing, nextItem], layoutHeight: Math.max(appearance.layoutHeight || 0, nextItem.y + 180) });
    setShowStickerLibrary(false); setSelected(`sticker:${nextItem.id}`); setInspectorOpen(true);
  };
  const addEmojiSticker = (value) => {
    const emoji = String(value || '').trim().slice(0, 12);
    if (!emoji) return;
    addSticker(`emoji:${emoji}`);
    setStickerText('');
  };
  const uploadStickerFile = async (file) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { onMessage('Sticker uploads must be PNG, JPEG, WebP or GIF images.'); return; }
    if (file.size > 8 * 1024 * 1024) { onMessage('Sticker files must be 8 MB or smaller.'); return; }
    setUploading(true);
    try {
      const uploaded = await uploadImage(file, `pagemint/${user.id}/stickers`);
      const existing = appearance.stickerItems || [];
      const item = { id: crypto.randomUUID(), stickerId: 'sparkles', url: uploaded.url, fileId: uploaded.fileId, x: 50, y: 420 + existing.length * 24, size: 100, rotation: 0 };
      setAppearance({ stickerItems: [...existing, item] });
      setSelected(`sticker:${item.id}`); setShowStickerLibrary(false); setInspectorOpen(true);
      onMessage('Sticker uploaded. Save the page to keep it.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setUploading(false); }
  };
  const handleStickerPaste = async (event) => {
    const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith('image/'));
    const file = item?.getAsFile?.();
    if (file) { event.preventDefault(); await uploadStickerFile(file); }
  };
  const removeSticker = (id) => {
    setAppearance({ stickerItems: (appearance.stickerItems || []).filter((item) => item.id !== id) });
    setSelected('identity');
  };

  const updateSelectedLink = async (event) => {
    event.preventDefault();
    if (!editingLinkId) return saveLink(event);
    await saveLink(event);
  };

  const selectSection = (id) => { setSelected(id); setInspectorOpen(true); setEditingLinkId(''); if (id !== 'links') setShowLinkForm(false); };
  const alignment = appearance.alignment || 'center';
  const editableNodeId = selected.startsWith('link:') ? selected : ['avatar','identity','linksHeading','products'].includes(selected) ? selected : '';
  const selectedNodePosition = editableNodeId ? (appearance.layout?.[editableNodeId] || null) : null;
  const updateSelectedPosition = (changes) => {
    if (!editableNodeId) return;
    const base = selectedNodePosition || {};
    updateLayout(editableNodeId, { ...base, ...changes });
  };

  return (
    <section className="pm-studio">
      <header className="pm-studio-toolbar">
        <div className="pm-studio-title"><span className="pm-kicker">PAGEMINT / PAGE STUDIO</span><h1>Your page, your layout.</h1><p>Click an element to edit it. Drag it to position it on the page.</p></div>
        <div className="pm-toolbar-actions">
          <span className={`pm-publish-status ${draft.published === false ? 'is-unpublished' : 'is-published'}`}><i/>{draft.published === false ? 'Unpublished' : 'Published'}</span>
          <button type="button" className="pm-quiet-button" onClick={togglePublished} disabled={busy}>{draft.published === false ? 'Publish page' : 'Unpublish page'}</button>
          <a className="pm-quiet-button" href={`/u/${draft.alias}`} target="_blank" rel="noreferrer"><ArrowUpRight size={16}/> Open live page</a>
          <div className="pm-mode-switch"><button className={mode === 'view' ? 'is-active' : ''} onClick={() => setMode('view')}><Eye size={15}/> View</button><button className={mode === 'edit' ? 'is-active' : ''} onClick={() => { setMode('edit'); setInspectorOpen(true); }}>Edit</button></div>
          <button className="pm-primary-button" onClick={savePage} disabled={busy}><Save size={15}/>{busy ? 'Saving…' : 'Save page'}</button>
        </div>
      </header>
      <div className="pm-studio-workspace">
        <nav className="pm-studio-tools" aria-label="Page tools">
          <button onClick={() => selectSection('identity')} className={selected === 'identity' ? 'is-active' : ''} title="Profile"><Link2/></button>
          <button onClick={() => { selectSection('links'); setShowLinkLibrary(true); }} title="Add link"><Plus/></button>
          <button onClick={() => selectSection('products')} className={selected === 'products' ? 'is-active' : ''} title="Products"><ShoppingBag/></button>
          <button onClick={() => selectSection('background')} className={selected === 'background' ? 'is-active' : ''} title="Page design"><Palette/></button>
          <button onClick={addTextBox} title="Add text box"><span style={{fontWeight:900,fontSize:17}}>T</span></button>
          <button onClick={() => { setInspectorOpen(false); setShowStickerLibrary(true); }} title="Stickers"><Sticker/></button>
        </nav>

        <div className="pm-preview-viewport">
          <div className="pm-preview-topline"><span><span className="pm-preview-dot"/> {mode === 'edit' ? 'EDITING CANVAS' : 'LIVE PREVIEW'}</span><span>/{draft.alias}</span></div>
          <PageCanvas profile={draft} editable={mode === 'edit'} selected={selected} onSelect={selectSection} onMove={(id, point) => id.startsWith('text:') ? updateTextItem(id.slice(5), point) : updateLayout(id, point)}/>
        </div>

        {mode === 'edit' && inspectorOpen && createPortal(<aside className="pm-inspector pm-floating-inspector" style={movablePanel.panelStyle}>
          <div className="pm-inspector-heading" onPointerDown={movablePanel.handlePointerDown} title="Drag to move this panel"><div><span className="pm-kicker">PAGE ELEMENT</span><h2>{selectedText ? 'Text box' : selectedLink ? 'Link settings' : selectedSticker ? 'Sticker settings' : selected === 'avatar' ? 'Profile image' : selected === 'identity' ? 'Profile details' : selected === 'links' ? 'Links' : selected === 'products' ? 'Products' : 'Page design'}</h2></div><button className="pm-inspector-close" type="button" onClick={() => setInspectorOpen(false)} aria-label="Close editor panel"><X size={17}/></button></div>

          {mode === 'edit' && editableNodeId && !selectedNodePosition && inspectorOpen && <div className="pm-inspector-body"><p className="pm-inspector-help">This element is arranged automatically to keep the card compact. Drag it on the canvas to enable free positioning and the detailed controls.</p></div>}
          {mode === 'edit' && editableNodeId && selectedNodePosition && inspectorOpen && <div className="pm-inspector-body pm-position-controls">
            <div className="pm-inspector-section"><h3>Position & size</h3><p>Drag this element on the page or fine-tune its placement here.</p><button type="button" className="pm-quiet-button" onClick={() => { const next = { ...(appearance.layout || {}) }; delete next[editableNodeId]; setAppearance({ layout: next }); }}>Reset to automatic flow</button></div>
            <InspectorLabel>Horizontal position · {Math.round(selectedNodePosition.x || 50)}%<input type="range" min="3" max="97" value={selectedNodePosition.x || 50} onChange={(event) => updateSelectedPosition({ x: Number(event.target.value) })}/></InspectorLabel>
            <InspectorLabel>Vertical position · {Math.round(selectedNodePosition.y || 0)}px<input type="range" min="20" max="5000" step="10" value={selectedNodePosition.y || 0} onChange={(event) => updateSelectedPosition({ y: Number(event.target.value) })}/></InspectorLabel><InspectorLabel>Rotation · {selectedNodePosition.rotation || 0}°<input type="range" min="-180" max="180" value={selectedNodePosition.rotation || 0} onChange={(event) => updateSelectedPosition({ rotation: Number(event.target.value) })}/></InspectorLabel>
            <InspectorLabel>{selectedNodePosition.unit === 'px' ? 'Element size' : 'Element width'} · {Math.round(selectedNodePosition.width || 86)}{selectedNodePosition.unit === 'px' ? 'px' : '%'}<input type="range" min={selectedNodePosition.unit === 'px' ? 64 : 35} max={selectedNodePosition.unit === 'px' ? 240 : 100} step={selectedNodePosition.unit === 'px' ? 4 : 1} value={selectedNodePosition.width || 86} onChange={(event) => updateSelectedPosition({ width: Number(event.target.value), unit: selectedNodePosition.unit || '%' })}/></InspectorLabel><InspectorLabel>Height · {selectedNodePosition.height || 'Auto'}px<input type="range" min="0" max="600" step="4" value={selectedNodePosition.height || 0} onChange={(event) => updateSelectedPosition({ height: Number(event.target.value) || undefined })}/></InspectorLabel><InspectorLabel>Font size · {selectedNodePosition.fontSize || 14}px<input type="range" min="8" max="72" value={selectedNodePosition.fontSize || 14} onChange={(event) => updateSelectedPosition({ fontSize: Number(event.target.value) })}/></InspectorLabel><InspectorLabel>Font weight<select value={selectedNodePosition.fontWeight || 'inherit'} onChange={(event) => updateSelectedPosition({ fontWeight: event.target.value })}><option value="inherit">Inherit</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Extra bold</option></select></InspectorLabel><InspectorLabel>Padding · {selectedNodePosition.padding ?? 0}px<input type="range" min="0" max="48" value={selectedNodePosition.padding ?? 0} onChange={(event) => updateSelectedPosition({ padding: Number(event.target.value) })}/></InspectorLabel><InspectorLabel>Border radius · {selectedNodePosition.borderRadius ?? 0}px<input type="range" min="0" max="48" value={selectedNodePosition.borderRadius ?? 0} onChange={(event) => updateSelectedPosition({ borderRadius: Number(event.target.value) })}/></InspectorLabel><InspectorLabel>Element background<input type="color" value={selectedNodePosition.nodeBackground || '#ffffff'} onChange={(event) => updateSelectedPosition({ nodeBackground: event.target.value })}/></InspectorLabel><InspectorLabel>Element text colour<input type="color" value={selectedNodePosition.nodeColor || '#222222'} onChange={(event) => updateSelectedPosition({ nodeColor: event.target.value })}/></InspectorLabel><InspectorLabel>Shadow<select value={selectedNodePosition.boxShadow || 'none'} onChange={(event) => updateSelectedPosition({ boxShadow: event.target.value })}><option value="none">None</option><option value="0 4px 12px rgba(0,0,0,.12)">Soft</option><option value="0 12px 30px rgba(0,0,0,.2)">Strong</option></select></InspectorLabel>
          </div>}

          {(selected === 'identity' || selected === 'avatar') && <div className="pm-inspector-body">
            <div className="pm-inspector-photo"><div className="pm-inspector-avatar">{draft.avatar?.url ? <img src={draft.avatar.url} alt="Profile"/> : (draft.displayName || 'P').slice(0,1)}</div><div><b>Profile image</b><small>Square image, up to 8 MB</small></div><label className="pm-icon-button" title="Upload profile photo"><Upload size={16}/><input type="file" accept="image/*" onChange={uploadAvatar} hidden disabled={uploading}/></label></div>
            <InspectorLabel>Display name<input value={draft.displayName || ''} maxLength={60} onChange={(e) => setDraft((current) => ({ ...current, displayName: e.target.value }))}/></InspectorLabel>
            <InspectorLabel>Public alias<div className="pm-input-prefix"><span>/u/</span><input value={draft.alias || ''} onChange={(e) => setDraft((current) => ({ ...current, alias: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))} minLength={3} maxLength={40}/></div></InspectorLabel>
            <InspectorLabel>Profile image shape<select value={appearance.avatarShape || 'circle'} onChange={(e) => setAppearance({ avatarShape: e.target.value })}><option value="circle">Circle</option><option value="squircle">Squircle</option><option value="rounded">Rounded square</option><option value="square">Square</option><option value="diamond">Soft diamond</option></select></InspectorLabel><InspectorLabel>Bio<textarea value={draft.bio || ''} onChange={(e) => setDraft((current) => ({ ...current, bio: e.target.value }))} rows={4} maxLength={180} placeholder="A short introduction"/></InspectorLabel>
            <div className="pm-inspector-section"><b>Text alignment</b><div className="pm-align-buttons"><button className={alignment === 'left' ? 'is-active' : ''} onClick={() => setAppearance({ alignment: 'left' })}><AlignLeft/></button><button className={alignment === 'center' ? 'is-active' : ''} onClick={() => setAppearance({ alignment: 'center' })}><AlignCenter/></button><button className={alignment === 'right' ? 'is-active' : ''} onClick={() => setAppearance({ alignment: 'right' })}><AlignRight/></button></div></div>
          </div>}

          {(selected === 'links' || selectedLink || showLinkForm) && <div className="pm-inspector-body">
            {selectedLink && <button className="pm-back-line" onClick={() => { setSelected('links'); setEditingLinkId(''); }}>← All links</button>}
            {(selectedLink || showLinkForm) && <form className="pm-inspector-form" onSubmit={updateSelectedLink}>
              <div className="pm-link-logo-preview"><LinkIcon link={linkDraft.icon ? linkDraft : selectedLink} size={28}/><span>{linkDraft.icon || selectedLink.icon}</span></div>
              <InspectorLabel>Link title<input value={linkDraft.label} onChange={(e) => setLinkDraft({ ...linkDraft, label: e.target.value })} maxLength={60} required/></InspectorLabel>
              <InspectorLabel>Destination URL<input value={linkDraft.url} onChange={(e) => setLinkDraft({ ...linkDraft, url: e.target.value })} maxLength={2048} required/></InspectorLabel>
              <InspectorLabel>Icon source<select value={linkDraft.iconFamily} onChange={(e) => { const family = e.target.value; const options = iconOptions[family] || []; setLinkDraft({ ...linkDraft, iconFamily: family, icon: options.includes(linkDraft.icon) ? linkDraft.icon : (family === 'lucide' ? 'Website' : linkDraft.platform && options.includes(linkDraft.platform) ? linkDraft.platform : options[0]) }); }}>{iconFamilies.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></InspectorLabel>
              <InspectorLabel>Find an icon<input value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} placeholder={`Search ${linkDraft.iconFamily} icons…`}/></InspectorLabel>
              <div className="pm-icon-choice-grid">{filteredIcons.map((iconName) => <button type="button" key={iconName} className={linkDraft.icon === iconName ? 'is-active' : ''} onClick={() => setLinkDraft({ ...linkDraft, icon: iconName })}><LinkIcon link={{ ...linkDraft, icon: iconName }} size={22}/><small>{iconName}</small></button>)}</div>
              {!filteredIcons.length && <p className="pm-inspector-help">No icons found in this family.</p>}
              <InspectorLabel>Icon colour treatment<select value={linkDraft.iconStyle} onChange={(e) => setLinkDraft({ ...linkDraft, iconStyle: e.target.value })}>{iconStyles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></InspectorLabel>
              {linkDraft.iconStyle === 'custom' && <InspectorLabel>Custom icon colour<input type="color" value={linkDraft.iconColor || '#333333'} onChange={(e) => setLinkDraft({ ...linkDraft, iconColor: e.target.value })}/></InspectorLabel>}
              <div className="pm-form-row"><button className="pm-primary-button" disabled={busy}><Check size={15}/> Save link</button><button type="button" className="pm-danger-button" onClick={() => deleteLink(selectedLink._id)}><Trash2 size={15}/></button></div>
            </form>}
            {!selectedLink && !showLinkForm && <>
              <p className="pm-inspector-help">Each platform has its own official mark. Change the icon family and colour treatment on an individual link.</p>
              <button className="pm-primary-button pm-full-button" onClick={() => setShowLinkLibrary(true)}><Plus size={15}/> Browse platform & link library</button>
              <div className="pm-link-manage-list">{sortedLinks.map((link) => <div className="pm-link-manage-item" key={link._id}><LinkIcon link={link} size={19}/><span><b>{link.label}</b><small>{link.url}</small></span><button onClick={() => editLink(link)} aria-label={`Edit ${link.label}`}>Edit</button><button className="pm-remove-icon" onClick={() => deleteLink(link._id)} aria-label={`Delete ${link.label}`}><Trash2 size={14}/></button></div>)}</div>
            </>}
          </div>}

          {selected === 'products' && <div className="pm-inspector-body">
            <p className="pm-inspector-help">Products appear directly on your page. Add a product, choose a layout and drag the section into place.</p>
            <InspectorLabel>Product layout<select value={appearance.productLayout || 'grid'} onChange={(e) => setAppearance({ productLayout: e.target.value })}><option value="list">Editorial list</option><option value="grid">Grid</option><option value="cards">Product cards</option></select></InspectorLabel>
            <form className="pm-inspector-form" onSubmit={addProduct}><h3>Add a product</h3><InspectorLabel>Name<input value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} required maxLength={100}/></InspectorLabel><InspectorLabel>Destination URL<input value={productDraft.url} onChange={(e) => setProductDraft({ ...productDraft, url: e.target.value })} required placeholder="https://"/></InspectorLabel><InspectorLabel>Description<textarea value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} maxLength={500}/></InspectorLabel><InspectorLabel>Price (optional)<input value={productDraft.price} onChange={(e) => setProductDraft({ ...productDraft, price: e.target.value })} maxLength={40}/></InspectorLabel><InspectorLabel>Product image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}/></InspectorLabel><button className="pm-primary-button" disabled={busy}><Plus size={15}/> {busy ? 'Adding…' : 'Add product'}</button></form>
            <div className="pm-product-management-list">{(draft.products || []).map((product) => <div className="pm-product-management-item" key={product._id}>{product.image?.url ? <img src={product.image.url} alt=""/> : <div className="pm-product-management-empty"><ShoppingBag size={17}/></div>}<span><b>{product.name}</b><small>{product.url}</small><label>{productImageBusy === product._id ? 'Uploading…' : 'Change image'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => updateProductImage(product, e.target.files?.[0])}/></label></span>{product.image?.fileId && <button className="pm-remove-icon" onClick={() => clearProductImage(product)} title="Remove image"><X size={14}/></button>}<button className="pm-remove-icon" onClick={() => deleteProduct(product._id)} title="Delete product"><Trash2 size={14}/></button></div>)}</div>
          </div>}

          {selected === 'background' && <div className="pm-inspector-body">
            <div className="pm-inspector-section"><h3>Page background image</h3><label className="pm-upload-drop"><Upload size={17}/><b>Upload a background image</b><small>Image is applied behind the centered profile card</small><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadPageBackground}/></label>{appearance.backgroundImageUrl && <button className="pm-danger-button" onClick={() => setAppearance({ backgroundImage: null, backgroundImageUrl: '' })}>Remove background image</button>}</div>
            <div className="pm-inspector-section"><h3>Card background</h3><p>Independent from the page background and colour theme.</p><div className="pm-background-grid">{pageBackgrounds.map((item) => <button type="button" key={item.id} title={item.name} className={Number(appearance.cardBackgroundId ?? 0) === item.id && !appearance.cardBackgroundGradient ? 'is-active' : ''} onClick={() => setCardBackground(item)} style={{ backgroundColor: item.color, backgroundImage: item.image, backgroundSize: item.size }}><span>{item.name}</span></button>)}</div></div>
            <GradientBuilder title="Custom card gradient" value={appearance.cardBackgroundGradient} onChange={(config) => setAppearance({ cardBackgroundGradient: config, cardBackgroundImage: null })}/>
            <CardAppearanceControls appearance={appearance} onChange={setAppearance}/>
            <div className="pm-inspector-section"><h3>Page background</h3><p>These choices affect the entire page, not the profile card.</p><div className="pm-background-grid">{pageBackgrounds.map((item) => <button key={item.id} title={item.name} className={Number(appearance.backgroundId ?? appearance.background ?? 0) === item.id && !appearance.backgroundGradient && !appearance.backgroundImageUrl ? 'is-active' : ''} onClick={() => setAppearance({ backgroundId: item.id, backgroundColor: item.color, backgroundImage: null, backgroundImageUrl: '', backgroundGradient: null })} style={{ backgroundColor: item.color, backgroundImage: item.image, backgroundSize: item.size }}><span>{item.name}</span></button>)}</div></div>
            <GradientBuilder title="Custom page gradient" value={appearance.backgroundGradient} onChange={(config) => setAppearance({ backgroundGradient: config, backgroundImage: null, backgroundImageUrl: '', backgroundId: -1 })}/>
            <div className="pm-inspector-section"><h3>Page colour theme</h3><p>Text and accent colours are applied across the complete page.</p><div className="pm-theme-grid">{pageThemes.map((item) => <button key={item.id} onClick={() => { setThemeDraft({ background: item.background, text: item.text, accent: item.accent }); setAppearance({ theme: item, backgroundColor: item.background, backgroundGradient: null }); }} className={theme.id === item.id ? 'is-active' : ''} title={item.name}><span style={{ background: item.background, color: item.text }}>Aa</span><i style={{ background: item.accent }}/><small>{item.name}</small></button>)}</div></div>
            <div className="pm-inspector-section"><h3>Custom page colours</h3><div className="pm-color-controls"><label>Background<input type="color" value={themeDraft.background} onChange={(e) => { const next = { ...themeDraft, background: e.target.value }; setThemeDraft(next); setAppearance({ theme: { ...theme, ...next, id: -1, name: 'Custom theme' }, backgroundColor: next.background, backgroundGradient: null }); }}/></label><label>Text<input type="color" value={themeDraft.text} onChange={(e) => { const next = { ...themeDraft, text: e.target.value }; setThemeDraft(next); setAppearance({ theme: { ...theme, ...next, id: -1, name: 'Custom theme' } }); }}/></label><label>Accent<input type="color" value={themeDraft.accent} onChange={(e) => { const next = { ...themeDraft, accent: e.target.value }; setThemeDraft(next); setAppearance({ theme: { ...theme, ...next, id: -1, name: 'Custom theme' } }); }}/></label></div></div>
            <div className="pm-inspector-section"><h3>Typography</h3><p>Distinct font families, grouped by visual character.</p><select value={Number(appearance.typeface ?? appearance.font ?? 0)} onChange={(e) => setAppearance({ typeface: Number(e.target.value) })}>{typefaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="pm-inspector-section"><h3>Link arrangement</h3><div className="pm-segmented">{[['list','List'],['grid','Grid'],['cards','Cards']].map(([value,label]) => <button key={value} className={(appearance.linkLayout || 'list') === value ? 'is-active' : ''} onClick={() => setAppearance({ linkLayout: value })}>{label}</button>)}</div></div>
          </div>}

          {selectedText && <TextElementInspector item={selectedText} onChange={(changes) => updateTextItem(selectedText.id, changes)} onDelete={() => { setAppearance({ textItems: (appearance.textItems || []).filter((item) => item.id !== selectedText.id) }); setSelected('identity'); }}/>}

          {selectedSticker && <div className="pm-inspector-body"><div className="pm-selected-sticker"><StickerPicker selected={[selectedSticker.stickerId]} onChoose={(stickerId) => setAppearance({ stickerItems: (appearance.stickerItems || []).map((item) => item.id === selectedSticker.id ? { ...item, stickerId } : item) })}/></div><InspectorLabel>Sticker size<input type="range" min="36" max="180" step="2" value={selectedSticker.size || 72} onChange={(e) => setAppearance({ stickerItems: (appearance.stickerItems || []).map((item) => item.id === selectedSticker.id ? { ...item, size: Number(e.target.value) } : item) })}/></InspectorLabel><InspectorLabel>Rotation<input type="range" min="-35" max="35" value={selectedSticker.rotation || 0} onChange={(e) => setAppearance({ stickerItems: (appearance.stickerItems || []).map((item) => item.id === selectedSticker.id ? { ...item, rotation: Number(e.target.value) } : item) })}/></InspectorLabel><button className="pm-danger-button pm-full-button" onClick={() => removeSticker(selectedSticker.id)}><Trash2 size={15}/> Remove sticker</button></div>}

          {selected === 'linksHeading' && <div className="pm-inspector-body"><p className="pm-inspector-help">Drag this section heading to position it, or use the link controls.</p><button className="pm-primary-button" onClick={() => { setInspectorOpen(false); setShowLinkLibrary(true); setSelected('links'); }}><Plus size={15}/> Add a link</button></div>}

          <div className="pm-inspector-footer"><button className="pm-save-bottom" onClick={savePage} disabled={busy}><Save size={15}/>{busy ? 'Saving…' : 'Save all changes'}</button></div>
        </aside>, document.body)}
        {mode === 'edit' && !inspectorOpen && <button className="pm-open-inspector" onClick={() => setInspectorOpen(true)}>Open editor panel</button>}
      </div>

      {showLinkLibrary && <div className="pm-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowLinkLibrary(false); setInspectorOpen(true); } }}><section className="pm-modal pm-link-library"><header><div><span className="pm-kicker">LINK LIBRARY</span><h2>Choose a platform or add a custom link</h2><p>Search platforms by name, then set the icon family and colour style.</p></div><button onClick={() => { setShowLinkLibrary(false); setInspectorOpen(true); }}><X/></button></header><div className="pm-search-field"><Search size={17}/><input autoFocus placeholder="Search Instagram, GitHub, portfolio…" value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)}/></div><div className="pm-platform-grid">{filteredPresets.map((preset) => <button key={preset.id} onClick={() => choosePreset(preset)}><span><LinkIcon link={{ icon: preset.name, iconFamily: 'brand', iconStyle: 'brand' }} size={22}/></span><b>{preset.name}</b></button>)}</div><button className="pm-custom-link-option" onClick={() => { setLinkDraft({ platform: 'custom', label: '', url: '', icon: 'Website', iconFamily: 'lucide', iconStyle: 'black', iconColor: '' }); setEditingLinkId(''); setShowLinkForm(true); setShowLinkLibrary(false); setSelected('links'); setInspectorOpen(true); }}>+ Create a custom link</button></section></div>}

      {showStickerLibrary && <div className="pm-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowStickerLibrary(false); setInspectorOpen(true); } }}><section className="pm-modal pm-sticker-modal"><header><div><span className="pm-kicker">STICKER LIBRARY</span><h2>Decorate your page</h2><p>Choose an illustration, type an emoji with your phone keyboard, or upload a sticker.</p></div><button onClick={() => { setShowStickerLibrary(false); setInspectorOpen(true); }}><X/></button></header><StickerPicker onChoose={addSticker}/><div className="pm-sticker-emoji-entry"><label>Type an emoji sticker<input value={stickerText} onChange={(event) => setStickerText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addEmojiSticker(stickerText); } }} onPaste={handleStickerPaste} placeholder="🎂 💖 🎉 🌸 — type or paste here"/></label><button className="pm-primary-button" type="button" onClick={() => addEmojiSticker(stickerText)} disabled={!stickerText.trim()}>Add emoji</button></div><div className="pm-emoji-quick-picks" aria-label="Quick emoji stickers">{['🎂','🎉','🥳','🎈','💖','🎁','✨','🌸','🥰','🧁','🎊','🎇','❤️','🌷','🦋','⭐'].map((emoji) => <button key={emoji} type="button" onClick={() => addEmojiSticker(emoji)} aria-label={`Add ${emoji} sticker`}>{emoji}</button>)}</div><label className="pm-upload-drop"><Upload size={18}/><b>{uploading ? 'Uploading sticker…' : 'Upload your own sticker'}</b><small>PNG, WebP, JPEG or animated GIF · up to 8 MB</small><input type="file" accept="image/png,image/webp,image/gif,image/jpeg" hidden onChange={(event) => { uploadStickerFile(event.target.files?.[0]); event.target.value = ''; }} disabled={uploading}/></label></section></div>}

      {selected === 'links' && !selectedLink && !showLinkLibrary && <div className="pm-floating-add"><button onClick={() => { setInspectorOpen(false); setShowLinkLibrary(true); }}><Plus size={16}/> Add link</button><button onClick={() => { setInspectorOpen(false); setShowStickerLibrary(true); }}><Sticker size={16}/> Add sticker</button></div>}
    </section>
  );
}
