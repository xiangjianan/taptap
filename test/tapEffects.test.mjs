/** Run: node test/tapEffects.test.mjs */
import assert from 'node:assert/strict';
import TapEffects from '../js/tapEffects.js';
import Polygon from '../js/polygon.js';

const center = { x: 120, y: 220 };
const fx = new TapEffects();
fx.emit(center, 1);
center.x = 999;
assert.equal(fx.lastHit.x, 120, 'Origins must not follow caller mutation');
fx.update(0.1);
fx.emit({ x: 150, y: 240 }, 2);
assert.equal(fx.trails.length, 0, 'Combo hits must not create slash trails');
fx.emit(center, 0, true);
fx.emit(center, 1);
assert.equal(fx.trails.length, 0, 'Correct and error taps must keep trails disabled');
fx.update(2.1);
fx.emit(center, 2);
assert.equal(fx.trails.length, 0, 'Expired combo must not leave a stale trail');
fx.emit(center, 15);
assert.ok(fx.bursts.at(-1).milestone, '15 is the actual狂暴 combo threshold');
for (let i = 0; i < 1000; i++) fx.emit(center, 20);
assert.ok(fx.bursts.length <= 10);
assert.ok(fx.trails.length <= 6);
assert.ok(fx.bursts.reduce((n, b) => n + b.particles.length, 0) <= 260);
fx.update(0.04);
assert.deepEqual(fx.offset, { x: 0, y: 0 }, 'High combos and milestones must keep the board fixed');
assert.equal(fx.shakeTime, 0);
for (const count of [4, 5, 10, 15, 20, 50, 100]) {
  fx.emit(center, count);
  fx.update(0.016);
  assert.deepEqual(fx.offset, { x: 0, y: 0 });
  assert.equal(fx.shakeTime, 0);
}
fx.update(5);
assert.equal(fx.bursts.length, 0, 'A delayed frame should expire effects immediately');
assert.equal(fx.trails.length, 0);
assert.equal(fx.offset.x, 0);
assert.equal(fx.offset.y, 0);

const a = new TapEffects();
const b = new TapEffects();
a.emit(center, 10); b.emit(center, 10);
for (let i = 0; i < 6; i++) a.update(1 / 30);
for (let i = 0; i < 24; i++) b.update(1 / 120);
assert.ok(Math.abs(a.bursts[0].age - b.bursts[0].age) < 1e-10, 'Effect timing must be independent of frame rate');
a.update(NaN); a.update(-1);
assert.ok(Number.isFinite(a.bursts[0].age));
a.reset();
assert.equal(a.lastHit, null);
assert.equal(a.bursts.length, 0);
assert.equal(a.trails.length, 0);

const polygon = new Polygon([{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 60 }, { x: 0, y: 60 }], 1);
polygon.shake();
polygon.playSuccess(20);
assert.equal(polygon.isError, false, 'Correcting an error should clear its red flash');
assert.equal(polygon.shakeTime, 0);
assert.equal(polygon.getEdgeBulge(), 0, 'Edges begin at the original contour');
polygon.update(0.12);
assert.equal(polygon.getEdgeBulge(), 0, 'Correct click keeps the contour fixed');
polygon.update(1);
assert.equal(polygon.getEdgeBulge(), 0, 'Long frames must not strand the impulse');
assert.ok(polygon.containsPoint({ x: 30, y: 30 }), 'Visual impulses must not mutate polygon geometry');
console.log('Tap effects: trails, thresholds, resource bounds, lifecycle, timing and polygon recovery passed');

const ordinary = new TapEffects();
ordinary.emit({ x: 15, y: 25 }, 1);
assert.equal(ordinary.bursts[0].particles.length, 0, 'Ordinary clicks must not create particles');
assert.equal(ordinary.bursts[0].milestone, false);
assert.equal(ordinary.shakeTime, 0, 'Ordinary taps should not shake the whole board');
ordinary.emitContact({ x: 50, y: 60 }, 'ui', 'start');
assert.ok(ordinary.getButtonScale('start') < 1, 'Buttons should compress immediately');
ordinary.update(0.1);
assert.ok(ordinary.getButtonScale('start') > 1, 'Buttons should rebound above their base size');
for (let i = 0; i < 100; i++) ordinary.emitContact({ x: i, y: 60 }, 'repeat');
assert.equal(ordinary.contacts.length, 8, 'Neutral taps must have a separate bounded budget');
assert.equal(ordinary.bursts.length, 1, 'Neutral taps must not trigger combo bursts');
ordinary.update(1);
assert.equal(ordinary.contacts.length, 0);
assert.equal(ordinary.getButtonScale('start'), null);
console.log('Ordinary taps: baseline particles, button rebound and neutral-contact cleanup passed');

