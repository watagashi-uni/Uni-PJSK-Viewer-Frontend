# 剧情播放器与私人预览

`/stories` 沿用原活动、主线目录，增加卡面故事和特别篇。场景模式按剧本 Snippets
的台词顺序读取背景、地点和 BGM，显示角色的静态透明插图及头像，支持逐句语音、
自动前进、倍速、跳句、全文搜索、上一话/下一话和浏览器本地进度。
点击播放才发声；退出阅读器、切换文本模式或把页面放到后台都会停止播放。
没有语音或暂缺图片时继续显示文字，不依赖 Live2D。

这不是游戏演出的逐帧复刻：插图不跟随服装、表情或动作，转场特效和剧情音效暂未还原；
游戏原文不会自动翻译，阅读状态不写回游戏账号。

新增画廊展示 1,335 个背景、68 张正式单格漫画和 708 首剧情 BGM。
这里只提交路径索引；图片与音频按需从日本 R2 读取，she 的同步范围不变。
索引基于 2026-09-12 R2 审计；新剧本和常规新背景/BGM 路径能直接读取，
画廊列表、特别篇可用章节和特殊路径新增项需要重建索引。
特别篇只展示已发布可读脚本的章节，不把仅有影片或尚未同步的条目当作可播放剧情：

```sh
node scripts/build-story-media-index.mjs ../runtime/r2-story-expansion-paths-20260912.tsv
node --test tests/storyPlayback.test.mjs
```

## 测试服

测试构建使用同源 master/API 代理，版本接口的 apiEndpoint 不会把测试页面带回跨域地址。
没有改线上 CORS；代理仅允许公共资料的 GET/HEAD，不转发用户凭据、Cookie 或写操作。
普通生产构建继续使用原动态 API 地址。

```sh
VITE_MASTER_API_BASE_URL=/preview-master \
VITE_API_BASE_URL=/preview-api VITE_API_ENDPOINT_FIXED=1 \
npm run build -- --outDir dist-story-preview

node scripts/story-preview.mjs
# http://127.0.0.1:4175/stories
```

日本测试服绑定 Tailscale 地址 `100.77.199.74:4175`，需要手机接入同一个 tailnet：

- 目录：`http://100.77.199.74:4175/stories`
- 活动演示：`http://100.77.199.74:4175/stories?story=1&episode=1000001`
- 卡面演示：`http://100.77.199.74:4175/stories?tab=card&story=1&episode=1`
- 画廊：`http://100.77.199.74:4175/stories?tab=gallery`

独立部署目录 `/data/watagashi/sekai-story-preview/current`，使用
`scripts/systemd/sekai-story-preview.service`。不替换正式站点，不重启 asset updater。
停止预览：`systemctl disable --now sekai-story-preview.service`。
HTTP 测试地址下部分手机浏览器不开放剪贴板，仍可使用全文模式选择文本。
