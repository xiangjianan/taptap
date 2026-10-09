/** Run: node test/uiTapFeedback.test.mjs */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Bypass render.js canvas setup while keeping the real UI input handlers.
let source = await readFile(new URL('../js/ui.js', import.meta.url), 'utf8');
source = source.replace("'./constants/colors'", JSON.stringify(new URL('../js/constants/colors.js', import.meta.url).href));
source = source.replace("import { SAFE_AREA } from './render';", 'const SAFE_AREA = { top: 0, bottom: 0 };');
source = source.replace("'./tapEffects.js'", JSON.stringify(new URL('../js/tapEffects.js', import.meta.url).href));
source = source.replace("'./visualTheme.js'", JSON.stringify(new URL('../js/visualTheme.js', import.meta.url).href));
const { default: UI } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const ui = new UI(375, 812);
const callbacks = [];
const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = callback => { callbacks.push(callback); return callbacks.length; };
try {
  let sounds = 0;
  let actions = 0;
  ui.onPlayClickSound = () => sounds++;
  ui.buttons = [{ id: 'start', x: 20, y: 150, width: 200, height: 50, action: () => actions++ }];
  assert.equal(ui.handleClick(40, 170), true);
  assert.equal(ui.tapFeedback.contacts.length, 1);
  assert.deepEqual([ui.tapFeedback.contacts[0].x, ui.tapFeedback.contacts[0].y], [40, 170]);
  assert.equal(sounds, 1);
  assert.equal(actions, 0, 'Button feedback must preserve deferred action timing');
  assert.equal(ui.handleClick(300, 300), true, 'Pending button must consume taps before board routing');
  assert.equal(ui.tapFeedback.contacts.length, 1);
  callbacks.shift()();
  assert.equal(actions, 1);
  assert.equal(ui.handleClick(300, 300), false);
  assert.equal(ui.tapFeedback.contacts.length, 1, 'Blank UI space must not fire button effects');

  ui.showModal = true;
  ui.modalButtons = [{ id: 'confirm', x: 100, y: 200, width: 100, height: 40, action: () => actions++ }];
  ui.handleClick(120, 220);
  assert.equal(ui.tapFeedback.contacts.at(-1).buttonId, 'confirm');
  assert.equal(sounds, 2, 'Modal click should have one sound');
  callbacks.shift()();
  assert.equal(actions, 2);
  ui.showModal = false;

  // Visual feedback also works without an installed audio callback.
  ui.onPlayClickSound = null;
  ui.handleClick(40, 170);
  assert.equal(ui.tapFeedback.contacts.length, 3);
  callbacks.shift()();
  assert.equal(ui.feedbackPoint, null, 'Input coordinates must not leak into later actions');
  console.log('UI taps: buttons, dialogs, input consumption, deferred actions and silent visual feedback passed');
} finally {
  globalThis.setTimeout = realSetTimeout;
}

for (const [width, height] of [[375, 812], [768, 1024], [1024, 768]]) {
  const sample = new UI(width, height);
  const buttons = sample._buildMenuButtons();
  for (const button of buttons) {
    assert.ok(button.x >= 0 && button.x + button.width <= width);
    assert.ok(button.y >= sample.safeArea.top && button.y + button.height <= height - 20, `Menu button ${button.id} must fit ${width}×${height}`);
  }
  sample.reducedMotion = true;
  sample.comboData.count = 20;
  const phase = sample.bgPhase;
  sample.updateDynamicBackground(1);
  assert.equal(sample.bgPhase, phase);
  assert.equal(sample.bgParticles.length, 0);
}
console.log('Candy layout: phone, tablet, desktop and reduced-motion background passed');

const restart = new UI(375, 812);
restart.isPaused = true;
restart.initGame();
assert.equal(restart.isPaused, false, 'Restarted UI must not retain its paused overlay');
assert.equal(restart.getScheme().id, 'pop-candy');
console.log('Candy UI: original theme and pause recovery passed');

const notices = new UI(375, 812);
notices.showAchievementNotification([{ name: '火热' }, { name: '燃烧' }]);
notices.updateAchievementNotifications(0.2);
assert.ok(notices.achievementNotifications[0].animation > 0);
assert.equal(notices.achievementNotifications[1].age, 0);
notices.gameState = 'playing';
notices.updateAchievementNotifications(1);
assert.equal(notices.achievementNotifications[0].age, 0.2, 'Gameplay must defer notices that would cover numbers');
notices.gameState = 'menu';
notices.showSkills = true;
notices.updateAchievementNotifications(1);
assert.equal(notices.achievementNotifications[0].age, 0.2);
console.log('Achievement feedback: queued and deferred during gameplay and panels');

