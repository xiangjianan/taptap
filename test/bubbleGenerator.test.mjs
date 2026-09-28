/**
 * BubbleGenerator tests
 * Run: node test/bubbleGenerator.test.mjs
 */

import BubbleGenerator, { mulberry32 } from '../js/bubbleGenerator.js';

const WIDTH = 375;
const HEIGHT = 812;
const SEED = 20260927;

// ── Test harness（沿用 scoreManager.test.js 风格） ──

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ ${message} (expected ${expected}, got ${actual})`);
  }
}

function makeGenerator() {
  return new BubbleGenerator(WIDTH, HEIGHT, {
    safeArea: { top: 44, bottom: 34, left: 0, right: 0 }
  });
}

// ── 生成数量与编号 ──
console.log('\n生成数量与编号:');

const polys10 = makeGenerator().generatePolygons(10, 'normal', SEED);
assertEqual(polys10.length, 10, '10 格关卡返回 10 个 Polygon');

const nums10 = polys10.map(p => p.number).sort((a, b) => a - b);
assertEqual(nums10.join(','), Array.from({ length: 10 }, (_, i) => i + 1).join(','), '编号是 1..10 的排列');

const polys100 = makeGenerator().generatePolygons(100, 'normal', SEED);
assertEqual(polys100.length, 100, '100 格关卡返回 100 个 Polygon');

const nums100 = polys100.map(p => p.number).sort((a, b) => a - b);
assertEqual(nums100.join(','), Array.from({ length: 100 }, (_, i) => i + 1).join(','), '编号是 1..100 的排列');

// ── 凸多边形 ──
console.log('\n凸多边形:');

function isConvex(poly) {
  const n = poly.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], c = poly[(i + 2) % n];
    const ab = Math.hypot(b.x - a.x, b.y - a.y);
    const bc = Math.hypot(c.x - b.x, c.y - b.y);
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross < -1e-6 * Math.max(1, ab * bc)) return false; // 负叉积=凹角，容差消化浮点/共线
  }
  return true;
}

assert(polys10.every(p => isConvex(p.vertices)), '10 格全部为凸多边形');
assert(polys100.every(p => isConvex(p.vertices)), '100 格全部为凸多边形');

// ── 无缝无重叠 ──
console.log('\n无缝无重叠:');

const bounds = makeGenerator().computeBounds();
const boundsArea = bounds.width * bounds.height;
const areaSum = polys100.reduce((s, p) => s + p.getArea(), 0);
assert(Math.abs(areaSum - boundsArea) / boundsArea < 0.01, '格子总面积 ≈ 游戏区面积（误差<1%）');

function countHits(list, x, y) {
  let n = 0;
  for (const p of list) {
    if (p.containsPoint({ x, y })) n++;
  }
  return n;
}

const JITTERS = [[0.37, 0.61], [-0.29, 0.43]];
let gapCount = 0;
let overlapCount = 0;
for (let x = bounds.x + 7; x < bounds.x + bounds.width; x += 13) {
  for (let y = bounds.y + 7; y < bounds.y + bounds.height; y += 13) {
    let hits = countHits(polys100, x, y);
    if (hits !== 1) {
      // 采样点可能恰好落在共享边上，抖动后复测
      for (const [dx, dy] of JITTERS) {
        hits = countHits(polys100, x + dx, y + dy);
        if (hits === 1) break;
      }
    }
    if (hits === 0) gapCount++;
    else if (hits > 1) overlapCount++;
  }
}
assertEqual(gapCount, 0, '采样点无未覆盖缺口');
assertEqual(overlapCount, 0, '采样点无重叠');

// ── 顶点在边界内 ──
console.log('\n顶点在边界内:');

let allInBounds = true;
for (const p of [...polys10, ...polys100]) {
  for (const v of p.vertices) {
    if (v.x < bounds.x - 1e-6 || v.x > bounds.x + bounds.width + 1e-6 ||
        v.y < bounds.y - 1e-6 || v.y > bounds.y + bounds.height + 1e-6) {
      allInBounds = false;
    }
  }
}
assert(allInBounds, '所有顶点都在游戏区内');

// ── 最小尺寸与大小差异 ──
console.log('\n最小尺寸与大小差异:');

function minBBoxSide(poly) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of poly) {
    minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
  }
  return Math.min(maxX - minX, maxY - minY);
}

assert(polys10.every(p => p.getArea() >= 280), '10 格：每个格子面积 ≥ 280px²');
assert(polys100.every(p => p.getArea() >= 280), '100 格：每个格子面积 ≥ 280px²');
assert(polys100.every(p => minBBoxSide(p.vertices) >= 15), '100 格：每个格子包围盒短边 ≥ 15px');

const areas10 = polys10.map(p => p.getArea()).sort((a, b) => a - b);
assert(areas10[areas10.length - 1] / areas10[0] >= 2, '10 格：最大/最小面积比 ≥ 2（强对比生效）');
const areas100 = polys100.map(p => p.getArea()).sort((a, b) => a - b);
assert(areas100[areas100.length - 1] / areas100[0] >= 3, '100 格：最大/最小面积比 ≥ 3（强对比在第 2 关同样生效）');

// ── 同种子可复现 ──
console.log('\n同种子可复现:');

const a60 = makeGenerator().generatePolygons(60, 'normal', SEED);
const b60 = makeGenerator().generatePolygons(60, 'normal', SEED);
assertEqual(JSON.stringify(a60.map(p => p.vertices)), JSON.stringify(b60.map(p => p.vertices)), '两次生成顶点完全一致');
assertEqual(JSON.stringify(a60.map(p => p.number)), JSON.stringify(b60.map(p => p.number)), '两次生成编号一致');

const c60 = makeGenerator().generatePolygons(60, 'normal', SEED + 1);
assert(JSON.stringify(a60.map(p => p.vertices)) !== JSON.stringify(c60.map(p => p.vertices)), '不同种子布局不同');

// ── 种子扫描与边界 count ──
console.log('\n种子扫描与边界 count:');

let sweepOk = true;
for (let s = 1; s <= 15; s++) {
  for (const n of [10, 60, 100]) {
    const ps = makeGenerator().generatePolygons(n, 'normal', SEED + s * 7919);
    if (ps.length !== n || !ps.every(p => p.vertices.length >= 3)) sweepOk = false;
  }
}
assert(sweepOk, '15 个种子 × {10,60,100}：数量恒等于请求值且每格 ≥3 顶点');

assertEqual(makeGenerator().generatePolygons(1, 'normal', SEED).length, 1, 'count=1 返回 1 格');
assertEqual(makeGenerator().generatePolygons(2, 'normal', SEED).length, 2, 'count=2 返回 2 格');

// ── 剪枝等价性（优化 computeCells vs 全量参考实现） ──
console.log('\n剪枝等价性:');

for (const [w, h] of [[375, 812], [320, 568]]) {
  for (const n of [10, 60, 100]) {
    let allEqual = true;
    for (let s = 1; s <= 5; s++) {
      const gen = new BubbleGenerator(w, h, { safeArea: { top: 44, bottom: 34, left: 0, right: 0 } });
      const rng = mulberry32(SEED + s * 7919);
      const cellBounds = gen.computeBounds();
      const range = gen.sizeRangeFor(n, 1);
      const seeds = gen.placeSeeds(cellBounds, n, range.rMin, range.rMax, rng);
      const fast = gen.computeCells(seeds, cellBounds);
      const ref = BubbleGenerator.computeCellsReference(seeds, cellBounds);
      if (JSON.stringify(fast) !== JSON.stringify(ref)) allEqual = false;
    }
    assert(allEqual, `${w}×${h} N=${n}：剪枝结果与全量参考逐顶点一致`);
  }
}

// ── 对抗构造种子（不经 placeSeeds）等价性 ──
console.log('\n对抗构造种子等价性:');

const advGen = new BubbleGenerator(375, 812, { safeArea: { top: 44, bottom: 34, left: 0, right: 0 } });
const advBounds = advGen.computeBounds();

function checkSeedsEqual(seeds, message) {
  const fast = advGen.computeCells(seeds, advBounds);
  const ref = BubbleGenerator.computeCellsReference(seeds, advBounds);
  assert(JSON.stringify(fast) === JSON.stringify(ref), message);
}

function gridSeeds(rows, cols, r) {
  const seeds = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      seeds.push({
        x: advBounds.x + (advBounds.width * (j + 0.5)) / cols,
        y: advBounds.y + (advBounds.height * (i + 0.5)) / rows,
        r
      });
    }
  }
  return seeds;
}

// 等权规则网格：权重相消退化为普通 Voronoi，对角邻居分割线在数学上
// 恰好穿过格子角点——评审构造的擦边（knife-edge）重现形状
checkSeedsEqual(gridSeeds(25, 2, 10), '等权 25×2 规则网格：剪枝与全量参考一致');
checkSeedsEqual(gridSeeds(8, 7, 10), '等权 8×7 规则网格：剪枝与全量参考一致');

// 重合种子：等权与不等权各一组
const ccx = advBounds.x + advBounds.width / 2;
const ccy = advBounds.y + advBounds.height / 2;
const ringSeeds = [
  { x: advBounds.x + 40, y: advBounds.y + 60, r: 12 },
  { x: advBounds.x + advBounds.width - 40, y: advBounds.y + 60, r: 12 },
  { x: advBounds.x + 40, y: advBounds.y + advBounds.height - 60, r: 12 },
  { x: advBounds.x + advBounds.width - 40, y: advBounds.y + advBounds.height - 60, r: 12 }
];
checkSeedsEqual([
  { x: ccx, y: ccy, r: 12 },
  { x: ccx, y: ccy, r: 12 },
  ...ringSeeds
], '重合种子（等权）：剪枝与全量参考一致');
checkSeedsEqual([
  { x: ccx, y: ccy, r: 12 },
  { x: ccx, y: ccy, r: 30 },
  ...ringSeeds
], '重合种子（不等权）：剪枝与全量参考一致');

// 权重悬殊：中心种子的权重 500 倍于邻居
const dominated = gridSeeds(7, 8, 8);
dominated[27].r = 8 * Math.sqrt(500);
checkSeedsEqual(dominated, '权重悬殊（大种子权重 ×500）：剪枝与全量参考一致');

// ── Lloyd 增重状态等价性（修复逻辑逐轮 ×1.12 后的种子状态） ──
console.log('\nLloyd 增重状态等价性:');

for (const [w, h] of [[375, 812], [320, 568]]) {
  let allOk = true;
  for (let s = 1; s <= 3; s++) {
    const gen = new BubbleGenerator(w, h, { safeArea: { top: 44, bottom: 34, left: 0, right: 0 } });
    const rng = mulberry32(SEED + s * 7919);
    const cellBounds = gen.computeBounds();
    const range = gen.sizeRangeFor(100, 1);
    let seeds = gen.placeSeeds(cellBounds, 100, range.rMin, range.rMax, rng);
    for (let k = 1; k <= 4; k++) {
      seeds = seeds.map(sd => ({ x: sd.x, y: sd.y, r: sd.r * 1.12 }));
      if (JSON.stringify(gen.computeCells(seeds, cellBounds)) !==
          JSON.stringify(BubbleGenerator.computeCellsReference(seeds, cellBounds))) {
        allOk = false;
      }
    }
  }
  assert(allOk, `${w}×${h}：Lloyd 增重状态（r×1.12^k，k=1..4）剪枝等价`);
}

// ── Summary ──
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40));

if (failed > 0) {
  process.exit(1);
}
