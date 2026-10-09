import { getColorScheme } from './constants/colors.js';
import { prefersReducedMotion } from './visualTheme.js';

// Board-local juice: all motion is driven by game time, never by timers.
const MILESTONES = [5, 10, 15, 20, 50, 100];
const MAX_BURSTS = 10;
const MAX_TRAILS = 6;

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
    const amount = this.reducedMotion ? 0 : wrong ? 10 : milestone ? 26 : 16 + Math.min(4, Math.floor(count / 2));
    const particles = Array.from({ length: amount }, (_, i) => {
      const angle = i / amount * Math.PI * 2 + Math.random() * 0.22;
      const speed = (milestone ? 135 : 85) * power + Math.random() * 65;
      return {
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5, angle, spin: (Math.random() - 0.5) * 12,
        kind: i % 3
      };
    });
    if (!this.reducedMotion && !wrong && count > 1 && this.lastHit && this.hitGap < 2) {
      this.trails.push({ from: this.lastHit, to: { ...center }, color, age: 0, duration: 0.3 });
      if (this.trails.length > MAX_TRAILS) this.trails.shift();
    }
    this.lastHit = wrong ? null : { ...center };
    this.hitGap = wrong ? Infinity : 0;
    this.bursts.push({
      x: center.x, y: center.y, age: 0, duration: milestone ? 0.65 : 0.48,
      color, milestone, wrong, power, count, particles
    });
    // At most 260 particles, with no per-particle timers or shadow blurs.
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
    for (const trail of this.trails) trail.age += step;
    for (const contact of this.contacts) contact.age += step;
    this.bursts = this.bursts.filter(burst => burst.age < burst.duration);
    this.trails = this.trails.filter(trail => trail.age < trail.duration);
    this.contacts = this.contacts.filter(contact => contact.age < contact.duration);
    // Keep the board fixed at every combo level.
    this.shakeTime = 0;
    this.offset.x = 0;
    this.offset.y = 0;
  }

  render(ctx) {
    ctx.save();
    ctx.lineCap = 'round';
    for (const trail of this.trails) {
      const t = trail.age / trail.duration;
      // A fast travelling streak; it never lingers over the next target.
      const head = Math.min(1, t * 3);
      const tail = Math.max(0, head - (1 - t) * 0.65);
      const dx = trail.to.x - trail.from.x;
      const dy = trail.to.y - trail.from.y;
      ctx.strokeStyle = trail.color;
      ctx.globalAlpha = (1 - t) * 0.32;
      ctx.lineWidth = 7 * (1 - t);
      ctx.beginPath();
      ctx.moveTo(trail.from.x + dx * tail, trail.from.y + dy * tail);
      ctx.lineTo(trail.from.x + dx * head, trail.from.y + dy * head);
      ctx.stroke();
      ctx.strokeStyle = getColorScheme().secondary;
      ctx.lineWidth = 2 * (1 - t);
      ctx.stroke();
    }
    for (const burst of this.bursts) this.renderBurst(ctx, burst);
    for (const contact of this.contacts) this.renderContact(ctx, contact);
    ctx.restore();
  }

  renderBurst(ctx, burst) {
    const t = burst.age / burst.duration;
    const fade = (1 - t) ** 2;
    const radius = this.reducedMotion ? 12 : (burst.milestone ? 68 : 44) * burst.power;
    // Soft bloom, made with a local gradient rather than expensive particle shadows.
    if (t < (burst.wrong ? 0.35 : 0.55)) {
      const glowRadius = 14 + radius * Math.min(1, t * 3);
      const glow = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, glowRadius);
      glow.addColorStop(0, '#FFFFFF');
      glow.addColorStop(0.25, burst.color);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = fade * 0.5;
      ctx.fillStyle = glow;
      ctx.fillRect(burst.x - glowRadius, burst.y - glowRadius, glowRadius * 2, glowRadius * 2);
    }
    // Every correct hit has a fast outer wave and a delayed inner echo.
    ctx.strokeStyle = burst.color;
    for (let i = 0; i < (burst.wrong ? 1 : 2); i++) {
      const wave = (t - i * 0.13) / (1 - i * 0.13);
      if (wave < 0) continue;
      ctx.globalAlpha = (1 - wave) ** 2 * 0.9;
      ctx.lineWidth = (burst.milestone ? 4 : 3) * (1 - wave) + 0.5;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, 5 + radius * (this.reducedMotion ? 1 : 1 - (1 - wave) ** 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    // A tiny white cross glints at the fingertip on every correct hit.
    if (!this.reducedMotion && !burst.wrong && t < 0.3) {
      ctx.globalAlpha = 1 - t / 0.3;
      ctx.strokeStyle = getColorScheme().secondary;
      ctx.lineWidth = 2.5;
      const reach = 5 + 10 * Math.sin(t / 0.3 * Math.PI);
      ctx.beginPath();
      ctx.moveTo(burst.x - reach, burst.y); ctx.lineTo(burst.x + reach, burst.y);
      ctx.moveTo(burst.x, burst.y - reach); ctx.lineTo(burst.x, burst.y + reach);
      ctx.stroke();
    } else if (burst.wrong && t < 0.5) {
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
    // Radial speed lines are a brief punch, then give way to flying fragments.
    if (!this.reducedMotion && !burst.wrong && t < 0.4) {
      ctx.globalAlpha = (1 - t / 0.4) * 0.85;
      ctx.lineWidth = burst.milestone ? 3 : 2;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const inner = 8 + t * radius;
        const outer = inner + 8 + burst.power * 7;
        ctx.beginPath();
        ctx.moveTo(burst.x + Math.cos(angle) * inner, burst.y + Math.sin(angle) * inner);
        ctx.lineTo(burst.x + Math.cos(angle) * outer, burst.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    }
    for (const p of burst.particles) {
      const travel = (1 - Math.exp(-4 * burst.age)) / 4;
      const x = burst.x + p.vx * travel;
      const y = burst.y + p.vy * travel + 100 * burst.age ** 2;
      const size = p.size * (1 - t * 0.6);
      ctx.globalAlpha = fade * 0.95;
      ctx.fillStyle = p.kind === 0 && !burst.wrong ? getColorScheme().secondary : burst.color;
      if (p.kind === 0) {
        // Rotating diamond fragments.
        const angle = p.angle + p.spin * burst.age;
        const dx = Math.cos(angle) * size;
        const dy = Math.sin(angle) * size;
        ctx.beginPath();
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x - dy * 0.5, y + dx * 0.5);
        ctx.lineTo(x - dx, y - dy);
        ctx.lineTo(x + dy * 0.5, y - dx * 0.5);
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === 1) {
        ctx.strokeStyle = burst.color;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - p.vx * 0.035 * (1 - t), y - p.vy * 0.035 * (1 - t));
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderContact(ctx, contact) {
    const t = contact.age / contact.duration;
    const ui = contact.kind === 'ui';
    const radius = this.reducedMotion ? 12 : 3 + (ui ? 29 : 17) * (1 - (1 - t) ** 3);
    ctx.globalAlpha = (1 - t) ** 2 * (ui ? 0.7 : 0.4);
    ctx.strokeStyle = contact.color;
    ctx.lineWidth = 2 * (1 - t) + 0.5;
    ctx.beginPath();
    ctx.arc(contact.x, contact.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (!this.reducedMotion && (ui || contact.kind === 'repeat')) {
      ctx.fillStyle = contact.color;
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const distance = 7 + t * (ui ? 34 : 22);
        ctx.beginPath();
        ctx.arc(contact.x + Math.cos(angle) * distance, contact.y + Math.sin(angle) * distance, 1.8 * (1 - t) + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ui && t < 0.45) {
        const glow = ctx.createRadialGradient(contact.x, contact.y, 0, contact.x, contact.y, radius);
        glow.addColorStop(0, '#FFFFFF');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(contact.x - radius, contact.y - radius, radius * 2, radius * 2);
      }
    }
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
