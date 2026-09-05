// 抖音小游戏打包脚本：esbuild 单文件 bundle + 配置模板 + 静态资源
import { build } from 'esbuild';
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'douyin');
const MAX_MAIN_PACKAGE_BYTES = 4 * 1024 * 1024; // 抖音主包 ≤ 4MB

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

await build({
  entryPoints: [join(ROOT, 'game.js')],
  bundle: true,
  format: 'iife',
  outfile: join(DIST, 'game.js'),
  minify: true,
  target: ['es2017'],
  legalComments: 'none',
  logLevel: 'info'
});

cpSync(join(ROOT, 'build', 'douyin', 'game.json'), join(DIST, 'game.json'));
cpSync(join(ROOT, 'build', 'douyin', 'project.config.json'), join(DIST, 'project.config.json'));
cpSync(join(ROOT, 'audio'), join(DIST, 'audio'), { recursive: true });
cpSync(join(ROOT, 'image'), join(DIST, 'image'), { recursive: true });

let total = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else {
      total += st.size;
    }
  }
}
walk(DIST);

console.log(`dist/douyin 总体积: ${(total / 1024 / 1024).toFixed(2)}MB`);
if (total > MAX_MAIN_PACKAGE_BYTES) {
  console.error(`超过抖音主包 4MB 限制，请拆分资源`);
  process.exit(1);
}
console.log('✓ 抖音包构建完成: dist/douyin');
