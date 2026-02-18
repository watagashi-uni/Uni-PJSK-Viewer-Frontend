# Uni PJSK Viewer Frontend

> 🎵一个用于浏览 Project SEKAI 游戏资源的 Web 应用前端。

## ✨ 功能特性

- 📋 **卡牌浏览** — 查看所有角色卡牌详情
- 🎶 **曲目列表** — 浏览完整曲库信息，支持分类筛选
- 🎵 **谱面预览** — 在线预览游戏谱面
- 📊 **活动信息** — 查看活动详情与排名数据
- 📱 **PWA 支持** — 可安装为本地应用，支持离线缓存


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
