import Polygon from './polygon.js';
import { COLORS } from './constants/colors.js';

// 自适应尺寸区间（用户 2026-09-27 决定：两关统一 4:1 直径强对比，
//   第 2 关不再使用柔和的 2.4:1）：
//   10 格与 100 格 → 半径区间均为 [0.52, 2.05]（直径比约 4:1）
//   线性插值机制保留（两端相同即恒定），便于日后重新分层调参
const SIZE_RANGE_AT_10 = { rMin: 0.52, rMax: 2.05 };
const SIZE_RANGE_AT_100 = { rMin: 0.52, rMax: 2.05 };
const COVERAGE = 1.08;         // Σπr² 相对游戏区面积的比例。30 种子 × 100 格实测：调高覆盖系数会让布点更挤、小格更易被压扁，反而增加整盘软化；1.08 软化最少（用户 2026-09-27 要求两关均保持 4:1 直径比）
const SPACING_BETA = 0.78;     // 掷点间距系数：4:1 权重比下若两种子间距² < (w大−w小)，小种子的幂胞会被大邻居整个吞掉；β=0.78 保证最极端配对的间距 ≥ √(w大−w小)，防止格子凭空消失
const PLACEMENT_TRIES = 45;    // 每个种子的掷点尝试次数
const LLOYD_ITERATIONS = 4;    // 松弛轮数（越多格子越"饱满"）
const DEGENERATE_AREA = 4;     // 低于此面积视为被挤没，增重重算
const MIN_CELL_AREA = 280;     // 最小格子面积：旧生成器第 2 关 ~300px² 小格常见、280px² 仍可点选；4:1×100 时理想最小格约 340px²
const MIN_CELL_WIDTH = 15;     // 最小格子包围盒短边：旧生成器 100 格时 dynamicMinWidth ≈ 14px，15px 留少量裕量
const SOFTEN_MAX_ATTEMPTS = 5; // 最小尺寸不达标时的软化重试次数
const SOFTEN_FACTOR = 0.8;     // 每次重试区间向中点收缩的比例
const EPS = 1e-9;

