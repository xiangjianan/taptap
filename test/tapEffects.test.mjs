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
assert.equal(fx.trails.length, 1, 'Successive correct hits should connect');
fx.emit(center, 0, true);
fx.emit(center, 1);
assert.equal(fx.trails.length, 1, 'Errors must break the connection to the previous hit');
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
assert.ok(polygon.getSuccessPulse() < 0, 'Hit should immediately compress');
polygon.update(0.12);
assert.ok(polygon.getSuccessPulse() > 0, 'Compression should rebound');
polygon.update(1);
assert.equal(polygon.getSuccessPulse(), 0, 'Long frames must not strand the impulse');
assert.ok(polygon.containsPoint({ x: 30, y: 30 }), 'Visual impulses must not mutate polygon geometry');
console.log('Tap effects: trails, thresholds, resource bounds, lifecycle, timing and polygon recovery passed');

const ordinary = new TapEffects();
ordinary.emit({ x: 15, y: 25 }, 1);
assert.ok(ordinary.bursts[0].particles.length >= 16, 'First hit should already have a full particle burst');
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
assert.ok(fifthHit.bursts[0].particles.length > 0, 'Fifth combo keeps local particles');
fifthHit.renderAccents(new Proxy({}, { get() { throw new Error('Fifth combo must not draw a board frame'); } }), { x: 0, y: 0, width: 375, height: 812 });
console.log('Fifth combo: local feedback remains, board-frame pulse disabled');
