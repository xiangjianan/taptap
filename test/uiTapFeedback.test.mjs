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
