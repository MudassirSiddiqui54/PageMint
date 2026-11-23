export const DEFAULT_GRADIENT = {
  type: 'linear',
  angle: 135,
  shape: 'ellipse',
  position: 'center',
  colors: ['#f7b7c8', '#b9c9f4']
};

const HEX = /^#[0-9a-f]{6}$/i;
const POSITIONS = new Set([
  'center', 'top', 'right', 'bottom', 'left',
  'top left', 'top right', 'bottom left', 'bottom right'
]);

export function normalizeGradient(value) {
  const source = value && typeof value === 'object' ? value : {};
  const colors = Array.isArray(source.colors)
    ? source.colors.filter((color) => typeof color === 'string' && HEX.test(color)).slice(0, 6)
    : [];
  const safeColors = colors.length >= 2 ? colors : DEFAULT_GRADIENT.colors;
  const angle = Number.isFinite(Number(source.angle)) ? Math.max(0, Math.min(360, Number(source.angle))) : 135;
  return {
    type: source.type === 'radial' ? 'radial' : 'linear',
    angle,
    shape: source.shape === 'circle' ? 'circle' : 'ellipse',
    position: POSITIONS.has(source.position) ? source.position : 'center',
    colors: safeColors
  };
}

export function gradientToCss(value) {
  if (!value) return '';
  const config = normalizeGradient(value);
  const stops = config.colors.map((color, index) => {
    const percent = config.colors.length === 1 ? 0 : Math.round(index / (config.colors.length - 1) * 100);
    return `${color} ${percent}%`;
  }).join(', ');
  return config.type === 'radial'
    ? `radial-gradient(${config.shape} at ${config.position}, ${stops})`
    : `linear-gradient(${config.angle}deg, ${stops})`;
}

const SHADOW_ALPHA = { none: 0, soft: 0.10, medium: 0.16, strong: 0.24, dramatic: 0.32 };
const hexToRgba = (hex, alpha) => {
  const safe = HEX.test(hex || '') ? hex : '#26352b';
  const value = safe.slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export function cardAppearanceStyles(appearance = {}) {
  const shadow = ['none', 'soft', 'medium', 'strong', 'dramatic'].includes(appearance.cardShadow)
    ? appearance.cardShadow
    : 'medium';
  const blur = { none: 0, soft: 24, medium: 48, strong: 68, dramatic: 88 }[shadow];
  const y = { none: 0, soft: 8, medium: 18, strong: 26, dramatic: 34 }[shadow];
  const alpha = SHADOW_ALPHA[shadow];
  const shadowColor = hexToRgba(appearance.cardShadowColor || '#26352b', alpha);
  return {
    '--pm-card-radius': `${Math.max(0, Math.min(64, Number(appearance.cardRadius ?? 24)))}px`,
    '--pm-card-border-width': `${Math.max(0, Math.min(12, Number(appearance.cardBorderWidth ?? 1)))}px`,
    '--pm-card-border-color': HEX.test(appearance.cardBorderColor || '') ? appearance.cardBorderColor : 'rgba(40,45,40,.08)',
    '--pm-card-shadow': shadow === 'none' ? 'none' : `0 ${y}px ${blur}px ${shadowColor}`,
    '--pm-card-padding': `${Math.max(8, Math.min(72, Number(appearance.cardPadding ?? 28)))}px`
  };
}
