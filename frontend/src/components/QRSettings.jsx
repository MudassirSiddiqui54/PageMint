import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus, Palette, QrCode, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { api, apiError } from '../lib/api';
import { uploadImage } from '../lib/imagekit';
import './studio/studio.css';

const presets = [
  { name: 'Classic', dots: 'square', eyes: 'square', pupils: 'square', dot: '#111827', eye: '#111827', bg: '#FFFFFF' },
  { name: 'Soft rounded', dots: 'rounded', eyes: 'extra-rounded', pupils: 'dot', dot: '#243B53', eye: '#243B53', bg: '#F4F7FA' },
  { name: 'Indigo studio', dots: 'classy-rounded', eyes: 'rounded', pupils: 'dot', dot: '#4F46E5', eye: '#3730A3', bg: '#FFFFFF' },
  { name: 'Rose print', dots: 'dots', eyes: 'rounded', pupils: 'dot', dot: '#BE3455', eye: '#8F2540', bg: '#FFF7F8' },
  { name: 'Forest', dots: 'classy', eyes: 'extra-rounded', pupils: 'rounded', dot: '#245C43', eye: '#16442F', bg: '#F3F7F2' },
  { name: 'Amber', dots: 'extra-rounded', eyes: 'square', pupils: 'square', dot: '#B45309', eye: '#92400E', bg: '#FFFBEB' },
  { name: 'Violet gradient', dots: 'rounded', eyes: 'extra-rounded', pupils: 'dot', dot: '#6D28D9', eye: '#5B21B6', bg: '#FBF9FF', gradient: true },
  { name: 'Night mode', dots: 'dots', eyes: 'rounded', pupils: 'dot', dot: '#F8FAFC', eye: '#E2E8F0', bg: '#111827' },
  { name: 'Ocean', dots: 'classy-rounded', eyes: 'extra-rounded', pupils: 'rounded', dot: '#087E8B', eye: '#065A64', bg: '#F1FAFA' }
];
const dotTypes = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
const eyeTypes = ['square', 'rounded', 'extra-rounded', 'dots', 'classy', 'classy-rounded'];
const pupilTypes = ['square', 'dot', 'rounded', 'dots', 'classy', 'classy-rounded'];
const payloadTypes = ['URL', 'Email', 'Phone', 'WiFi', 'SMS', 'Geo'];

function payloadFrom(settings, pageUrl) {
  const p = settings.payload || {};
  switch (settings.contentType) {
    case 'Email': return `mailto:${p.email || ''}?subject=${encodeURIComponent(p.subject || '')}&body=${encodeURIComponent(p.body || '')}`;
    case 'Phone': return `tel:${p.phone || ''}`;
    case 'WiFi': return `WIFI:T:${p.encryption || 'WPA'};S:${String(p.ssid || '').replace(/[;\\,:"]/g, '\\$&')};P:${String(p.password || '').replace(/[;\\,:"]/g, '\\$&')};;`;
    case 'SMS': return `SMSTO:${p.phone || ''}:${p.message || ''}`;
    case 'Geo': return `geo:${p.latitude || '0'},${p.longitude || '0'}`;
    default: return p.url || pageUrl;
  }
}

function contrastRatio(hexA, hexB) {
  const lum = (hex) => {
    const values = hex.replace('#', '').match(/.{2}/g).map((value) => parseInt(value, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
  };
  const a = lum(hexA), b = lum(hexB);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}


function imageBlobToPngDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The browser could not read this logo file.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected logo is not a supported image.'));
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
        canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
        const context = canvas.getContext('2d');
        if (!context) { reject(new Error('Canvas is unavailable for QR logo preparation.')); return; }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        try { resolve(canvas.toDataURL('image/png')); }
        catch { reject(new Error('The QR logo could not be converted to a PNG image.')); }
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(blob);
  });
}

function setDownload(blob, filename) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function MiniQrPreset({ preset }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    host.replaceChildren();
    const preview = new QRCodeStyling({
      width: 54, height: 54, type: 'svg', data: 'https://pagemint.app/demo', margin: 1,
      qrOptions: { errorCorrectionLevel: 'M' },
      dotsOptions: { type: preset.dots, color: preset.dot },
      backgroundOptions: { color: preset.bg },
      cornersSquareOptions: { type: preset.eyes, color: preset.eye },
      cornersDotOptions: { type: preset.pupils, color: preset.eye }
    });
    preview.append(host);
    return () => host.replaceChildren();
  }, [preset]);
  return <span className="pm-qr-mini-preview" ref={hostRef} aria-hidden="true"/>;
}

