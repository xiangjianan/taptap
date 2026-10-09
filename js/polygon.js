import { COLORS, getColorScheme, BRUTALISM_STYLES } from './constants/colors.js';
import { prefersReducedMotion } from './visualTheme.js';

// 缓存颜色方案，避免每帧重复计算
let cachedScheme = null;
let cachedStateColors = null;

function getCachedScheme() {
  if (!cachedScheme) {
    cachedScheme = getColorScheme();
    cachedStateColors = {
      default: cachedScheme.cardBg,
      clicked: cachedScheme.buttonSuccess,
      highlighted: cachedScheme.accent,
      error: cachedScheme.danger,
      border: cachedScheme.borderSubtle,
      textClicked: cachedScheme.textLight,
      textDefault: cachedScheme.text
    };
  }
  return cachedScheme;
}

function getCachedStateColors() {
  if (!cachedStateColors) {
    getCachedScheme();
  }
  return cachedStateColors;
}

// 清除缓存（在主题切换时调用）
export function clearColorCache() {
  cachedScheme = null;
  cachedStateColors = null;
}

export default class Polygon {
  static get NUMBER_COLORS() {
    return getCachedScheme().numberColors;
  }
  
  static get STATE_COLORS() {
    return getCachedStateColors();
  }

  constructor(vertices, number, color) {
    this.reducedMotion = prefersReducedMotion();
    this.vertices = vertices;
    this.number = number;
    this.color = color;
    this.originalColor = color;
    this.isClicked = false;
    this.isHighlighted = false;
    this.isEagleEyeHighlighted = false;
    this.isError = false;
    this.errorAlpha = 0;
    this.scale = 1;
    this.targetScale = 1;
    this.shakeOffset = { x: 0, y: 0 };
    this.shakeTime = 0;
    this.successTime = 0;
    this.successPower = 1;
    this.isHinted = false;
    this.hintPulse = 0;
    this.hintGlowIntensity = 0;
    this.eagleEyePulse = 0;
    this.eagleEyeGlowIntensity = 0;
    
    // 缓存计算结果
    this._center = null;
    this._area = null;
  }

  getCenter() {
    if (this._center) return this._center;
    
    let x = 0, y = 0;
    for (const vertex of this.vertices) {
      x += vertex.x;
      y += vertex.y;
    }
    this._center = { x: x / this.vertices.length, y: y / this.vertices.length };
    return this._center;
  }

