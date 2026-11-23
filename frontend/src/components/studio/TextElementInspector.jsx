import { Trash2 } from 'lucide-react';

const fonts = [
  ['Bodoni Moda','Elegant serif'],['Playfair Display','Editorial serif'],['DM Serif Display','Display serif'],['Cormorant Garamond','Romantic serif'],['Fraunces','Soft expressive serif'],['Abril Fatface','Bold display'],['Cinzel Decorative','Ornamental'],['Dancing Script','Handwritten'],['Great Vibes','Calligraphy'],['Sacramento','Signature'],['Allura','Script'],['Pacifico','Retro script'],['Lobster','Playful display'],['Righteous','Geometric display'],['Bebas Neue','Condensed display'],['Bungee','Bold display'],['Unbounded','Wide display'],['Syne','Art direction'],['Outfit','Modern rounded'],['Sora','Geometric']
];
export default function TextElementInspector({ item, onChange, onDelete }) {
  if (!item) return null;
  const field = (key, value) => onChange({ [key]: value });
  return <div className="pm-inspector-body pm-text-inspector">
    <label className="pm-inspector-label">Text<textarea rows={4} value={item.text || ''} onChange={(e) => field('text', e.target.value)} maxLength={1200}/></label>
    <div className="pm-inspector-section"><h3>Typography</h3>
      <label className="pm-inspector-label">Decorative font<select value={item.fontFamily || 'inherit'} onChange={(e) => field('fontFamily', e.target.value)}><option value="inherit">Page font</option>{fonts.map(([name, desc]) => <option key={name} value={`'${name}', cursive`}>{name} — {desc}</option>)}</select></label>
      <label className="pm-inspector-label">Font size · {item.fontSize ?? 24}px<input type="range" min="8" max="120" value={item.fontSize ?? 24} onChange={(e) => field('fontSize', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Weight<select value={item.fontWeight || 600} onChange={(e) => field('fontWeight', Number(e.target.value))}>{[300,400,500,600,700,800,900].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      <label className="pm-inspector-label">Style<select value={item.fontStyle || 'normal'} onChange={(e) => field('fontStyle', e.target.value)}><option value="normal">Normal</option><option value="italic">Italic</option></select></label>
      <label className="pm-inspector-label">Letter spacing · {item.letterSpacing || 0}px<input type="range" min="-3" max="12" step="0.5" value={item.letterSpacing || 0} onChange={(e) => field('letterSpacing', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Line height<input type="range" min="0.8" max="2.4" step="0.05" value={item.lineHeight || 1.25} onChange={(e) => field('lineHeight', Number(e.target.value))}/></label>
      <div className="pm-text-color-row"><label>Text colour<input type="color" value={item.color || '#30243a'} onChange={(e) => field('color', e.target.value)}/></label><label>Background<input type="color" value={item.background && item.background !== 'transparent' ? item.background : '#ffffff'} onChange={(e) => field('background', e.target.value)}/></label></div>
      <label className="pm-inspector-label">Alignment<select value={item.textAlign || 'center'} onChange={(e) => field('textAlign', e.target.value)}><option>left</option><option>center</option><option>right</option></select></label>
    </div>
    <div className="pm-inspector-section"><h3>Transform & box</h3>
      <label className="pm-inspector-label">Width · {item.width ?? 80}%<input type="range" min="10" max="100" value={item.width ?? 80} onChange={(e) => field('width', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Rotation · {item.rotation || 0}°<input type="range" min="-180" max="180" value={item.rotation || 0} onChange={(e) => field('rotation', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Padding · {item.padding ?? 4}px<input type="range" min="0" max="64" value={item.padding ?? 4} onChange={(e) => field('padding', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Radius · {item.borderRadius || 0}px<input type="range" min="0" max="80" value={item.borderRadius || 0} onChange={(e) => field('borderRadius', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Border width<input type="range" min="0" max="8" value={item.borderWidth || 0} onChange={(e) => field('borderWidth', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Border colour<input type="color" value={item.borderColor || '#d9c7d4'} onChange={(e) => field('borderColor', e.target.value)}/></label>
      <label className="pm-inspector-label">Opacity<input type="range" min="0.1" max="1" step="0.05" value={item.opacity ?? 1} onChange={(e) => field('opacity', Number(e.target.value))}/></label>
      <label className="pm-inspector-label">Shadow<select value={item.shadowPreset || 'none'} onChange={(e) => { const v=e.target.value; field('shadowPreset',v); field('boxShadow',v==='none'?'none':v==='soft'?'0 4px 18px rgba(25,20,35,.16)':v==='bold'?'0 12px 35px rgba(25,20,35,.3)':'0 2px 8px rgba(25,20,35,.12)'); }}><option value="none">None</option><option value="subtle">Subtle</option><option value="soft">Soft</option><option value="bold">Bold</option></select></label>
      <label className="pm-inspector-label">Text shadow<select value={item.textShadowPreset || 'none'} onChange={(e) => { const v=e.target.value; field('textShadowPreset',v); field('textShadow',v==='none'?'none':v==='glow'?'0 0 14px currentColor':'2px 3px 5px rgba(0,0,0,.28)'); }}><option value="none">None</option><option value="lift">Lift</option><option value="glow">Glow</option></select></label>
    </div>
    <button type="button" className="pm-danger-button pm-full-button" onClick={onDelete}><Trash2 size={15}/> Delete text box</button>
  </div>;
}
