import { getColorScheme } from './constants/colors.js';
import { prefersReducedMotion } from './visualTheme.js';

// Board-local juice: all motion is driven by game time, never by timers.
const MILESTONES = [5, 10, 15, 20, 50, 100];
const MAX_BURSTS = 10;

export default class TapEffects {
  constructor({ reducedMotion = prefersReducedMotion() } = {}) {
    this.reducedMotion = reducedMotion;
    this.reset();
  }

  reset() {
    this.bursts = [];
    this.trails = [];
    this.contacts = [];
    this.lastHit = null;
    this.hitGap = Infinity;
    this.shakeTime = 0;
    this.offset = { x: 0, y: 0 };
  }

  emit(center, count = 0, wrong = false) {
    const milestone = !wrong && MILESTONES.includes(count);
    const power = wrong ? 0.8 : 1.25 + Math.min(count, 20) / 40;
    const scheme = getColorScheme();
    const color = wrong ? scheme.danger : scheme.accent;
    const particles = [];
    this.lastHit = wrong ? null : { ...center };
    this.hitGap = wrong ? Infinity : 0;
    this.bursts.push({
      x: center.x, y: center.y, age: 0, duration: milestone ? 0.65 : 0.48,
      color, milestone, wrong, power, count, particles
    });
    // Bound the number of simultaneous local glow effects.
    if (this.bursts.length > MAX_BURSTS) this.bursts.shift();
  }

  emitContact(center, kind = 'empty', buttonId = null) {
    this.contacts.push({
      x: center.x, y: center.y, kind, buttonId, age: 0, duration: kind === 'ui' ? 0.34 : 0.26,
      color: kind === 'ui' ? getColorScheme().buttonPrimary : kind === 'repeat' ? getColorScheme().accent : getColorScheme().textSecondary
    });
    if (this.contacts.length > 8) this.contacts.shift();
  }

  getButtonScale(buttonId) {
    if (this.reducedMotion) return 1;
    let contact = null;
    for (let i = this.contacts.length - 1; i >= 0; i--) {
      const hit = this.contacts[i];
      if (hit.buttonId === buttonId && hit.kind === 'ui') { contact = hit; break; }
    }
    if (!contact) return null;
    return 1 - 0.07 * Math.exp(-contact.age * 14) * Math.cos(contact.age * 30);
  }

  update(dt = 1 / 60) {
    const step = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    this.hitGap += step;
    for (const burst of this.bursts) burst.age += step;
    for (const contact of this.contacts) contact.age += step;
    this.bursts = this.bursts.filter(burst => burst.age < burst.duration);
    this.contacts = this.contacts.filter(contact => contact.age < contact.duration);
    // Keep the board fixed at every combo level.
    this.shakeTime = 0;
    this.offset.x = 0;
    this.offset.y = 0;
  }

  render(ctx) {
    ctx.save();
    ctx.lineCap = 'round';
    for (const burst of this.bursts) this.renderBurst(ctx, burst);
    ctx.restore();
  }

  renderBurst(ctx, burst) {
    const t = burst.age / burst.duration;
    if (burst.wrong && t < 0.5) {
      ctx.globalAlpha = (1 - t * 2) * 0.8;
      ctx.strokeStyle = burst.color;
      ctx.lineWidth = 2.5;
      const reach = 5 + t * 8;
      ctx.beginPath();
      ctx.moveTo(burst.x - reach, burst.y - reach); ctx.lineTo(burst.x + reach, burst.y + reach);
      ctx.moveTo(burst.x + reach, burst.y - reach); ctx.lineTo(burst.x - reach, burst.y + reach);
      ctx.stroke();
    }
    ctx.strokeStyle = burst.color;
  }

  renderContact() {
    // Contact state is only used for button recoil; no glow overlay.
  }

  // A brief frame pulse leaves the number field readable.
  renderAccents(ctx, bounds) {
    let burst = null;
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      if (this.bursts[i].milestone && this.bursts[i].count !== 5) { burst = this.bursts[i]; break; }
    }
    if (!burst) return;
    ctx.save();
    const t = burst.age / burst.duration;
    ctx.strokeStyle = burst.color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = (1 - t) ** 2 * 0.9;
    ctx.strokeRect(bounds.x + 2, bounds.y + 2, bounds.width - 4, bounds.height - 4);
    ctx.restore();
  }
}
