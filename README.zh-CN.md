**English** | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="https://img.shields.io/badge/🤖_100%25_AI_Developed-7C3AED?style=for-the-badge" alt="100% AI Developed" />
  <img src="https://img.shields.io/badge/✨_全程AI生成-00D4AA?style=for-the-badge" alt="全程AI生成" />
</p>

> **💡 本仓库 100% 由 AI 独立完成开发，从需求分析、代码编写到测试调试，全程由 AI 主导完成，无任何人工编写代码。**

# 数一数噻 (Find Numbers Game)

一个基于微信小游戏平台的数字查找益智游戏。玩家需要在限定时间内，按顺序（1, 2, 3...）点击屏幕上随机分布的多边形中的数字。

<div align="left"><img src="image/wechat.jpg" width="50%" alt="微信扫码体验游戏"></div>

## 🎮 游戏简介

数一数噻是一款考验反应速度和数字认知能力的益智游戏。游戏使用 Voronoi 图算法生成随机多边形区域，每个区域包含一个数字。玩家需要在倒计时结束前，按正确的顺序点击所有数字。

### 游戏特色

- 🎨 **随机多边形生成**：使用 Voronoi 图算法生成独特的游戏布局
- ⏱️ **限时挑战**：初始5秒，正确点击增加时间，错误点击扣除时间
- 🎯 **多关卡设计**：包含不同难度的关卡
- 🔊 **音效反馈**：点击、错误、完成等多种音效
- 💾 **进度保存**：自动保存游戏进度
- 📱 **触屏优化**：专为移动设备触屏操作设计

## 📖 游戏玩法

### 基本规则

1. 点击"开始游戏"按钮进入游戏
2. 从数字 1 开始，按顺序点击屏幕上的数字
3. 正确点击数字：获得时间奖励（+5秒）
4. 错误点击数字：扣除时间（-5秒）
5. 在时间耗尽前完成所有数字点击即可通关

### 关卡说明

| 关卡  | 数字数量 | 难度 |
| --- | ---- | -- |
| 第一关 | 10   | 简单 |
| 第二关 | 100  | 困难 |

## 🛠️ 技术架构

### 项目结构

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

### 核心模块

#### FindGameMain

游戏主入口类，负责初始化游戏各模块、设置事件监听、启动游戏循环。

#### GameManager

游戏核心逻辑管理器，负责：

- 游戏状态管理（菜单、游戏中、完成）
- 数字点击判定
- 计时器管理
- 关卡进度控制

#### UI

用户界面管理器，负责：

- 菜单界面渲染
- 游戏界面渲染
- 按钮交互处理
- 模态框显示

#### SoundManager

音效管理器，支持：

- 预加载音频文件
- 程序生成音效
- 音量控制
- 音效播放

#### VoronoiGenerator

Voronoi 图生成器，负责：

- 生成随机种子点
- 计算凸包
- 生成多边形区域

### 技术栈

- **平台**：微信小游戏
- **语言**：JavaScript (ES6+)
- **渲染**：Canvas 2D
- **算法**：Voronoi 图、凸包算法
- **音频**：Web Audio API / 微信音频 API

## 🚀 快速开始

### 环境要求

- 微信开发者工具
- 微信小程序/小游戏开发环境

### 安装步骤

1. 克隆或下载项目代码
2. 使用微信开发者工具打开项目目录
3. 点击"编译"按钮运行项目

### 本地开发

```bash
# 如果需要运行测试
node js/test.js
```

## ⚙️ 配置说明

### game.json

```json
{
  "deviceOrientation": "portrait"
}
```

- `deviceOrientation`: 设备方向，"portrait" 为竖屏模式

### project.config.json

主要配置项：

- `appid`: 小游戏 AppID
- `projectname`: 项目名称
- `libVersion`: 基础库版本

## 🎨 自定义配置

### 修改关卡配置

在 `js/ui.js` 中修改 `levelConfig`：

```javascript
this.levelConfig = {
  1: { count: 10, name: '第一关' },
  2: { count: 100, name: '第二关' },
  // 添加更多关卡...
  3: { count: 50, name: '第三关' }
};
```

### 修改时间设置

在 `js/gameManager.js` 中修改时间参数：

```javascript
this.timeLeft = 5.0;      // 初始时间
this.initialTime = 5.0;    // 初始时间
this.timeBonus = 5.0;     // 时间奖励/惩罚
```

### 修改颜色方案

在 `js/voronoiGenerator.js` 中修改 `colors` 数组：

```javascript
this.colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  // 添加更多颜色...
];
```

## 📝 开发计划

- [ ] 添加更多关卡
- [ ] 实现排行榜功能
- [ ] 添加成就系统
- [ ] 支持自定义难度
- [ ] 添加主题切换功能
- [ ] 优化性能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 作者

- 项目名称：数一数噻 (Find Numbers Game)
- 作者：xiangjianan

## 🙏 致谢

- 微信小游戏团队提供的开发平台
- Voronoi 图算法的原始实现者

***

**祝你游戏愉快！🎉**