// Exercise board input without importing render.js and its DOM setup.
const { readFile } = await import('node:fs/promises');
let gameSource = await readFile(new URL('../js/gameManager.js', import.meta.url), 'utf8');
gameSource = gameSource.replace("import { SAFE_AREA } from './render';", 'const SAFE_AREA = { top: 0, bottom: 0 };');
for (const name of ['bubbleGenerator', 'comboManager', 'eggManager', 'tapEffects', 'visualTheme']) {
  gameSource = gameSource.replace(new RegExp(`'\\./${name}(?:\\.js)?'`), JSON.stringify(new URL(`../js/${name}.js`, import.meta.url).href));
}
const { default: GameManager } = await import(`data:text/javascript;base64,${Buffer.from(gameSource).toString('base64')}`);
const game = new GameManager(375, 812);
game.gameState = 'playing';
game.gameMode = 'untimed';
game.totalNumbers = 10;
game.polygons = [1, 2, 3].map((number, i) => new Polygon([
  { x: 20 + i * 70, y: 150 }, { x: 80 + i * 70, y: 150 },
  { x: 80 + i * 70, y: 210 }, { x: 20 + i * 70, y: 210 }
], number));
game.handleClick(35, 170);
assert.equal(game.currentNumber, 2);
assert.equal(game.tapEffects.bursts[0].x, 35, 'Effects should originate at the fingertip');
game.handleClick(35, 170);
assert.equal(game.currentNumber, 2);
assert.equal(game.errorCount, 0);
assert.equal(game.getComboCount(), 1, 'Repeat feedback must not mutate the combo');
assert.equal(game.tapEffects.contacts.at(-1).kind, 'repeat');
game.handleClick(170, 170);
assert.equal(game.errorCount, 1);
assert.ok(game.tapEffects.bursts.at(-1).wrong);
assert.equal(game.getComboCount(), 0);
game.handleClick(300, 300);
assert.equal(game.tapEffects.contacts.at(-1).kind, 'empty');
const contacts = game.tapEffects.contacts.length;
game.handleClick(300, 50);
assert.equal(game.tapEffects.contacts.length, contacts, 'Header gaps must not produce board ripples');
game.isPaused = true;
game.handleClick(110, 170);
assert.equal(game.currentNumber, 2);
game.comboManager.clearComboTimer();
console.log('Board taps: fingertip origin, repeat semantics, error feedback, empty space and pause passed');

const fifthHit = new TapEffects();
fifthHit.emit({ x: 100, y: 100 }, 5);
assert.equal(fifthHit.bursts[0].particles.length, 0, 'Combo milestones must not create particles');
fifthHit.renderAccents(new Proxy({}, { get() { throw new Error('Fifth combo must not draw a board frame'); } }), { x: 0, y: 0, width: 375, height: 812 });
console.log('Fifth combo: local feedback remains, board-frame pulse disabled');

const fixedCell = new Polygon([{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 60 }, { x: 0, y: 60 }], 1);
fixedCell.playSuccess(20);
fixedCell.update(0.12);
let straightEdges = 0;
fixedCell.traceShape({ beginPath() {}, moveTo() {}, lineTo() { straightEdges++; }, closePath() {}, quadraticCurveTo() { throw Error('Number cell must not bulge'); } });
assert.equal(straightEdges, 3);
assert.equal(fixedCell.successTime, 0);
console.log('Number cells: click rebound disabled, original contour preserved');

for (const count of [2, 5, 10, 15, 20, 50, 100]) {
  fx.emit({ x: 100 + count, y: 200 }, count);
  assert.equal(fx.trails.length, 0, 'Slash feedback is disabled at every combo level');
}
console.log('Combo slash trails disabled at all thresholds');

const noWaves = new TapEffects();
noWaves.emit({ x: 90, y: 120 }, 1);
const noCircleStrokeContext = {
  createRadialGradient() { return { addColorStop() {} }; },
  fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
  arc() { throw Error('Click feedback must not draw circular expansion rings'); }
};
noWaves.renderBurst(noCircleStrokeContext, { ...noWaves.bursts[0], particles: [] });
noWaves.renderContact(noCircleStrokeContext, { x: 90, y: 120, kind: 'empty', age: 0.1, duration: 0.26 });
console.log('Click feedback: circular expansion rings disabled');

for (const count of [1, 5, 20]) {
  noWaves.emit({ x: 90, y: 120 }, count);
  noWaves.renderBurst({
    createRadialGradient() { return { addColorStop() {} }; }, fillRect() {},
    beginPath() { throw Error('Correct hit must not draw a cross or radial flash lines without particles'); }
  }, { ...noWaves.bursts.at(-1), particles: [] });
}
console.log('Correct hit: cross flashes and radial speed lines removed');

const particleFree = new TapEffects();
for (const count of [1, 5, 10, 20, 100]) {
  particleFree.emit({ x: 100, y: 200 }, count);
  assert.equal(particleFree.bursts.at(-1).particles.length, 0);
}
for (const kind of ['ui', 'repeat', 'empty']) {
  particleFree.renderContact({
    createRadialGradient() { return { addColorStop() {} }; }, fillRect() {},
    arc() { throw Error('Contact feedback must not draw particle dots'); }
  }, { x: 100, y: 200, kind, age: 0.02, duration: 0.34 });
}
console.log('Clicks and combo milestones: particle creation and contact dots disabled');

const glowFree = new TapEffects();
glowFree.emit({ x: 50, y: 50 }, 1);
glowFree.renderBurst(new Proxy({}, { get() { throw Error('Correct hit must not draw any local glow'); }, set() { return true; } }), glowFree.bursts[0]);
glowFree.renderContact(new Proxy({}, { get() { throw Error('Button contact must not draw glow'); } }), { kind: 'ui', age: 0, duration: 0.34 });
const plainCell = new Polygon([{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 60 }, { x: 0, y: 60 }], 1);
plainCell.isClicked = true;
plainCell.playSuccess();
const fills = [], blurs = [];
const plainContext = new Proxy({ fillStyle: '', fill() { fills.push(this.fillStyle); } }, {
  get(target, key) { return key in target ? target[key] : () => {}; },
  set(target, key, value) { if (key === 'shadowBlur') blurs.push(value); target[key] = value; return true; }
});
plainCell.renderShape(plainContext);
assert.deepEqual(fills, ['#10B981'], 'Correct cell directly uses its completed green without mint flash');
assert.ok(blurs.every(value => value === 0), 'Correct cell has no success glow');
console.log('Correct hits and buttons: local glow and mint highlight disabled');