// Exercise the real unlock result handler without loading canvas setup.
const mainSource = await readFile(new URL('../js/findGameMain.js', import.meta.url), 'utf8');
const unlockBody = mainSource.slice(mainSource.indexOf('  handleSkillUnlock(skillId) {') + '  handleSkillUnlock(skillId) {'.length, mainSource.indexOf('  getBestTime(')).replace(/\}\s*$/, '');
const unlock = new Function('skillId', unlockBody);
for (const success of [true, false]) {
  const skillUI = new UI(375, 812);
  skillUI.showSkills = true;
  skillUI.coins = 1000;
  skillUI.shopProducts = [];
  skillUI.skillsData = new Map([['test', [{ id: 'focus', name: '专注', canUnlock: true, isUnlocked: false }]]]);
  let clicks = 0, errors = 0, unlocks = 0;
  const owner = {
    ui: skillUI,
    skillManager: { getSkill: () => ({ name: '专注' }), unlockSkill() { unlocks++; return success; }, getSkillProgress: () => skillUI.skillsData },
    soundManager: { playUiClick() { clicks++; }, playError() { errors++; } }
  };
  skillUI.onPlayClickSound = () => clicks++;
  skillUI.onSkillUnlock = id => unlock.call(owner, id);
  const deferred = [];
  globalThis.setTimeout = callback => { deferred.push(callback); return 1; };
  try {
    assert.equal(skillUI.handleClick(310, 245), true);
    assert.equal(clicks + errors, 0, 'Unlock tap gives immediate visuals without premature audio');
    assert.equal(skillUI.tapFeedback.contacts.length, 1);
    skillUI.handleClick(310, 245);
    assert.equal(deferred.length, 1, 'Repeated pending tap cannot purchase twice');
    deferred[0]();
    assert.equal(unlocks, 1);
    assert.equal(clicks, success ? 1 : 0);
    assert.equal(errors, success ? 0 : 1);
  } finally { globalThis.setTimeout = realSetTimeout; }
}
console.log('Skill unlock: exactly one result sound for success/failure, pending taps consumed');

const backgroundBody = mainSource.slice(mainSource.indexOf('  renderGameBackground(ctx) {') + '  renderGameBackground(ctx) {'.length, mainSource.indexOf('  renderEmotionalTimerEffects(')).replace(/\}\s*$/, '');
const drawBackground = new Function('SCREEN_WIDTH', 'SCREEN_HEIGHT', `return function(ctx) {${backgroundBody}}`)(375, 812);
for (const intensity of [0, 0.65, 1, 1.5, 2]) {
  let linearLayers = 0;
  drawBackground.call({ ui: { getBackgroundState: () => ({ comboIntensity: intensity, phase: 1.2, particles: [] }) } }, {
    createLinearGradient() { linearLayers++; return { addColorStop() {} }; },
    createRadialGradient() { throw Error('Combo background must not create a central radial halo'); },
    fillRect() {}
  });
  assert.equal(linearLayers, 1, 'Warm flowing background remains without a central halo');
}
console.log('Combo background: all intensities retain flowing colors without a central radial halo');

const timerBody = mainSource.slice(mainSource.indexOf('  renderEmotionalTimerEffects(ctx, deltaTime) {') + '  renderEmotionalTimerEffects(ctx, deltaTime) {'.length, mainSource.indexOf('  renderGameAreaBorder(ctx) {')).replace(/\}\s*$/, '');
const drawTimer = new Function('SCREEN_WIDTH', 'SCREEN_HEIGHT', `return function(ctx, deltaTime) {${timerBody}}`)(375, 812);
for (const time of [10, 14, 19, 60]) {
  drawTimer.call({ gameManager: { gameState: 'playing', gameMode: 'timed', timeLeft: time }, vignetteIntensity: 0 }, {
    createRadialGradient() { throw Error('Safe remaining time must not draw a central halo'); },
    fillRect() { throw Error('Safe remaining time must not draw an overlay'); }
  }, 1 / 60);
}
let dangerLayers = 0;
drawTimer.call({ gameManager: { gameState: 'playing', gameMode: 'timed', timeLeft: 2 }, vignetteIntensity: 0 }, {
  createRadialGradient() { dangerLayers++; return { addColorStop() {} }; }, fillRect() {}
}, 1 / 60);
assert.equal(dangerLayers, 1, 'Low-time danger vignette remains available');
console.log('Timer effects: safe-time center halo removed, low-time danger feedback preserved');

