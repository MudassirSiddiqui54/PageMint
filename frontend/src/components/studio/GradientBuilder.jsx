import { useMemo } from 'react';
import { normalizeGradient, gradientToCss } from '../../lib/backgrounds';

const DIRECTIONS = [
  ['Up', 0], ['Up-right', 45], ['Right', 90], ['Down-right', 135],
  ['Down', 180], ['Down-left', 225], ['Left', 270], ['Up-left', 315]
];
const POSITIONS = ['center', 'top', 'top right', 'right', 'bottom right', 'bottom', 'bottom left', 'left', 'top left'];

export default function GradientBuilder({ title, value, onChange }) {
  const config = useMemo(() => normalizeGradient(value), [value]);
  const update = (changes) => onChange({ ...config, ...changes });
  const updateColor = (index, color) => {
    const colors = [...config.colors];
    colors[index] = color;
    update({ colors });
  };
  const resizeStops = (count) => {
    const colors = [...config.colors];
    while (colors.length < count) {
      const previous = colors[colors.length - 1] || '#ffffff';
      colors.push(previous);
    }
    update({ colors: colors.slice(0, count) });
  };
  const directionLabel = DIRECTIONS.find(([, angle]) => angle === config.angle)?.[0] || 'Custom';

  return <section className="pm-gradient-builder">
    <div className="pm-gradient-builder-title"><h4>{title}</h4><span>Custom gradient</span></div>
    <div className="pm-gradient-preview" style={{ background: gradientToCss(config) }} aria-label="Gradient preview" />
    <div className="pm-gradient-control-row">
      <label>Gradient type<select value={config.type} onChange={(event) => update({ type: event.target.value })}><option value="linear">Linear</option><option value="radial">Radial</option></select></label>
      <label>Number of colours<select value={config.colors.length} onChange={(event) => resizeStops(Number(event.target.value))}>{[2, 3, 4, 5, 6].map((count) => <option value={count} key={count}>{count}</option>)}</select></label>
    </div>
    {config.type === 'linear' ? <div className="pm-gradient-direction">
      <div className="pm-gradient-direction-label"><b>Direction</b><span>{directionLabel} · {config.angle}°</span></div>
      <select value={DIRECTIONS.some(([, angle]) => angle === config.angle) ? String(config.angle) : 'custom'} onChange={(event) => { if (event.target.value !== 'custom') update({ angle: Number(event.target.value) }); }}>
        {DIRECTIONS.map(([label, angle]) => <option value={angle} key={angle}>{label} ({angle}°)</option>)}
        {!DIRECTIONS.some(([, angle]) => angle === config.angle) && <option value="custom">Custom angle</option>}
      </select>
      <input aria-label="Linear gradient angle" type="range" min="0" max="360" step="1" value={config.angle} onChange={(event) => update({ angle: Number(event.target.value) })}/>
    </div> : <div className="pm-gradient-control-row">
      <label>Shape<select value={config.shape} onChange={(event) => update({ shape: event.target.value })}><option value="ellipse">Ellipse</option><option value="circle">Circle</option></select></label>
      <label>Origin<select value={config.position} onChange={(event) => update({ position: event.target.value })}>{POSITIONS.map((position) => <option value={position} key={position}>{position.replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}</select></label>
    </div>}
    <div className="pm-gradient-colors">
      {config.colors.map((color, index) => <label className="pm-gradient-color" key={`${index}-${config.colors.length}`}><span>Colour {index + 1}</span><input type="color" value={color} onChange={(event) => updateColor(index, event.target.value)}/><code>{color.toUpperCase()}</code></label>)}
    </div>
  </section>;
}