// 种子随机数（可复现：同 seed 同布局）
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default class BubbleGenerator {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.safeArea = options.safeArea || { top: 0, bottom: 0, left: 0, right: 0 };
    this.colors = COLORS.POLYGON_COLORS;
  }

  generatePolygons(count, difficulty = 'normal', seed) { // difficulty 签名与旧生成器对齐，暂不使用
    const bounds = this.computeBounds();
    const rng = mulberry32(seed === undefined ? (Math.random() * 0xFFFFFFFF) >>> 0 : seed >>> 0);

    // 密度上限：格子数不能超过游戏区按最小格子面积能容纳的数量
    //（更小的格子放不下数字也点不中；调用方以返回的数组长度为准）
    const maxCount = Math.floor((bounds.width * bounds.height) / MIN_CELL_AREA);
    const cellCount = Math.min(count, maxCount);

    let cells = null;
    let valid = false;
    for (let attempt = 0; attempt < SOFTEN_MAX_ATTEMPTS; attempt++) {
      const range = this.sizeRangeFor(cellCount, Math.pow(SOFTEN_FACTOR, attempt));
      cells = this.tessellate(bounds, cellCount, range.rMin, range.rMax, rng);
      if ((valid = this.isValid(cells, cellCount))) break;
    }

    // 兜底：仍有格子被挤没 → 近均匀区间重算，保证返回数量恒等于 cellCount
    if (!valid) {
      cells = this.tessellate(bounds, cellCount, 0.85, 1.15, rng);
    }

    return this.buildPolygons(cells, rng);
  }

  // 游戏区边界（布局约定与全项目一致：isMobile 时 header = max(100, safeArea.top+56)、
  // footer = max(80, safeArea.bottom+46)，四周 padding 12；桌面端 header 130 / footer 60）
  computeBounds() {
    const isMobile = this.width < 768;
    const topSafeArea = Math.max(this.safeArea.top, isMobile ? 44 : 0);
    const bottomSafeArea = Math.max(this.safeArea.bottom, isMobile ? 34 : 0);
    const headerHeight = isMobile ? Math.max(100, topSafeArea + 56) : 130;
    const footerHeight = isMobile ? Math.max(80, bottomSafeArea + 46) : 60;

    const borderPadding = 12;
    return {
      x: borderPadding,
      y: headerHeight + borderPadding,
      width: this.width - borderPadding * 2,
      height: this.height - headerHeight - footerHeight - borderPadding * 2
    };
  }

  sizeRangeFor(count, soften) {
    const t = Math.min(1, Math.max(0, (count - 10) / 90));
    const rMin = SIZE_RANGE_AT_10.rMin + (SIZE_RANGE_AT_100.rMin - SIZE_RANGE_AT_10.rMin) * t;
    const rMax = SIZE_RANGE_AT_10.rMax + (SIZE_RANGE_AT_100.rMax - SIZE_RANGE_AT_10.rMax) * t;
    const mid = (rMin + rMax) / 2;
    return {
      rMin: mid + (rMin - mid) * soften,
      rMax: mid + (rMax - mid) * soften
    };
  }

  tessellate(bounds, count, rMin, rMax, rng) {
    const seeds = this.placeSeeds(bounds, count, rMin, rMax, rng);
    let cells = this.computeCells(seeds, bounds);

    // Lloyd 松弛：种子移到格子面积质心（保留权重）→ 格子变饱满
    for (let iter = 0; iter < LLOYD_ITERATIONS; iter++) {
      for (let i = 0; i < seeds.length; i++) {
        const c = this.polygonCentroid(cells[i]);
        if (c.area > DEGENERATE_AREA) {
          seeds[i].x = c.x;
          seeds[i].y = c.y;
        } else {
          seeds[i].r *= 1.12; // 被挤没：增重重算
        }
      }
      cells = this.computeCells(seeds, bounds);
    }
    return cells;
  }

  placeSeeds(bounds, count, rMin, rMax, rng) {
    // 每个种子的目标半径决定格子大小，归一化让 Σπr² ≈ 游戏区面积 × COVERAGE
    const ratios = [];
    for (let i = 0; i < count; i++) ratios.push(rMin + (rMax - rMin) * rng());
    let sum = 0;
    for (const r of ratios) sum += Math.PI * r * r;
    const k = Math.sqrt((bounds.width * bounds.height * COVERAGE) / sum);
    const radii = ratios.map(r => r * k);

    // 掷点法：优先放在与已有种子挤压度最低的位置
    const seeds = [];
    for (let i = 0; i < count; i++) {
      const r = radii[i];
      const margin = Math.min(r, bounds.width / 2 - 2, bounds.height / 2 - 2);
      let best = null;
      let bestScore = -Infinity;
      for (let t = 0; t < PLACEMENT_TRIES; t++) {
        const x = bounds.x + margin + rng() * Math.max(1, bounds.width - 2 * margin);
        const y = bounds.y + margin + rng() * Math.max(1, bounds.height - 2 * margin);
        let fits = true;
        let minRatio = Infinity;
        for (let j = 0; j < seeds.length; j++) {
          const d = Math.hypot(x - seeds[j].x, y - seeds[j].y);
          const ratio = d / (SPACING_BETA * (r + seeds[j].r));
          if (ratio < 1) fits = false;
          if (ratio < minRatio) minRatio = ratio;
        }
        if (fits) {
          best = { x, y, r };
          break;
        }
        if (minRatio > bestScore) {
          bestScore = minRatio;
          best = { x, y, r };
        }
      }
      seeds.push(best);
    }
    return seeds;
  }

  // 幂图（加权 Voronoi）：每个格子从游戏区矩形出发，
  // 逐个用与其它种子的加权分割线裁剪。种子 i、j（权重 w = r²）的
  // 分割线为 |p−si|² − wi = |p−sj|² − wj，是一条直线，故结果恒为凸多边形
  computeCells(seeds, bounds) {
    const cells = [];
    const rect = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height }
    ];
    for (let i = 0; i < seeds.length; i++) {
      let poly = rect;
      const wi = seeds[i].r * seeds[i].r;
      for (let j = 0; j < seeds.length && poly.length >= 3; j++) {
        if (j === i) continue;
        const wj = seeds[j].r * seeds[j].r;
        const A = 2 * (seeds[j].x - seeds[i].x);
        const B = 2 * (seeds[j].y - seeds[i].y);
        const C = (seeds[j].x * seeds[j].x + seeds[j].y * seeds[j].y - wj)
                - (seeds[i].x * seeds[i].x + seeds[i].y * seeds[i].y - wi);
        poly = this.clipHalfPlane(poly, A, B, C);
      }
      cells.push(poly);
    }
    return cells;
  }

  // Sutherland–Hodgman 半平面裁剪：保留 A*x + B*y <= C 一侧（不修改入参）
  clipHalfPlane(poly, A, B, C) {
    const out = [];
    const n = poly.length;
    const f = p => A * p.x + B * p.y - C;
    for (let i = 0; i < n; i++) {
      const cur = poly[i];
      const nxt = poly[(i + 1) % n];
      const fc = f(cur);
      const fn = f(nxt);
      if (fc <= 0 && fn <= 0) {
        out.push(nxt);
      } else if (fc <= 0 && fn > 0) {
        out.push(this.edgeIntersection(cur, nxt, fc, fn));
      } else if (fc > 0 && fn <= 0) {
        out.push(this.edgeIntersection(cur, nxt, fc, fn));
        out.push(nxt);
      }
    }
    return dedupeVertices(out);
  }

  edgeIntersection(p, q, fp, fq) {
    const t = fp / (fp - fq);
    return { x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) };
  }

  // 多边形面积质心（比顶点平均更"居中"，用于 Lloyd 松弛）
  polygonCentroid(poly) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const cross = p.x * q.y - q.x * p.y;
      a += cross;
      cx += (p.x + q.x) * cross;
      cy += (p.y + q.y) * cross;
    }
    a /= 2;
    if (Math.abs(a) < EPS) return { x: 0, y: 0, area: 0 };
    return { x: cx / (6 * a), y: cy / (6 * a), area: Math.abs(a) };
  }

  isValid(cells, count) {
    if (cells.length !== count) return false;
    for (const cell of cells) {
      if (cell.length < 3) return false;
      if (this.polygonCentroid(cell).area < MIN_CELL_AREA) return false;
      if (minBBoxSide(cell) < MIN_CELL_WIDTH) return false;
    }
    return true;
  }

  buildPolygons(cells, rng) {
    const indices = cells.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const polygons = [];
    for (let i = 0; i < indices.length; i++) {
      polygons.push(new Polygon(cells[indices[i]], i + 1, this.colors[i % this.colors.length]));
    }
    return polygons;
  }
}

function dedupeVertices(poly) {
  const out = [];
  for (const v of poly) {
    const last = out[out.length - 1];
    if (!last || Math.abs(v.x - last.x) > EPS || Math.abs(v.y - last.y) > EPS) {
      out.push(v);
    }
  }
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.abs(first.x - last.x) <= EPS && Math.abs(first.y - last.y) <= EPS) {
      out.pop();
    }
  }
  return out;
}

function minBBoxSide(poly) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of poly) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return Math.min(maxX - minX, maxY - minY);
}
