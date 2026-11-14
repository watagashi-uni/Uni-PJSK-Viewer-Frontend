<script setup lang="ts">
import { computed } from 'vue'
import { Code, ExternalLink, Github, Heart, Languages, MessageSquareWarning, Scale } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { characterSdUrl } from '@/utils/units'

const settingsStore = useSettingsStore()
const assetsHost = computed(() => settingsStore.assetsHost)

/** 页头那一排 Q 版小人：初音未来和五个团体各一位 */
const mascotIds = [1, 5, 21, 9, 13, 17]

const techStack = ['Vue 3', 'TypeScript', 'Vite', 'Tailwind CSS', 'daisyUI', 'Pinia', 'WebAssembly']

interface Credit {
  name: string
  /** 在本站里用来做什么 */
  role: string
  description?: string
  author?: string
  license?: string
  links: { label: string; href: string }[]
  /** 协议要求随附的版权声明全文 */
  notice?: string
}

const credits: Credit[] = [
  {
    name: 'Sekai Viewer',
    role: '项目参考',
    license: 'GPL-3.0',
    links: [
      { label: 'GitHub', href: 'https://github.com/Sekai-World/sekai-viewer' },
      { label: 'GPL-3.0 全文', href: 'https://www.gnu.org/licenses/gpl-3.0.html' },
    ],
  },
  {
    name: 'pjsekai.scores',
    role: 'SUS 转图片核心算法',
    license: 'MIT',
    links: [{ label: '项目地址', href: 'https://gitlab.com/pjsekai/scores' }],
    notice: `MIT License
Copyright (c) 2023 pjsekai.moe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  },
  {
    name: 'Sekai SUS Parser',
    role: 'SUS 转 JSON（WebAssembly）',
    description: '谱面转图片前使用其 C++17 解析器将 SUS 转为 JSON，再交给前端渲染器绘制。上游通过 Emscripten 构建，产出成对的 sus_to_json_wasm.js 加载胶水与 sus_to_json_wasm.wasm 二进制；本站的 TypeScript 包装层负责动态加载并调用导出函数。',
    license: 'MIT',
    links: [
      { label: 'GitHub', href: 'https://github.com/watagashi-uni/Sekai-SUS-Parser' },
      { label: 'MIT License', href: 'https://github.com/watagashi-uni/Sekai-SUS-Parser/blob/main/LICENSE' },
    ],
  },
  {
    name: 'MikuMikuWorld',
    role: 'JSON 转 SUS',
    description: 'JSON 转 SUS 功能基于修改后的 MikuMikuWorld 导出器：从导出器中提取转换部分，再通过 Emscripten 构建为 json_to_sus_wasm.js 加载胶水与 json_to_sus_wasm.wasm 二进制。修改后的导出器源码未公开；原项目采用 MIT 协议。',
    license: 'MIT',
    links: [
      { label: 'GitHub 原项目', href: 'https://github.com/Sekai-World/MikuMikuWorld' },
      { label: 'MIT License', href: 'https://github.com/Sekai-World/MikuMikuWorld/blob/master/LICENSE' },
    ],
  },
  {
    name: 'Haruki 3D Exporter',
    role: '衣装 3D 预览',
    description: '衣装 3D 预览所用运行时资源由该项目离线导出。它将 Unity AssetBundle 转换为适合浏览器加载的 Brotli 压缩 MessagePack 运行时包，再由本站内置的 Haruki 3D Engine 构建文件加载与渲染。',
    author: 'storyxy3',
    license: 'MIT',
    links: [
      { label: 'GitHub', href: 'https://github.com/Team-Haruki/Haruki-3D-Exporter' },
      { label: 'MIT License', href: 'https://github.com/Team-Haruki/Haruki-3D-Exporter/blob/main/LICENSE' },
    ],
  },
  {
    name: 'sekai-scenario-player',
    role: '剧情播放',
    description: '剧情场景模式由该项目驱动，在浏览器中还原游戏的剧情播放器，负责 Live2D 演出与角色语音的播放。',
    author: 'Haruki Dev Team',
    license: 'MIT',
    links: [
      { label: 'GitHub', href: 'https://github.com/Team-Haruki/sekai-scenario-player' },
      { label: 'MIT License', href: 'https://github.com/Team-Haruki/sekai-scenario-player/blob/main/LICENSE' },
    ],
  },
  {
    name: 'sekai-calculator',
    role: '活动分数计算',
    license: 'LGPL-2.1',
    links: [
      { label: 'GitHub', href: 'https://github.com/xfl03/sekai-calculator' },
      { label: 'LGPL-2.1 全文', href: 'https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html' },
    ],
  },
  {
    name: '33KitFrontend',
    role: '项目参考',
    links: [{ label: 'GitHub', href: 'https://github.com/xfl03/33KitFrontend' }],
  },
  {
    name: 'lunabot',
    role: '项目参考',
    license: 'MIT',
    links: [
      { label: 'GitHub', href: 'https://github.com/NeuraXmy/lunabot' },
      { label: 'MIT License', href: 'https://github.com/NeuraXmy/lunabot/blob/master/LICENSE' },
    ],
  },
]
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <!-- 页头：站名、一句介绍，旁边站一排 Q 版小人 -->
    <header class="about-head panel">
      <div class="about-head__text">
        <p class="app-brand">
          <span class="app-brand__mark" aria-hidden="true"><i></i><i></i></span>
          <span class="app-brand__sub">关于</span>
        </p>
        <h1 class="about-head__title">Uni PJSK Viewer</h1>
        <p class="about-head__lead">Project SEKAI 游戏资料查看与工具站：歌曲、卡片、活动、剧情，还有组队、谱面和衣装这些小工具。</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <a href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm gap-2">
            <Github class="h-4 w-4" /> 查看源码
          </a>
          <a href="https://paratranz.cn/projects/18073" target="_blank" rel="noopener noreferrer" class="btn btn-sm gap-2">
            <Languages class="h-4 w-4" /> 贡献翻译
          </a>
        </div>
      </div>
      <div class="about-head__mascots" aria-hidden="true">
        <img
          v-for="id in mascotIds"
          :key="id"
          :src="characterSdUrl(id, assetsHost)"
          alt=""
          loading="lazy"
          crossorigin="anonymous"
        />
      </div>
    </header>

    <!-- 三件事：谁做的、怎么参与开发、怎么参与翻译 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <section class="panel about-card">
        <h2 class="about-card__title"><Code class="h-4 w-4 text-primary" /> 开发者</h2>
        <p class="about-card__body">
          <a href="https://space.bilibili.com/622551112" target="_blank" rel="noopener noreferrer" class="text-lg font-bold hover:text-primary">綿菓子ウニ</a>
        </p>
        <p class="about-card__note">有问题或建议，可以在 B 站私信，或者到 GitHub 提 Issue。</p>
        <div class="about-card__links">
          <a href="https://space.bilibili.com/622551112" target="_blank" rel="noopener noreferrer" class="about-link">bilibili <ExternalLink class="h-3 w-3" /></a>
        </div>
      </section>

      <section class="panel about-card">
        <h2 class="about-card__title"><Heart class="h-4 w-4 text-secondary" /> 参与开发</h2>
        <p class="about-card__note">前端开源，欢迎提交 Issue 或 Pull Request。界面改动请在 PR 里附上截图。</p>
        <div class="about-card__links">
          <a href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend/issues" target="_blank" rel="noopener noreferrer" class="about-link"><MessageSquareWarning class="h-3.5 w-3.5" /> 提交 Issue <ExternalLink class="h-3 w-3" /></a>
          <a href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend/pulls" target="_blank" rel="noopener noreferrer" class="about-link">Pull Requests <ExternalLink class="h-3 w-3" /></a>
        </div>
      </section>

      <section class="panel about-card">
        <h2 class="about-card__title"><Languages class="h-4 w-4 text-accent" /> 参与翻译</h2>
        <p class="about-card__note">歌曲标题的中文翻译由社区贡献者在 ParaTranz 上协作完成，欢迎一起补上还没有中文名的歌曲。</p>
        <div class="about-card__links">
          <a href="https://paratranz.cn/projects/18073" target="_blank" rel="noopener noreferrer" class="about-link">前往 ParaTranz <ExternalLink class="h-3 w-3" /></a>
        </div>
      </section>
    </div>

    <!-- 技术栈 -->
    <section class="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <h2 class="text-sm font-bold">技术栈</h2>
      <ul class="flex flex-wrap gap-1.5">
        <li v-for="item in techStack" :key="item" class="about-tech">{{ item }}</li>
      </ul>
    </section>

    <!-- 开源协议与致谢 -->
    <section class="panel">
      <header class="border-b border-base-300 px-4 py-3 sm:px-5">
        <h2 class="section-title"><Scale class="h-4 w-4 text-primary" /> 开源协议与致谢</h2>
        <p class="mt-1 text-sm text-base-content/60">本项目基于 <strong class="text-base-content">GPL-3.0</strong> 协议开源，用到或参考了下面这些项目。</p>
      </header>
      <ul class="divide-y divide-base-300">
        <li v-for="credit in credits" :key="credit.name" class="about-credit">
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span class="font-semibold">{{ credit.name }}</span>
              <span class="text-sm text-base-content/55">{{ credit.role }}</span>
            </p>
            <p v-if="credit.description" class="mt-1 text-sm leading-6 text-base-content/65">{{ credit.description }}</p>
            <p v-if="credit.author" class="mt-1 text-xs text-base-content/55">作者：<strong class="text-base-content/80">{{ credit.author }}</strong></p>
            <details v-if="credit.notice" class="mt-2">
              <summary class="cursor-pointer text-xs font-medium text-primary">查看 MIT License 全文</summary>
              <pre class="mt-2 overflow-x-auto whitespace-pre-wrap rounded-field bg-base-200 p-3 text-xs leading-5">{{ credit.notice }}</pre>
            </details>
          </div>
          <div class="about-credit__side">
            <span v-if="credit.license" class="about-license">{{ credit.license }}</span>
            <a v-for="link in credit.links" :key="link.href" :href="link.href" target="_blank" rel="noopener noreferrer" class="about-link">
              {{ link.label }} <ExternalLink class="h-3 w-3" />
            </a>
          </div>
        </li>
      </ul>
    </section>

    <p class="px-1 text-xs leading-5 text-base-content/50">
      本站仅用于学习交流，所有资源版权归版权者所有。
    </p>
  </div>
</template>

<style scoped>
.about-head {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.25rem 0;
  overflow: hidden;
}

.about-head__text {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.about-head__title {
  margin-top: 0.375rem;
  font-size: 1.875rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.about-head__lead {
  max-width: 34rem;
  margin-top: 0.5rem;
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
  font-size: 0.9375rem;
  line-height: 1.7;
}

/* 小人站在页头底边上，稍微互相挡一点 */
.about-head__mascots {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-top: 0.25rem;
}

.about-head__mascots img {
  width: 16.6%;
  max-width: 6.5rem;
  height: auto;
  margin: 0 -0.25rem;
}

@media (min-width: 768px) {
  .about-head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    padding: 1.75rem 1.75rem 0;
  }

  .about-head__text {
    padding-bottom: 1.75rem;
  }

  .about-head__title {
    font-size: 2.5rem;
  }

  .about-head__mascots {
    flex: none;
    width: 46%;
    justify-content: flex-end;
  }

  .about-head__mascots img {
    max-width: 7rem;
  }
}

.about-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.125rem;
}

.about-card__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
}

.about-card__note {
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
  font-size: 0.875rem;
  line-height: 1.65;
}

.about-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-top: auto;
  padding-top: 0.375rem;
}

.about-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-primary);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.about-link:hover {
  text-decoration: underline;
}

.about-tech {
  padding: 0.125rem 0.625rem;
  border: 1px solid var(--color-base-300);
  border-radius: 999px;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  font-size: 0.8125rem;
}

.about-credit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
}

.about-credit__side {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.875rem;
}

@media (min-width: 640px) {
  .about-credit {
    flex-direction: row;
    align-items: flex-start;
    gap: 1.5rem;
    padding: 0.875rem 1.25rem;
  }

  .about-credit__side {
    max-width: 45%;
    justify-content: flex-end;
    padding-top: 0.125rem;
  }
}

.about-license {
  padding: 0.0625rem 0.5rem;
  border-radius: 999px;
  background-color: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  font-family: var(--font-display);
  font-size: 0.6875rem;
  font-weight: 600;
}
</style>
