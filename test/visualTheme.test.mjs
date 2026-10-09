/** Run: node test/visualTheme.test.mjs */
import assert from 'node:assert/strict';
import { prefersReducedMotion } from '../js/visualTheme.js';
import { getColorScheme } from '../js/constants/colors.js';
import TapEffects from '../js/tapEffects.js';
import Polygon from '../js/polygon.js';
function luminance(hex) {
  const parts = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = parts.map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const scheme = getColorScheme();
assert.equal(scheme.id, 'pop-candy');
assert.equal(scheme.background, '#FFFAF5');
assert.equal(scheme.buttonPrimary, '#F97316');
assert.ok(contrast(scheme.text, scheme.background) >= 4.5);
assert.ok(contrast(scheme.textSecondary, scheme.background) >= 4.5);
const candyEffects = new TapEffects({ reducedMotion: false });
candyEffects.emit({ x: 10, y: 10 }, 1);
assert.equal(candyEffects.bursts.at(-1).color, scheme.accent);
candyEffects.emit({ x: 10, y: 10 }, 10);
assert.equal(candyEffects.bursts.at(-1).color, scheme.accent);
candyEffects.emit({ x: 10, y: 10 }, 15);
assert.equal(candyEffects.bursts.at(-1).color, scheme.accent);
candyEffects.emitContact({ x: 10, y: 10 }, 'ui');
assert.equal(candyEffects.contacts.at(-1).color, scheme.buttonPrimary);
globalThis.window = { matchMedia: () => ({ matches: true }) };
assert.ok(prefersReducedMotion());
const effects = new TapEffects();
effects.emit({ x: 10, y: 10 }, 20);
assert.equal(effects.bursts[0].particles.length, 0);
assert.equal(effects.shakeTime, 0);
effects.emit({ x: 20, y: 20 }, 21);
assert.equal(effects.trails.length, 0);
assert.equal(effects.getButtonScale('start'), 1);
const polygon = new Polygon([{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 20, y: 40 }], 1);
polygon.playSuccess(20);
assert.equal(polygon.getEdgeBulge(), 0);
polygon.shake();
assert.equal(polygon.shakeTime, 0);
delete globalThis.window;
console.log('Visual theme: original candy palette, matching effects, text contrast and reduced-motion behavior passed');
