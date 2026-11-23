import test from 'node:test';
import assert from 'node:assert/strict';
import { cardAppearanceStyles, gradientToCss, normalizeGradient } from './src/lib/backgrounds.js';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('linear gradients preserve direction and evenly distribute two to six colour stops', () => {
  const css = gradientToCss({ type: 'linear', angle: 225, colors: ['#112233', '#445566', '#778899'] });
  assert.equal(css, 'linear-gradient(225deg, #112233 0%, #445566 50%, #778899 100%)');
});

test('radial gradients support shape and selectable origin', () => {
  const css = gradientToCss({ type: 'radial', shape: 'circle', position: 'top right', colors: ['#ffffff', '#000000'] });
  assert.equal(css, 'radial-gradient(circle at top right, #ffffff 0%, #000000 100%)');
});

test('gradient input is bounded and invalid colours are discarded', () => {
  const config = normalizeGradient({ type: 'linear', angle: 999, colors: ['red', '#ABCDEF', '#000000', '#ffffff', '#123456', '#abcdef', '#010203'] });
  assert.equal(config.angle, 360);
  assert.equal(config.colors.length, 6);
  assert.deepEqual(config.colors[0], '#ABCDEF');
});

test('card styling settings generate independent CSS variables', () => {
  const styles = cardAppearanceStyles({ cardRadius: 42, cardBorderWidth: 3, cardBorderColor: '#123456', cardPadding: 36, cardShadow: 'strong', cardShadowColor: '#010203' });
  assert.equal(styles['--pm-card-radius'], '42px');
  assert.equal(styles['--pm-card-border-width'], '3px');
  assert.equal(styles['--pm-card-border-color'], '#123456');
  assert.equal(styles['--pm-card-padding'], '36px');
  assert.match(styles['--pm-card-shadow'], /rgba\(1, 2, 3, 0\.24\)/);
});

test('both editors expose independent custom gradient builders and card styling controls', async () => {
  const [profile, birthday, pageCanvas, birthdayCanvas, css] = await Promise.all([
    read('./src/components/studio/VisualPageStudio.jsx'),
    read('./src/components/BirthdayStudio.jsx'),
    read('./src/components/studio/PageCanvas.jsx'),
    read('./src/components/studio/BirthdayCanvas.jsx'),
    read('./src/components/studio/studio.css')
  ]);
  for (const source of [profile, birthday]) {
    assert.match(source, /Custom page gradient/);
    assert.match(source, /Custom card gradient/);
    assert.match(source, /CardAppearanceControls/);
  }
  for (const source of [pageCanvas, birthdayCanvas]) {
    assert.match(source, /gradientToCss\(appearance\.backgroundGradient\)/);
    assert.match(source, /gradientToCss\(appearance\.cardBackgroundGradient\)/);
    assert.match(source, /cardAppearanceStyles\(appearance\)/);
  }
  assert.match(css, /--pm-card-radius/);
  assert.match(css, /--pm-card-border-color/);
  assert.match(css, /--pm-card-shadow/);
});
