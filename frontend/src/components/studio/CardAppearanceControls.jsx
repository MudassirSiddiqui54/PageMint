import { cardAppearanceStyles } from '../../lib/backgrounds';

function Label({ children }) { return <label className="pm-inspector-label">{children}</label>; }

export default function CardAppearanceControls({ appearance, onChange }) {
  const radius = Number(appearance.cardRadius ?? 24);
  const borderWidth = Number(appearance.cardBorderWidth ?? 1);
  const padding = Number(appearance.cardPadding ?? 28);
  const shadow = appearance.cardShadow || 'medium';
  const previewStyle = cardAppearanceStyles(appearance);

  return <div className="pm-inspector-section pm-card-appearance-controls">
    <h3>Card shape &amp; depth</h3>
    <p className="pm-inspector-help">These controls affect the card only. They do not change either background or the page colour theme.</p>
    <Label>Corner radius · {radius}px<input type="range" min="0" max="64" step="1" value={radius} onChange={(event) => onChange({ cardRadius: Number(event.target.value) })}/></Label>
    <div className="pm-gradient-control-row">
      <label>Border width<select value={borderWidth} onChange={(event) => onChange({ cardBorderWidth: Number(event.target.value) })}>{[0, 1, 2, 3, 4, 6, 8, 10, 12].map((width) => <option value={width} key={width}>{width}px</option>)}</select></label>
      <label>Border colour<input type="color" value={appearance.cardBorderColor || '#e6e9e4'} onChange={(event) => onChange({ cardBorderColor: event.target.value })}/></label>
    </div>
    <Label>Card padding · {padding}px<input type="range" min="8" max="72" step="2" value={padding} onChange={(event) => onChange({ cardPadding: Number(event.target.value) })}/></Label>
    <div className="pm-gradient-control-row">
      <label>Shadow<select value={shadow} onChange={(event) => onChange({ cardShadow: event.target.value })}><option value="none">None</option><option value="soft">Soft</option><option value="medium">Medium</option><option value="strong">Strong</option><option value="dramatic">Dramatic</option></select></label>
      <label>Shadow colour<input type="color" value={appearance.cardShadowColor || '#26352b'} onChange={(event) => onChange({ cardShadowColor: event.target.value })}/></label>
    </div>
    <div className="pm-card-style-preview-wrap"><span>Preview</span><div className="pm-card-style-preview" style={previewStyle}><span>Card</span></div></div>
  </div>;
}
