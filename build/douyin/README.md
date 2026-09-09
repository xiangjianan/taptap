# 抖音包构建模板

- `appid` 已填入正式值；如换主体/重新创建小游戏，改这里后重新构建（或构建后改 dist/douyin/project.config.json）
- 构建命令：`npm run build:douyin`
- 产物：`dist/douyin/`，用「抖音开发者工具（小游戏独立版）」打开该目录预览/上传
- TODO：抖音分享图（5:4 本地图）——shareManager 中 imageUrl 未传时平台自动截图
