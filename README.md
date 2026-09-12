**English** | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="https://img.shields.io/badge/🤖_100%25_AI_Developed-7C3AED?style=for-the-badge" alt="100% AI Developed" />
  <img src="https://img.shields.io/badge/✨_全程AI生成-00D4AA?style=for-the-badge" alt="全程AI生成" />
</p>

> **💡 This repo was developed 100% independently by AI — from requirements analysis and coding to testing and debugging, AI led the entire process with no human-written code.**

# 数一数噻 (Find Numbers Game)

A number-finding puzzle game built on the WeChat Mini Game platform. Within a time limit, players must tap numbers scattered across randomly distributed polygons on the screen in order (1, 2, 3...).

<div align="left"><img src="image/wechat.jpg" width="50%" alt="微信扫码体验游戏"></div>

## 🎮 Game Overview

数一数噻 is a puzzle game that tests your reaction speed and number recognition. The game uses the Voronoi diagram algorithm to generate random polygon regions, each containing a number. Players must tap all the numbers in the correct order before the countdown ends.

### Game Features

- 🎨 **Random polygon generation**: unique game layouts generated with the Voronoi diagram algorithm
- ⏱️ **Timed challenge**: 5 seconds initially; correct taps add time, wrong taps subtract time
- 🎯 **Multiple levels**: levels of varying difficulty
- 🔊 **Sound feedback**: multiple sounds for taps, errors, and completion
- 💾 **Progress saving**: game progress is saved automatically
- 📱 **Touch-optimized**: designed specifically for touchscreen mobile devices

## 📖 How to Play

### Basic Rules

1. Tap the "Start Game" button to enter the game
2. Starting from number 1, tap the numbers on the screen in order
3. Correct tap: earn a time bonus (+5 seconds)
4. Wrong tap: lose time (−5 seconds)
5. Tap all numbers before time runs out to clear the level

### Levels

| Level | Number count | Difficulty |
| --- | ---- | -- |
| Level 1 | 10   | Easy |
| Level 2 | 100  | Hard |

## 🛠️ Technical Architecture

### Project Structure

```
find100wx/
├── game.js                 # 游戏入口文件
├── game.json               # 游戏配置文件
├── project.config.json     # 项目配置文件
├── js/                     # JavaScript 源代码
│   ├── findGameMain.js     # 主游戏类
│   ├── gameManager.js      # 游戏管理器
│   ├── ui.js               # UI 管理器
│   ├── soundManager.js     # 音效管理器
│   ├── render.js           # 渲染相关
│   ├── polygon.js          # 多边形类
│   ├── polygonGenerator.js # 多边形生成器
│   ├── voronoiGenerator.js # Voronoi 图生成器
│   ├── audioGenerator.js   # 音频生成器
│   └── test.js             # 测试文件
└── audio/                  # 音频资源
    ├── bgm.mp3             # 背景音乐
    ├── click.wav           # 点击音效
    ├── click.wav        # 完成音效
    └── click.wav           # 错误音效
```

### Core Modules

#### FindGameMain

The main game entry class, responsible for initializing game modules, setting up event listeners, and starting the game loop.

#### GameManager

The core game logic manager, responsible for:

- Game state management (menu, playing, complete)
- Tap validation
- Timer management
- Level progression control

#### UI

The user interface manager, responsible for:

- Menu screen rendering
- Game screen rendering
- Button interaction handling
- Modal display

#### SoundManager

The sound manager, supporting:

- Preloading audio files
- Procedurally generated sound effects
- Volume control
- Sound playback

#### VoronoiGenerator

The Voronoi diagram generator, responsible for:

- Generating random seed points
- Computing convex hulls
- Generating polygon regions

### Tech Stack

- **Platform**: WeChat Mini Game
- **Language**: JavaScript (ES6+)
- **Rendering**: Canvas 2D
- **Algorithms**: Voronoi diagram, convex hull
- **Audio**: Web Audio API / WeChat audio API

## 🚀 Quick Start

### Requirements

- WeChat DevTools
- WeChat Mini Program / Mini Game development environment

### Installation

1. Clone or download the project code
2. Open the project directory in WeChat DevTools
3. Click the "Compile" button to run the project

### Local Development

```bash
# 如果需要运行测试
node js/test.js
```

## ⚙️ Configuration

### game.json

```json
{
  "deviceOrientation": "portrait"
}
```

- `deviceOrientation`: device orientation; "portrait" means portrait mode

### project.config.json

Main configuration items:

- `appid`: the Mini Game AppID
- `projectname`: project name
- `libVersion`: base library version

## 🎨 Customization

### Modify level configuration

Edit `levelConfig` in `js/ui.js`:

```javascript
this.levelConfig = {
  1: { count: 10, name: '第一关' },
  2: { count: 100, name: '第二关' },
  // 添加更多关卡...
  3: { count: 50, name: '第三关' }
};
```

### Modify time settings

Edit the time parameters in `js/gameManager.js`:

```javascript
this.timeLeft = 5.0;      // 初始时间
this.initialTime = 5.0;    // 初始时间
this.timeBonus = 5.0;     // 时间奖励/惩罚
```

### Modify the color scheme

Edit the `colors` array in `js/voronoiGenerator.js`:

```javascript
this.colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  // 添加更多颜色...
];
```

## 📝 Roadmap

- [ ] Add more levels
- [ ] Implement a leaderboard
- [ ] Add an achievement system
- [ ] Support custom difficulty
- [ ] Add theme switching
- [ ] Performance optimization

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details

## 👨‍💻 Author

- Project name: 数一数噻 (Find Numbers Game)
- Author: xiangjianan

## 🙏 Acknowledgements

- The WeChat Mini Game team for the development platform
- The original implementers of the Voronoi diagram algorithm

***

**祝你游戏愉快！🎉**