const noComboParticles = new UI(375, 812);
noComboParticles.createComboParticles({ color: '#10B981' }, 20, { x: 100, y: 100 });
assert.equal(noComboParticles.comboParticles.length, 0, 'UI combo callbacks must not spawn click particles');

const listenersBody = mainSource.slice(mainSource.indexOf('  setupEventListeners() {') + '  setupEventListeners() {'.length, mainSource.indexOf('  setupUICallbacks() {')).replace(/\}\s*$/, '');
const installListeners = new Function('canvas', `return function() {${listenersBody}}`);
for (const runtime of ['wx', 'browser']) {
  const home = new UI(375, 812);
  home.gameState = 'menu';
  const deferred = [];
  let actions = 0;
  home.buttons = [{ id: 'start', x: 20, y: 150, width: 200, height: 50, action: () => actions++ }];
  const owner = { ui: home, handleInput: (x, y) => home.handleClick(x, y) };
  const handlers = {}, windowHandlers = {};
  const fakeCanvas = { addEventListener(name, callback) { handlers[name] = callback; }, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  const savedWx = globalThis.wx, savedWindow = globalThis.window;
  globalThis.setTimeout = callback => { deferred.push(callback); return 1; };
  if (runtime === 'wx') {
    globalThis.wx = {
      onTouchStart(callback) { handlers.touchstart = callback; }, onTouchMove(callback) { handlers.touchmove = callback; },
      onTouchEnd(callback) { handlers.touchend = callback; }, onTouchCancel(callback) { handlers.touchcancel = callback; }
    };
  } else {
    delete globalThis.wx;
    globalThis.window = { addEventListener(name, callback) { windowHandlers[name] = callback; } };
  }
  const touch = (x, y) => ({ touches: [{ clientX: x, clientY: y }], changedTouches: [{ clientX: x, clientY: y }], preventDefault() {}, stopPropagation() {} });
  try {
    installListeners(fakeCanvas).call(owner);
    handlers.touchstart(touch(40, 170));
    assert.equal(actions, 0);
    assert.equal(deferred.length, 0, `${runtime}: holding a home button must not queue its action`);
    handlers.touchend(touch(40, 170));
    assert.equal(deferred.length, 1);
    deferred.shift()();
    assert.equal(actions, 1);
    handlers.touchstart(touch(40, 170));
    handlers.touchmove(touch(300, 300));
    handlers.touchend(touch(300, 300));
    assert.equal(deferred.length, 0, `${runtime}: release outside must cancel`);
    handlers.touchstart(touch(40, 170));
    handlers.touchcancel(touch(40, 170));
    handlers.touchend(touch(40, 170));
    assert.equal(deferred.length, 0, `${runtime}: canceled touches must not activate`);
    if (runtime === 'browser') {
      handlers.mousedown({ type: 'mousedown', button: 0, clientX: 40, clientY: 170 });
      assert.equal(deferred.length, 0);
      windowHandlers.mouseup({ type: 'mouseup', button: 0, clientX: 40, clientY: 170 });
      assert.equal(deferred.length, 1);
      deferred.shift()();
      handlers.click({ type: 'click', clientX: 40, clientY: 170 });
      assert.equal(deferred.length, 0, 'Mouse release followed by click must not activate twice');
      assert.equal(actions, 2);
    }
  } finally {
    globalThis.setTimeout = realSetTimeout;
    if (savedWx === undefined) delete globalThis.wx; else globalThis.wx = savedWx;
    if (savedWindow === undefined) delete globalThis.window; else globalThis.window = savedWindow;
  }
}
console.log('Home input: wx/browser hold, release, outside cancellation, touchcancel and mouse deduplication passed');

const oldFloat = new UI(375, 812);
oldFloat.showFloatingText(100, 200, '正确', '#3B82F6', 'tap');
oldFloat.updateEffects(0.1);
const textDraws = [];
oldFloat.renderEffects({
  save() {}, restore() {},
  fillText(text, x, y) { textDraws.push({ text, x, y, font: this.font, alpha: this.globalAlpha }); },
  scale() { throw Error('Floating text must not elastically scale'); },
  strokeText() { throw Error('Original floating text has no outline'); }
});
assert.equal(textDraws[0].font, 'bold 32px "Arial Black", Arial, sans-serif');
assert.equal(textDraws[0].x, 100);
assert.ok(textDraws[0].y < 200 && textDraws[0].alpha < 1, 'Original text floats up and fades');
console.log('Floating text: original font, upward motion and fade restored without elastic scale or outline');
