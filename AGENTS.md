# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

"数一数噻" (Find Numbers Game) — a WeChat Mini Game where players tap numbered polygon regions in sequential order (1→2→3...). Built with Canvas 2D rendering, no frameworks. Runs inside the WeChat Mini Game runtime (`wx` global APIs) with a browser canvas fallback.

## Development Commands

- **Run tests**: `npm test`（= scoreManager + platform 两个测试套件）
- **Lint**: `npm run lint`（= `npx eslint js/ game.js`；配置在 `.eslintrc.cjs`，globals 含 `wx`/`tt`）当前基线存在约 35 个既有 error（多为 no-empty 空 catch），验收标准为不新增
- **Build Douyin package**: `npm run build:douyin` → 产出 `dist/douyin/`，用抖音开发者工具（小游戏独立版）打开该目录
- **Build/Run (WeChat)**: 打开项目根目录到微信开发者工具，无 CLI 构建步骤

## Architecture

### Entry & Bootstrapping
- `game.js` → imports and instantiates `FindGameMain` (the single orchestrator).
- `js/render.js` — creates the global `<canvas>`, detects `wx` vs browser, exports `SCREEN_WIDTH`, `SCREEN_HEIGHT`, `SAFE_AREA`, `getContext()`, `getCanvas()`. **Importing this module has side effects** (canvas creation + DOM insertion).

### Core Game Loop
`FindGameMain` (in `js/findGameMain.js`) owns the `requestAnimationFrame` loop:
1. `update(dt)` → delegates to `GameManager.update()`, `UI.updateModalAnimation()`
2. `render(dt)` → draws background, game polygons, UI overlay

### Module Responsibilities

| Module | Role |
|---|---|
| `platform.js` | 跨平台适配层：douyin(tt)/wechat(wx)/browser 三态分发（tt 检测优先，抖音可能注入 wx）。所有平台 API 调用的唯一入口 |
| `GameManager` | Game state machine (menu/playing/completed/failed), click-to-polygon hit testing, timer, combo delegation |
| `UI` | All Canvas 2D rendering: menus, HUD, modals, shop, skills, achievements, floating text, effects. Also handles button hit-testing and input routing. **This is the largest file (~3600 lines).** |
| `LineDividerGenerator` | Generates the numbered polygon grid (replaced the original Voronoi approach). Produces `Polygon` instances. |
| `Polygon` | Single polygon region with state (clicked, highlighted, hint, eagle-eye), shape rendering, text rendering, animations (shake, glow) |
| `SoundManager` / `AudioGenerator` | Audio playback via `platform.createInnerAudioContext`（微信/抖音）with programmatic tone fallback |
| `ComboManager` | Combo counter with level thresholds, callbacks for level-up/break |
| `EggManager` | Easter egg sequence detection and reward triggering |
| `RewardManager` | Mid-game random reward drops (hints, coins, time) |
| `AchievementManager` | Achievement definitions, progress tracking, unlock detection |
| `CoinManager` / `ItemManager` / `ShopManager` / `SkillManager` | Currency, inventory, shop products, skill tree — all persisted via `platform.setStorageSync` |
| `RankManager` | Friend leaderboard via WeChat open-data context |
| `VibrationManager` | platform 分发的 short/long vibration（原生 + Web Vibration API） |
| `CacheManager` | Color scheme and state color caching for render performance |
| `constants/colors.js` | Central color scheme (`COLOR_SCHEME`), exported via `getColorScheme()` |

### Data Flow
- **Callbacks everywhere** — modules communicate via `onXxx` callback properties set in `FindGameMain.setupUICallbacks()`. No event bus or pub/sub.
- **Persistence** — `platform.setStorageSync` / `platform.getStorageSync` for game progress, mode, achievements, coins, items, skills, eggs. Keys: `gameProgress`, `gameMode`, `triggered_eggs`, etc.
- **Input** → `FindGameMain.handleInput()` → routes to UI (buttons/modals first), then `GameManager.handleClick()` (polygon hit test during gameplay).

### Game Modes
- `timed` — countdown timer (5s initial, +5s on correct, -5s on wrong)
- `untimed` — free play, no timer pressure

### Levels
Defined in `UI.levelConfig`: Level 1 = 10 numbers, Level 2 = 100 numbers. `GameManager.hasNextLevel()` checks `currentLevel < 2`.

### Layout System
Game area is bounded by safe-area-aware header/footer. All modules use the same calculation pattern:
```
headerHeight = max(100, safeArea.top + 56)  // mobile
footerHeight = max(80, safeArea.bottom + 46) // mobile
gameArea = screen - header - footer - padding
```
The `isMobile` check used throughout is `this.width < 768`.

## Key Conventions

- **ES modules** (`import`/`export`) — WeChat Developer Tools compiles these.
- **No DOM manipulation** outside `render.js` canvas setup. Everything is Canvas 2D drawing.
- **Dual runtime support**: all platform API calls go through the `js/platform.js` adapter (douyin/wechat/browser 三态分发；业务代码不直接调用 `wx.*`/`tt.*`).
- **Animation**: `requestAnimationFrame` loop with deltaTime. UI animations use lerp (`animation += deltaTime * speed`).
- **Scroll handling**: each scrollable panel (shop, skills, achievements) maintains its own scroll offset, velocity, friction, and touch state.
- **Polygon generation** uses `LineDividerGenerator` (line-division algorithm), not Voronoi. The README is outdated in this regard.
