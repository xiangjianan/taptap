# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

"数一数噻" (Find Numbers Game) — a WeChat Mini Game where players tap numbered polygon regions in sequential order (1→2→3...). Built with Canvas 2D rendering, no frameworks. Runs inside the WeChat Mini Game runtime (`wx` global APIs) with a browser canvas fallback.

## Development Commands

- **Run tests**: `node js/test.js`
- **Lint**: No dedicated lint command. ESLint config is in `.eslintrc.js` (ES2020 modules, `wx` as global). Run manually with `npx eslint js/` if needed.
- **Build/Run**: Open the project root in WeChat Developer Tools. No CLI build step — the platform handles ES module compilation.

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
| `GameManager` | Game state machine (menu/playing/completed/failed), click-to-polygon hit testing, timer, combo delegation |
| `UI` | All Canvas 2D rendering: menus, HUD, modals, shop, skills, achievements, floating text, effects. Also handles button hit-testing and input routing. **This is the largest file (~3600 lines).** |
| `LineDividerGenerator` | Generates the numbered polygon grid (replaced the original Voronoi approach). Produces `Polygon` instances. |
| `Polygon` | Single polygon region with state (clicked, highlighted, hint, eagle-eye), shape rendering, text rendering, animations (shake, glow) |
| `SoundManager` / `AudioGenerator` | Audio playback via WeChat `wx.createInnerAudioContext` with programmatic tone fallback |
| `ComboManager` | Combo counter with level thresholds, callbacks for level-up/break |
| `EggManager` | Easter egg sequence detection and reward triggering |
| `RewardManager` | Mid-game random reward drops (hints, coins, time) |
| `AchievementManager` | Achievement definitions, progress tracking, unlock detection |
| `CoinManager` / `ItemManager` / `ShopManager` / `SkillManager` | Currency, inventory, shop products, skill tree — all persisted via `wx.setStorageSync` |
| `RankManager` | Friend leaderboard via WeChat open-data context |
| `VibrationManager` | `wx.vibrateShort` / `wx.vibrateLong` wrappers |
| `CacheManager` | Color scheme and state color caching for render performance |
| `constants/colors.js` | Central color scheme (`COLOR_SCHEME`), exported via `getColorScheme()` |

### Data Flow
- **Callbacks everywhere** — modules communicate via `onXxx` callback properties set in `FindGameMain.setupUICallbacks()`. No event bus or pub/sub.
- **Persistence** — `wx.setStorageSync` / `wx.getStorageSync` for game progress, mode, achievements, coins, items, skills, eggs. Keys: `gameProgress`, `gameMode`, `triggered_eggs`, etc.
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
- **Dual runtime support**: code guards with `typeof wx !== 'undefined'` for WeChat-specific APIs.
- **Animation**: `requestAnimationFrame` loop with deltaTime. UI animations use lerp (`animation += deltaTime * speed`).
- **Scroll handling**: each scrollable panel (shop, skills, achievements) maintains its own scroll offset, velocity, friction, and touch state.
- **Polygon generation** uses `LineDividerGenerator` (line-division algorithm), not Voronoi. The README is outdated in this regard.
