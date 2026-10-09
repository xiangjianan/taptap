/** Run: node test/audioFeedback.test.mjs */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AudioGenerator } from '../js/audioGenerator.js';

// SoundManager uses extensionless imports for WeChat. Resolve that import in
// memory so this test can exercise the real manager without changing its runtime.
const url = new URL('../js/soundManager.js', import.meta.url);
const source = (await readFile(url, 'utf8')).replace("'./audioGenerator'", JSON.stringify(new URL('../js/audioGenerator.js', import.meta.url).href));
const { default: SoundManager } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const contexts = [];
globalThis.wx = {
  createInnerAudioContext() {
    const context = {
      plays: 0, stops: 0, disposed: false, playbackRate: 1,
      play() { this.plays++; }, stop() { this.stops++; },
      destroy() { this.disposed = true; },
      onError(callback) { this.error = callback; }, onCanplay() {}
    };
    contexts.push(context);
    return context;
  }
};
const manager = new SoundManager();
manager.init();
const allocated = contexts.length;
for (let i = 1; i <= 100; i++) manager.playClick(i);
assert.equal(contexts.length, allocated, 'Rapid taps must reuse wx audio contexts');
assert.equal(manager.sounds.click.plays, 100);
assert.equal(manager.sounds.impact, undefined, 'Original clicks have no added bass channel');
assert.equal(manager.sounds.click.src, 'audio/click.wav');
manager.playClick(1);
assert.equal(manager.sounds.click.playbackRate, 1.06, 'Original combo pitch curve is restored');
manager.setEnabled(false);
manager.playClick(101);
assert.equal(manager.sounds.click.plays, 101, 'Muted effects must stay silent');
manager.setVolume(0.4);
assert.equal(manager.sounds.click.volume, 0.4, 'Original volume behavior is restored');
manager.setEnabled(true);
manager.playClick(1);
assert.equal(manager.sounds.click.plays, 102);
const click = manager.sounds.click;
click.error();
assert.ok(click.disposed, 'Failed click channel must be released');
assert.equal(manager.sounds.click, null);
manager.destroy();
assert.ok(contexts.every(context => context.disposed));
delete globalThis.wx;

const nodes = [];
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
AudioGenerator.audioContext = {
  destination: {}, currentTime: 0,
  createOscillator() {
    const node = { frequency: param(), connect() {}, start() {}, stop() { this.stopped = true; } };
    nodes.push(node);
    return node;
  },
  createGain() { return { gain: param(), connect() {} }; }
};
globalThis.window = { AudioContext: function () {} };
AudioGenerator.generateClickSound(1);
assert.equal(nodes.length, 1, 'Original browser click has one tone');
AudioGenerator.generateClickSound(15);
assert.equal(nodes.length, 2, 'Milestone must not add a chime or bass');
assert.ok(nodes.every(node => node.stopped), 'All synthesized voices must stop');
delete globalThis.window;
delete AudioGenerator.audioContext;
console.log('Audio feedback: pooled channels, mute, volume, failure recovery and bounded synth voices passed');
