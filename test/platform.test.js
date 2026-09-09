/**
 * platform.js 适配层测试
 * Run: node test/platform.test.js
 */
import { strict as assert } from 'node:assert';
import { detectPlatform, createPlatform } from '../js/platform.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n    ${e.message}`);
  }
}

// ── mock 工厂：模拟 tt/wx API ──
function mockTTApi(overrides = {}) {
  const calls = { set: [], get: [], vibrate: [], share: [] };
  const api = {
    getSystemInfoSync: () => ({
      screenWidth: 375, screenHeight: 812, pixelRatio: 2,
      safeArea: { top: 44, bottom: 778, left: 0, right: 375 }
    }),
    setStorageSync: (k, v) => { calls.set.push([k, v]); },
    getStorageSync: (k) => { calls.get.push(k); return 'saved'; },
    removeStorageSync: (k) => { calls.remove = calls.remove || []; calls.remove.push(k); },
    createInnerAudioContext: () => ({ src: '', volume: 1 }),
    vibrateShort: (o) => { calls.vibrate.push(['short', o.type]); },
    vibrateLong: () => { calls.vibrate.push(['long']); },
    onTouchStart: () => {}, onTouchMove: () => {}, onTouchEnd: () => {},
    onShow: () => {}, onHide: () => {},
    onShareAppMessage: (cb) => { calls.share.push(['on', cb]); },
    shareAppMessage: (o) => { calls.share.push(['send', o]); },
    ...overrides
  };
  return { calls, api };
}

console.log('detectPlatform 平台检测');
test('tt 与 wx 同时存在（抖音注入 wx 场景）→ douyin', () => {
  const { api } = mockTTApi();
  const wxApi = { getSystemInfoSync: () => ({}) };
  assert.equal(detectPlatform({ tt: api, wx: wxApi }), 'douyin');
});
test('仅 wx → wechat', () => {
  assert.equal(detectPlatform({ wx: { getSystemInfoSync: () => ({}) } }), 'wechat');
});
test('两者皆无 → browser', () => {
  assert.equal(detectPlatform({}), 'browser');
});
test('wx 存在但缺 getSystemInfoSync（不完整注入）→ browser', () => {
  assert.equal(detectPlatform({ wx: {} }), 'browser');
});

console.log('createPlatform API 分发');
test('抖音：setStorageSync 分发到 tt', () => {
  const { api, calls } = mockTTApi();
  createPlatform({ tt: api }).setStorageSync('coins', 100);
  assert.deepEqual(calls.set, [['coins', 100]]);
});
test('微信：优先 getWindowInfo 并归一化 safeArea', () => {
  let winCalls = 0, sysCalls = 0;
  const p = createPlatform({ wx: {
    getWindowInfo: () => { winCalls++; return { screenWidth: 375, screenHeight: 812, pixelRatio: 3, safeArea: { top: 44, bottom: 778, left: 0, right: 375 } }; },
    getSystemInfoSync: () => { sysCalls++; return { screenWidth: 1, screenHeight: 1, pixelRatio: 1 }; }
  } });
  const info = p.getWindowInfo();
  assert.equal(winCalls, 1);
  assert.equal(sysCalls, 0);
  assert.equal(info.screenWidth, 375);
  assert.equal(info.pixelRatio, 3);
  assert.deepEqual(info.safeArea, { top: 44, bottom: 34, left: 0, right: 0 });
});
test('抖音：无 getWindowInfo 时走 getSystemInfoSync', () => {
  const { api } = mockTTApi();
  const info = createPlatform({ tt: api }).getWindowInfo();
  assert.equal(info.screenWidth, 375);
  assert.equal(info.safeArea.bottom, 812 - 778);
});
test('抖音：vibrateShort/vibrateLong 透传', () => {
  const { api, calls } = mockTTApi();
  const p = createPlatform({ tt: api });
  p.vibrateShort('medium');
  p.vibrateLong();
  assert.deepEqual(calls.vibrate, [['short', 'medium'], ['long']]);
});
test('浏览器：storage no-op 且不抛错', () => {
  const p = createPlatform({ window: {}, document: {} });
  p.setStorageSync('k', 1);
  assert.equal(p.getStorageSync('k'), '');
  p.removeStorageSync('k');
});
test('浏览器：createInnerAudioContext 返回 null', () => {
  assert.equal(createPlatform({ window: {}, document: {} }).createInnerAudioContext(), null);
});
test('抖音：createInnerAudioContext 返回实例', () => {
  const { api } = mockTTApi();
  const ctx = createPlatform({ tt: api }).createInnerAudioContext();
  assert.ok(ctx && typeof ctx.src === 'string');
});
test('浏览器：createCanvas 走 DOM 并带 id', () => {
  const made = { style: {} };
  const env = {
    document: { createElement: () => made, body: { appendChild: () => {} } },
    window: { innerWidth: 800, innerHeight: 600, devicePixelRatio: 2 }
  };
  const p = createPlatform(env);
  assert.equal(p.createCanvas(), made);
  assert.equal(made.id, 'gameCanvas');
  assert.equal(p.getWindowInfo().screenWidth, 800);
  assert.equal(p.getWindowInfo().pixelRatio, 2);
});
test('微信：createCanvas 挂到 GameGlobal', () => {
  const canvasObj = {};
  const env = { wx: { getSystemInfoSync: () => ({}), createCanvas: () => canvasObj }, GameGlobal: {} };
  const p = createPlatform(env);
  assert.equal(p.createCanvas(), canvasObj);
  assert.equal(env.GameGlobal.canvas, canvasObj);
});
test('分享：onShareTimeline 仅微信生效，抖音不抛错', () => {
  const { api } = mockTTApi(); // tt mock 无 onShareTimeline
  createPlatform({ tt: api }).onShareTimeline(() => ({}));
  let wxCalls = 0;
  createPlatform({ wx: { getSystemInfoSync: () => ({}), onShareTimeline: () => { wxCalls++; } } })
    .onShareTimeline(() => ({}));
  assert.equal(wxCalls, 1);
});
test('分享：showShareMenu 仅微信调用', () => {
  const { api } = mockTTApi(); // tt mock 无 showShareMenu
  createPlatform({ tt: api }).showShareMenu();
  let called = false;
  createPlatform({ wx: { getSystemInfoSync: () => ({}), showShareMenu: () => { called = true; } } })
    .showShareMenu();
  assert.equal(called, true);
});
test('触摸与生命周期透传到 tt', () => {
  const registered = [];
  const { api } = mockTTApi({
    onTouchStart: () => { registered.push('start'); },
    onShow: () => { registered.push('show'); }
  });
  const p = createPlatform({ tt: api });
  p.onTouchStart(() => {});
  p.onShow(() => {});
  assert.deepEqual(registered, ['start', 'show']);
});
test('抖音钩子：checkScene 透传，浏览器 no-op', () => {
  const scenes = [];
  const { api } = mockTTApi({ checkScene: (o) => { scenes.push(o); } });
  createPlatform({ tt: api }).checkScene({ scene: 'sidebar' });
  createPlatform({ window: {}, document: {} }).checkScene({ scene: 'sidebar' });
  assert.equal(scenes.length, 1);
});
test('supportsVibration：抖音真 / 纯 wx 空壳假 / 浏览器 navigator 真', () => {
  assert.equal(createPlatform({ tt: mockTTApi().api }).supportsVibration(), true);
  assert.equal(createPlatform({ wx: { getSystemInfoSync: () => ({}) } }).supportsVibration(), false);
  assert.equal(
    createPlatform({ window: {}, document: {}, navigator: { vibrate: () => true } }).supportsVibration(),
    true
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
