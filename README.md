# Uni PJSK Viewer Frontend

> 🎵一个用于浏览 Project SEKAI 游戏资源的 Web 应用前端。

## 核心特性

- **多账号管理与同步** 
  - 支持多账号无缝切换，基于 IndexedDB 的本地大容量缓存。
  - 自动同步个人 Profile 信息（等级、昵称、队长卡面、签名）。
- **卡牌与图鉴系统** 
  - 查看所有角色卡牌的高清大图及详细信息。
  - 图鉴进度追踪：同步账号拥有的卡牌，支持按稀有度分类统计达成率。
- **曲目列表与打歌状态** 
  - 浏览完整曲库、封面、发行时间及创作者信息。
  - 对接玩家数据，直接在列表中展示 Clear / FC / AP 状态。
  - 集成 Media Session API，支持系统媒体控制。
- **谱面预览**
  - 在线预览游戏内所有的 2D/3D 下落式谱面。
- **活动与卡池总览**
  - 活动看板：查看当前进行中的活动、类型、起止时间。
  - 动态榜线：获取榜单数据进行走势预览。
  - 招募追踪：首页查看所有当前进行中的抽卡卡池。
- **自定义主题引擎**
  - 内置五种主题无缝切换：跟随系统 (`Auto`)、浅色 (`Light`)、深色 (`Dark`)、萌系 (`Moe`) 以及地雷系 (`Jirai`)。
- **PWA 优化**
  - 可安装为桌面/移动端独立应用，支持离线 Service Worker 缓存。


## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

启动后默认访问 `http://localhost:5173`。

### 环境变量配置

在项目根目录创建 `.env.development` 文件：

```env
# API 后端地址（留空则使用相对路径）
VITE_API_BASE_URL=
# 谱面预览服务地址
VITE_CHART_PREVIEW_URL=http://localhost:5175
```

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
viewer-vue/
├── public/              # 静态资源
├── src/
│   ├── components/      # 公共组件
│   ├── views/           # 页面视图
│   ├── stores/          # Pinia 状态管理
│   ├── router/          # 路由配置
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── .env.development     # 开发环境变量
├── .env.production      # 生产环境变量
├── vite.config.ts       # Vite 配置
└── package.json
```

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 创建 Pull Request

## 📜 开源协议

本项目基于 [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) 协议开源。

### 致谢

本项目使用或参考了以下开源项目：

| 项目 | 协议 |
|------|------|
| [Sekai-World/sekai-viewer](https://github.com/Sekai-World/sekai-viewer) | GPL-3.0 |
| [xfl03/sekai-calculator](https://github.com/xfl03/sekai-calculator) | LGPL-2.1 |
| [xfl03/33KitFrontend](https://github.com/xfl03/33KitFrontend) | — |
| [Next-SEKAI/sonolus-next-sekai-editor](https://github.com/Next-SEKAI/sonolus-next-sekai-editor) | MIT |
| [pjsekai/scores](https://gitlab.com/pjsekai/scores) | [MIT License](https://gitlab.com/pjsekai/scores/-/blob/main/LICENSE?ref_type=heads) |