  getArea() {
    if (this._area !== null) return this._area;
    
    let area = 0;
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this.vertices[i].x * this.vertices[j].y;
      area -= this.vertices[j].x * this.vertices[i].y;
    }
    this._area = Math.abs(area / 2);
    return this._area;
  }

  containsPoint(point) {
    let inside = false;
    const n = this.vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.vertices[i].x, yi = this.vertices[i].y;
      const xj = this.vertices[j].x, yj = this.vertices[j].y;
      
      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  highlight() {
    this.isHighlighted = true;
    this.targetScale = 1.08;
  }

  resetHighlight() {
    this.isHighlighted = false;
    this.targetScale = 1;
  }

  setEagleEyeHighlight(enabled) {
    this.isEagleEyeHighlighted = enabled;
    if (enabled) {
      this.targetScale = 1.08;
      this.eagleEyePulse = 0;
      this.eagleEyeGlowIntensity = 0;
    } else {
      this.targetScale = 1;
      this.eagleEyePulse = 0;
      this.eagleEyeGlowIntensity = 0;
    }
  }

  playSuccess(comboCount = 1) {
    this.successTime = 0.36;
    this.successPower = 1 + Math.min(comboCount, 20) / 40;
    this.isError = false;
    this.errorAlpha = 0;
    this.shakeTime = 0;
    this.shakeOffset.x = 0;
    this.shakeOffset.y = 0;
  }

  getSuccessPulse() {
    if (this.reducedMotion || this.successTime <= 0) return 0;
    const t = 1 - this.successTime / 0.36;
    // Immediate compression, strong rebound, then a small settling bounce.
    return -Math.cos(t * Math.PI * 3) * (1 - t) ** 2 * this.successPower;
  }

  shake() {
    this.shakeTime = this.reducedMotion ? 0 : 10;
    this.isError = true;
    this.errorAlpha = 0.8;
  }

  setHintHighlight(enabled) {
    this.isHinted = enabled;
    if (enabled) {
      this.hintPulse = 0;
      this.hintGlowIntensity = 0;
    }
  }

  update(deltaTime = 1 / 60) {
    const dt = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    this.successTime = Math.max(0, this.successTime - dt);
    this.scale += (this.targetScale - this.scale) * (1 - Math.exp(-13.4 * dt));
    
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt * 60);
      this.shakeOffset.x = this.shakeTime > 0 ? Math.sin(this.shakeTime * 2.8) * 4 * (this.shakeTime / 10) : 0;
      this.shakeOffset.y = 0;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    if (this.isError) {
      this.errorAlpha -= dt * 3;
      if (this.errorAlpha <= 0) {
        this.errorAlpha = 0;
        this.isError = false;
      }
    }

    if (this.isHinted) {
      this.hintPulse += dt * 4.8;
      this.hintGlowIntensity = 0.5 + Math.sin(this.hintPulse) * 0.5;
    } else {
      this.hintPulse = 0;
      this.hintGlowIntensity = 0;
    }

    if (this.isEagleEyeHighlighted) {
      this.eagleEyePulse += dt * 4.8;
      this.eagleEyeGlowIntensity = 0.5 + Math.sin(this.eagleEyePulse) * 0.5;
    } else {
      this.eagleEyePulse = 0;
      this.eagleEyeGlowIntensity = 0;
    }
  }

  getTransform() {
    const center = this.getCenter();
    return {
      x: center.x + this.shakeOffset.x,
      y: center.y + this.shakeOffset.y,
      scale: this.scale
    };
  }

  renderShape(ctx, appearance = null) {
    const scheme = getCachedScheme();
    const stateColors = cachedStateColors;
    
    const center = this.getCenter();
    const transformX = center.x + this.shakeOffset.x;
    const transformY = center.y + this.shakeOffset.y;
    
    ctx.save();
    ctx.translate(transformX, transformY);
    const pulse = this.getSuccessPulse();
    const scale = this.reducedMotion ? 1 : this.scale;
    ctx.scale(scale * (1 + pulse * 0.13), scale * (1 - pulse * 0.09));
    ctx.translate(-center.x, -center.y);

    if (this.successTime > 0) {
      ctx.shadowColor = scheme.buttonSuccess;
      ctx.shadowBlur = 18 * this.successTime / 0.36;
    } else if (this.isHinted) {
      ctx.shadowColor = scheme.accent;
      ctx.shadowBlur = 25 * this.hintGlowIntensity;
    } else if (this.isEagleEyeHighlighted) {
      ctx.shadowColor = scheme.accent;
      ctx.shadowBlur = 25 * this.eagleEyeGlowIntensity;
    }

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();

    let fillColor;
    if (this.isClicked) {
      fillColor = appearance ? appearance.clicked : stateColors.clicked;
    } else if (this.isEagleEyeHighlighted) {
      fillColor = this.interpolateColor(scheme.accent, '#6EE7B7', this.eagleEyeGlowIntensity);
    } else if (this.isHinted) {
      const intensity = this.hintGlowIntensity;
      fillColor = this.interpolateColor(scheme.accent, '#6EE7B7', intensity);
    } else if (this.isHighlighted) {
      fillColor = stateColors.highlighted;
    } else {
      fillColor = appearance ? appearance.cell : scheme.cardBg;
    }
    
    ctx.fillStyle = fillColor;
    ctx.fill();

    if (this.successTime > 0.23) {
      ctx.fillStyle = `rgba(167, 243, 208, ${(this.successTime - 0.23) / 0.13 * 0.65})`;
      ctx.fill();
    }

    if (this.isError) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.errorAlpha})`;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'rgba(0, 0, 0, 0)';

    ctx.strokeStyle = appearance ? appearance.edge : scheme.borderSubtle;
    ctx.lineWidth = (this.isHinted || this.isEagleEyeHighlighted) ? 4 : 1.5;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.stroke();

    if (this.successTime > 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.successTime / 0.36})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.isHinted) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.5 + this.hintGlowIntensity * 0.5})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.isEagleEyeHighlighted) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.5 + this.eagleEyeGlowIntensity * 0.5})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  interpolateColor(color1, color2, factor) {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  renderText(ctx) {
    const scheme = getCachedScheme();
    const stateColors = cachedStateColors;
    
    const center = this.getCenter();
    const transformX = center.x + this.shakeOffset.x;
    const transformY = center.y + this.shakeOffset.y;
    
    // 保存变换，避免弹性缩放累积到后续数字
    ctx.save();
    ctx.translate(transformX, transformY);
    const pulse = this.getSuccessPulse();
    const scale = this.reducedMotion ? 1 : this.scale;
    ctx.scale(scale * (1 + pulse * 0.13), scale * (1 - pulse * 0.09));
    ctx.translate(-center.x, -center.y);

    const baseFontSize = Math.max(16, Math.min(28, Math.sqrt(this.getArea()) / 3.2));
    const digitCount = this.number.toString().length;
    const digitMultiplier = digitCount === 1 ? 1.0 : digitCount === 2 ? 0.8 : 0.65;
    const fontSize = baseFontSize * digitMultiplier;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = this.number.toString();
    
    if (!this.isClicked) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const shadowOffset = 1;
      ctx.fillText(text, center.x - shadowOffset, center.y - shadowOffset);
      ctx.fillText(text, center.x + shadowOffset, center.y - shadowOffset);
      ctx.fillText(text, center.x - shadowOffset, center.y + shadowOffset);
      ctx.fillText(text, center.x + shadowOffset, center.y + shadowOffset);
    }
    
    if (this.isClicked) {
      ctx.fillStyle = stateColors.textClicked;
    } else {
      const colorIndex = (this.number - 1) % scheme.numberColors.length;
      ctx.fillStyle = scheme.numberColors[colorIndex];
    }
    ctx.fillText(text, center.x, center.y);

    ctx.restore();
  }

  render(ctx) {
    this.renderShape(ctx);
    this.renderText(ctx);
  }
}