export default function QRSettings({ profile, user, onProfile, onMessage }) {
  const pageUrl = `${window.location.origin}/u/${profile.alias}`;
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [settings, setSettings] = useState(() => ({
    contentType: 'URL', payload: { url: pageUrl }, dotType: 'rounded', eyeType: 'extra-rounded', pupilType: 'dot',
    dotColor: '#1D3A2A', eyeColor: '#1D3A2A', pupilColor: '#1D3A2A', background: '#FFFFFF',
    useGradient: false, gradientStart: '#1D3A2A', gradientEnd: '#6CA27A', gradientType: 'linear',
    correction: 'H', size: 520, shape: 'square', margin: 18, logo: null, logoSize: .22, frame: 'none', caption: 'SCAN ME',
    ...(profile.qr || {})
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    setSettings((current) => ({ ...current, ...(profile.qr || {}), payload: { ...(current.payload || {}), ...(profile.qr?.payload || {}), url: profile.qr?.payload?.url || pageUrl } }));
  }, [profile.qr, pageUrl]);

  useEffect(() => {
    const url = settings.logo?.url;
    if (!url || logoPreview) return undefined;
    let cancelled = false;
    fetch(url, { mode: 'cors' }).then((response) => {
      if (!response.ok) throw new Error(`Logo request returned HTTP ${response.status}.`);
      return response.blob();
    }).then(imageBlobToPngDataUrl).then((dataUrl) => { if (!cancelled) setLogoPreview(dataUrl); }).catch((error) => {
      if (!cancelled) setQrError(`Saved logo could not be embedded for export: ${error.message}`);
    });
    return () => { cancelled = true; };
  }, [settings.logo?.url, logoPreview]);

  const data = payloadFrom(settings, pageUrl);
  const options = useMemo(() => ({
    width: Number(settings.size || 520), height: Number(settings.size || 520), type: 'svg', data,
    shape: settings.shape || 'square',
    margin: Number(settings.margin ?? 18),
    qrOptions: { errorCorrectionLevel: settings.logo?.url ? 'H' : (settings.correction || 'H') },
    image: logoPreview || settings.logo?.url || undefined,
    imageOptions: { hideBackgroundDots: true, imageSize: Math.min(.32, Math.max(.12, Number(settings.logoSize || .22))), margin: 7, crossOrigin: 'anonymous', saveAsBlob: true },
    dotsOptions: settings.useGradient ? {
      type: settings.dotType || 'rounded',
      gradient: { type: settings.gradientType || 'linear', rotation: 0, colorStops: [{ offset: 0, color: settings.gradientStart || '#1D3A2A' }, { offset: 1, color: settings.gradientEnd || '#6CA27A' }] }
    } : { type: settings.dotType || 'rounded', color: settings.dotColor || '#1D3A2A' },
    backgroundOptions: { color: settings.background || '#FFFFFF' },
    cornersSquareOptions: { type: settings.eyeType || 'extra-rounded', color: settings.eyeColor || settings.dotColor || '#1D3A2A' },
    cornersDotOptions: { type: settings.pupilType || 'dot', color: settings.pupilColor || settings.eyeColor || '#1D3A2A' }
  }), [settings, data, logoPreview]);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      setQrError('');
      if (!instanceRef.current) {
        instanceRef.current = new QRCodeStyling(options);
        instanceRef.current.append(containerRef.current);
      } else instanceRef.current.update(options);
    } catch (error) {
      setQrError(error?.message || 'The QR renderer could not apply these settings.');
    }
  }, [options]);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const updatePayload = (key, value) => setSettings((current) => ({ ...current, payload: { ...(current.payload || {}), [key]: value } }));
  const applyPreset = (preset) => setSettings((current) => ({
    ...current, dotType: preset.dots, eyeType: preset.eyes, pupilType: preset.pupils,
    dotColor: preset.dot, eyeColor: preset.eye, pupilColor: preset.eye, background: preset.bg,
    useGradient: Boolean(preset.gradient), gradientStart: preset.dot, gradientEnd: preset.eye
  }));

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      onMessage('QR logos must be PNG, JPEG or WebP. Convert SVG to PNG before uploading.');
      event.target.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      onMessage('QR logos must be 4 MB or smaller.');
      event.target.value = '';
      return;
    }
    setUploading(true);
    try {
      // Use a local data URL for the QR renderer. This avoids cross-origin image
      // fetches during SVG/PNG export; only the hosted file metadata is persisted.
      const preview = await imageBlobToPngDataUrl(file);
      const logo = await uploadImage(file, `pagemint/${user.id}/qr`);
      setLogoPreview(preview);
      update('logo', logo);
      setQrError('');
      onMessage('QR logo uploaded and applied to the preview.');
    } catch (error) { onMessage(error?.message ? `QR logo upload failed: ${error.message}` : apiError(error)); }
    finally { setUploading(false); event.target.value = ''; }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: response } = await api.patch('/profile/me', { qr: settings });
      onProfile({ ...profile, qr: response.profile.qr }); onMessage('QR design saved.');
    } catch (error) { onMessage(apiError(error)); }
    finally { setSaving(false); }
  };

  const download = async (extension) => {
    if (!instanceRef.current) return;
    setExporting(extension);
    let objectUrl = '';
    try {
      // Export the styled vector first, then compose the selected frame and caption
      // around it. The exported artifact therefore matches the framed preview.
      const raw = await instanceRef.current.getRawData('svg');
      const source = await raw.text();
      let output = raw;
      if (settings.frame !== 'none') {
        const viewBox = source.match(/viewBox="([^"]+)"/)?.[1] || `0 0 ${settings.size} ${settings.size}`;
        const inner = source.replace(/^.*?<svg[^>]*>/s, '').replace(/<\/svg>\s*$/i, '');
        const frameGap = 26;
        const captionHeight = settings.caption ? 62 : 22;
        const width = Number(settings.size) + frameGap * 2;
        const height = Number(settings.size) + frameGap * 2 + captionHeight;
        const radius = settings.frame === 'rounded' ? 28 : settings.frame === 'poster' ? 8 : 2;
        const stroke = settings.frame === 'thin' ? settings.dotColor : settings.frame === 'rounded' ? settings.dotColor : 'none';
        const strokeWidth = settings.frame === 'thin' ? 2 : settings.frame === 'rounded' ? 1 : 0;
        const caption = settings.caption ? `<text x="${width / 2}" y="${height - 22}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="2" fill="${settings.dotColor}">${String(settings.caption).replace(/[<>&"']/g, '')}</text>` : '';
        const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${radius}" fill="${settings.background}" stroke="${stroke}" stroke-width="${strokeWidth}"/><svg x="${frameGap}" y="${frameGap}" width="${settings.size}" height="${settings.size}" viewBox="${viewBox}">${inner}</svg>${caption}</svg>`;
        output = new Blob([frameSvg], { type: 'image/svg+xml;charset=utf-8' });
      }
      if (extension === 'svg') {
        setDownload(output, `${profile.alias}-pagemint-qr.svg`);
      } else {
        objectUrl = URL.createObjectURL(output);
        const image = new Image();
        await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = objectUrl; });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || Number(settings.size);
        canvas.height = image.naturalHeight || Number(settings.size);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable in this browser.');
        context.drawImage(image, 0, 0);
        const png = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode the PNG.')), 'image/png'));
        setDownload(png, `${profile.alias}-pagemint-qr.png`);
      }
    } catch (error) { onMessage(`QR export failed: ${error.message}`); }
    finally { if (objectUrl) URL.revokeObjectURL(objectUrl); setExporting(''); }
  };

  const contrast = contrastRatio(settings.useGradient ? settings.gradientStart : settings.dotColor, settings.background);
  const lowContrast = !Number.isFinite(contrast) || contrast < 4.5;
  const isWiFi = settings.contentType === 'WiFi';
  const isEmail = settings.contentType === 'Email';
  const isGeo = settings.contentType === 'Geo';
  const isSMS = settings.contentType === 'SMS';

  return <section className="pm-qr-studio">
    <header className="pm-qr-header"><div><span className="pm-kicker">PAGEMINT / QR DESIGNER</span><h1>Make your QR code yours.</h1><p>Real QR module styling, separate finder eyes and pupils, logo embedding, live preview and export.</p></div><button className="pm-primary-button" onClick={save} disabled={saving}><SaveIcon/>{saving ? 'Saving…' : 'Save QR design'}</button></header>
    <div className="pm-qr-workspace">
      <div className="pm-qr-preview-panel">
        <div className={`pm-qr-frame pm-qr-frame-${settings.frame}`} style={{ background: settings.frame === 'none' ? 'transparent' : settings.background }}>
          <div className="pm-qr-output" ref={containerRef}/>
          {settings.frame !== 'none' && settings.caption && <div className="pm-qr-caption" style={{ color: settings.dotColor }}>{settings.caption}</div>}
        </div>
        <div className="pm-qr-preview-meta"><span>LIVE PREVIEW</span><b>{settings.size} × {settings.size}px</b></div>
        {qrError && <p className="pm-qr-error" role="alert">QR preview error: {qrError}</p>}
        <div className="pm-qr-url">{data}</div>
        <div className="pm-qr-export"><button className="pm-primary-button" onClick={() => download('png')} disabled={!!exporting}><Download size={15}/>{exporting === 'png' ? 'Preparing…' : 'Download PNG'}</button><button className="pm-quiet-button" onClick={() => download('svg')} disabled={!!exporting}><Download size={15}/>{exporting === 'svg' ? 'Preparing…' : 'Download SVG'}</button></div>
        <div className={`pm-qr-scan-note ${lowContrast ? 'is-warning' : ''}`}><ShieldCheck size={16}/><span>{lowContrast ? 'Contrast is low. Choose stronger foreground/background colours for reliable scanning.' : 'Good contrast. Use a quiet zone and test the final export with a phone before printing.'}</span></div>
      </div>
      <div className="pm-qr-controls">
        <section className="pm-qr-control-section"><h2>Content</h2><p>Choose what the QR code should open.</p><div className="pm-qr-type-grid">{payloadTypes.map((type) => <button key={type} className={settings.contentType === type ? 'is-active' : ''} onClick={() => update('contentType', type)}>{type}</button>)}</div>
          {settings.contentType === 'URL' && <label>Page URL<input value={settings.payload?.url || pageUrl} onChange={(e) => updatePayload('url', e.target.value)} placeholder="https://example.com"/></label>}
          {isEmail && <><label>Email address<input value={settings.payload?.email || ''} onChange={(e) => updatePayload('email', e.target.value)} placeholder="hello@example.com"/></label><label>Subject<input value={settings.payload?.subject || ''} onChange={(e) => updatePayload('subject', e.target.value)}/></label><label>Message<textarea value={settings.payload?.body || ''} onChange={(e) => updatePayload('body', e.target.value)}/></label></>}
          {(settings.contentType === 'Phone' || isSMS) && <label>Phone number<input value={settings.payload?.phone || ''} onChange={(e) => updatePayload('phone', e.target.value)} placeholder="+91…"/></label>}
          {isSMS && <label>Message<input value={settings.payload?.message || ''} onChange={(e) => updatePayload('message', e.target.value)}/></label>}
          {isWiFi && <><label>Network name (SSID)<input value={settings.payload?.ssid || ''} onChange={(e) => updatePayload('ssid', e.target.value)}/></label><label>Password<input type="text" value={settings.payload?.password || ''} onChange={(e) => updatePayload('password', e.target.value)}/></label><label>Security<select value={settings.payload?.encryption || 'WPA'} onChange={(e) => updatePayload('encryption', e.target.value)}><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></label></>}
          {isGeo && <div className="pm-qr-two-col"><label>Latitude<input value={settings.payload?.latitude || ''} onChange={(e) => updatePayload('latitude', e.target.value)}/></label><label>Longitude<input value={settings.payload?.longitude || ''} onChange={(e) => updatePayload('longitude', e.target.value)}/></label></div>}
        </section>
        <section className="pm-qr-control-section"><h2>Presets</h2><p>Presets change actual QR geometry, not just the hue.</p><div className="pm-qr-presets">{presets.map((preset) => <button key={preset.name} onClick={() => applyPreset(preset)} className={settings.dotType === preset.dots && settings.eyeType === preset.eyes && settings.pupilType === preset.pupils && settings.dotColor === preset.dot ? 'is-active' : ''}><MiniQrPreset preset={preset}/><small>{preset.name}</small></button>)}</div></section>
        <section className="pm-qr-control-section"><h2>Dots</h2><div className="pm-qr-choice-grid">{dotTypes.map((type) => <button key={type} className={settings.dotType === type ? 'is-active' : ''} onClick={() => update('dotType', type)}><i className={`qr-dot-preview qr-dot-${type}`}/><span>{type.replaceAll('-', ' ')}</span></button>)}</div></section>
        <section className="pm-qr-control-section"><h2>Finder eyes & pupils</h2><p>These are separate QR structures. Select the outer finder frame and its inner pupil independently.</p><h3 className="pm-qr-subheading">Outer eye frame</h3><div className="pm-qr-choice-grid">{eyeTypes.map((type) => <button type="button" key={type} className={settings.eyeType === type ? 'is-active' : ''} onClick={() => update('eyeType', type)}><i className={`qr-eye-preview qr-eye-${type}`}><b/></i><span>{type.replaceAll('-', ' ')}</span></button>)}</div><h3 className="pm-qr-subheading">Inner pupil</h3><div className="pm-qr-choice-grid">{pupilTypes.map((type) => <button type="button" key={type} className={settings.pupilType === type ? 'is-active' : ''} onClick={() => update('pupilType', type)}><i className={`qr-pupil-preview qr-pupil-${type}`}/><span>{type.replaceAll('-', ' ')}</span></button>)}</div></section>
        <section className="pm-qr-control-section"><h2>Colours</h2><div className="pm-qr-colours"><label>Dots<input type="color" value={settings.dotColor} onChange={(e) => update('dotColor', e.target.value)}/></label><label>Eye frame<input type="color" value={settings.eyeColor} onChange={(e) => update('eyeColor', e.target.value)}/></label><label>Pupil<input type="color" value={settings.pupilColor} onChange={(e) => update('pupilColor', e.target.value)}/></label><label>Background<input type="color" value={settings.background} onChange={(e) => update('background', e.target.value)}/></label></div><label className="pm-qr-toggle"><input type="checkbox" checked={settings.useGradient} onChange={(e) => update('useGradient', e.target.checked)}/> Gradient fill</label>{settings.useGradient && <><div className="pm-qr-colours"><label>Start<input type="color" value={settings.gradientStart} onChange={(e) => update('gradientStart', e.target.value)}/></label><label>End<input type="color" value={settings.gradientEnd} onChange={(e) => update('gradientEnd', e.target.value)}/></label></div><label>Gradient type<select value={settings.gradientType} onChange={(e) => update('gradientType', e.target.value)}><option value="linear">Linear</option><option value="radial">Radial</option></select></label></>}</section>
        <section className="pm-qr-control-section"><h2>Logo</h2><p>Image in the centre. Error correction is raised to H automatically.</p><div className="pm-qr-logo-row">{settings.logo?.url ? <img src={settings.logo.url} alt="QR logo"/> : <div className="pm-qr-logo-empty"><ImagePlus/></div>}<label className="pm-quiet-button"><UploadIcon/>{uploading ? 'Uploading…' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadLogo} disabled={uploading}/></label>{settings.logo?.fileId && <button className="pm-danger-button" onClick={() => { update('logo', null); setLogoPreview(''); }}><Trash2 size={14}/></button>}</div>{settings.logo?.url && <label>Logo size<input type="range" min=".12" max=".32" step=".01" value={settings.logoSize} onChange={(e) => update('logoSize', Number(e.target.value))}/></label>}</section>
        <section className="pm-qr-control-section"><h2>Canvas & output</h2><div className="pm-qr-two-col"><label>QR shape<select value={settings.shape || 'square'} onChange={(e) => update('shape', e.target.value)}><option value="square">Square modules</option><option value="circle">Circle scatter</option></select></label><label>Quiet zone<input type="range" min="4" max="48" step="2" value={settings.margin ?? 18} onChange={(e) => update('margin', Number(e.target.value))}/></label></div><div className="pm-qr-two-col"><label>Error correction<select value={settings.correction} onChange={(e) => update('correction', e.target.value)}><option value="L">L · 7%</option><option value="M">M · 15%</option><option value="Q">Q · 25%</option><option value="H">H · 30%</option></select></label><label>Size<select value={settings.size} onChange={(e) => update('size', Number(e.target.value))}><option value="300">300 px</option><option value="520">520 px</option><option value="800">800 px</option><option value="1200">1200 px</option></select></label></div><label>Frame style<select value={settings.frame} onChange={(e) => update('frame', e.target.value)}><option value="none">No frame</option><option value="thin">Thin outline</option><option value="rounded">Rounded frame</option><option value="poster">Poster frame</option></select></label>{settings.frame !== 'none' && <label>Caption<input value={settings.caption} onChange={(e) => update('caption', e.target.value.slice(0, 32))} maxLength={32}/></label>}</section>
      </div>
    </div>
  </section>;
}

function SaveIcon() { return <QrCode size={15}/>; }
function UploadIcon() { return <ImagePlus size={14}/>; }
