<script setup lang="ts">
import { 
  Music, Code, Wrench, ExternalLink, Github, Heart, Languages 
} from 'lucide-vue-next'
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="card bg-base-100 shadow-lg mb-6 animate-fade-in-up">
      <div class="card-body text-center">
        <h1 class="text-3xl font-bold text-primary mb-2">关于 Uni PJSK Viewer</h1>
        <p class="text-base-content/60">探索 Project SEKAI 的精彩世界</p>
      </div>
    </div>

    <!-- <AlertBanner type="warning">
      <strong class="flex items-center gap-1"><AlertTriangle class="w-4 h-4" /> 内测中！</strong> 该网站还在内部测试中，出现问题请及时反馈
    </AlertBanner> -->

    <!-- 开发者信息 -->
    <div class="card bg-base-100 shadow-lg mb-6 animate-fade-in-up animation-delay-100">
      <div class="card-body">
        <h3 class="card-title text-lg flex items-center gap-2">
          <Music class="w-5 h-5 text-primary" /> 开发团队
        </h3>
        <ul class="mt-4 space-y-3">
          <li class="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors">
            <Code class="w-5 h-5 text-secondary" />
            <span>
              开发者: 
              <a 
                href="https://space.bilibili.com/622551112" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link link-primary font-medium inline-flex items-center gap-1"
              >
                綿菓子ウニ
                <ExternalLink class="w-3 h-3" />
              </a>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 项目源码 & 参与开发 -->
    <div class="card bg-base-100 shadow-lg mb-6 animate-fade-in-up animation-delay-150">
      <div class="card-body">
        <h3 class="card-title text-lg flex items-center gap-2">
          <Github class="w-5 h-5 text-primary" /> 开源项目
        </h3>
        <p class="text-base-content/70 mt-2">
          本项目前端开源，欢迎参与开发、提交 Issue 或 Pull Request！
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <a 
            href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn btn-primary btn-sm gap-2"
          >
            <Github class="w-4 h-4" />
            查看源码
            <ExternalLink class="w-3 h-3" />
          </a>
          <a 
            href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm gap-2"
          >
            提交 Issue
            <ExternalLink class="w-3 h-3" />
          </a>
          <a 
            href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend/pulls" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm gap-2"
          >
            <Heart class="w-4 h-4" />
            加入开发
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>

    <!-- 参与翻译 -->
    <div class="card bg-base-100 shadow-lg mb-6 animate-fade-in-up animation-delay-200">
      <div class="card-body">
        <h3 class="card-title text-lg flex items-center gap-2">
          <Languages class="w-5 h-5 text-primary" /> 参与翻译
        </h3>
        <p class="text-base-content/70 mt-2">
          歌曲标题的中文翻译由社区贡献者在 ParaTranz 平台上协作完成。欢迎加入我们，帮助翻译还没有中文名的歌曲！
        </p>
        <div class="mt-4">
          <a 
            href="https://paratranz.cn/projects/18073" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn btn-secondary btn-sm gap-2"
          >
            <Languages class="w-4 h-4" />
            前往 ParaTranz 贡献翻译
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>


    <!-- 技术栈 -->
    <div class="card bg-base-100 shadow-lg mt-6 animate-fade-in-up animation-delay-300">
      <div class="card-body">
        <h3 class="card-title text-lg flex items-center gap-2">
          <Wrench class="w-5 h-5 text-primary" /> 本网站使用以下技术栈重写
        </h3>
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="badge badge-primary badge-outline">Vue 3</span>
          <span class="badge badge-primary badge-outline">TypeScript</span>
          <span class="badge badge-primary badge-outline">Vite</span>
          <span class="badge badge-primary badge-outline">Tailwind CSS</span>
          <span class="badge badge-primary badge-outline">DaisyUI</span>
        </div>
        <p class="text-xs text-base-content/50 mt-4">
          本站仅用于学习交流，所有资源版权归版权者所有。
        </p>
      </div>
    </div>

    <!-- 开源协议 -->
    <div class="card bg-base-100 shadow-lg mt-6 animate-fade-in-up animation-delay-400">
      <div class="card-body">
        <h3 class="card-title text-lg flex items-center gap-2">
          <Code class="w-5 h-5 text-primary" /> 开源协议
        </h3>
        <p class="text-sm text-base-content/60 mt-2">
          本项目基于 <strong>GPL-3.0</strong> 协议开源。
        </p>
        <div class="mt-3 space-y-2">
          <!-- 本项目 GPL-3.0 -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              Sekai Viewer (本项目参考)
            </div>
            <div class="collapse-content">
              <p class="text-sm text-base-content/70 mb-2">
                本项目使用了
                <a 
                  href="https://github.com/Sekai-World/sekai-viewer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  Sekai-World/sekai-viewer
                  <ExternalLink class="w-3 h-3" />
                </a>
                的开源代码，该项目采用 GPL-3.0 协议，因此本项目同样遵循 GPL-3.0 协议。
              </p>
              <p class="text-sm text-base-content/70">
                协议全文请参阅：
                <a 
                  href="https://www.gnu.org/licenses/gpl-3.0.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GNU General Public License v3.0
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <!-- Sonolus -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              Sonolus Next SEKAI Editor (谱面播放预览)
            </div>
            <div class="collapse-content">
              <p class="text-sm text-base-content/70 mb-2">
                <a 
                  href="https://github.com/Next-SEKAI/sonolus-next-sekai-editor" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
              <pre class="text-xs bg-base-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">MIT License

Copyright (c) 2025 NonSpicyBurrito

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
SOFTWARE.</pre>
            </div>
          </div>
          <!-- sekai-calculator -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              sekai-calculator (活动分数计算)
            </div>
            <div class="collapse-content">
              <p class="text-sm text-base-content/70 mb-2">
                <a 
                  href="https://github.com/xfl03/sekai-calculator" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
              <p class="text-sm text-base-content/70">
                协议：
                <a 
                  href="https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  LGPL-2.1 License
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <!-- 33KitFrontend -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              33KitFrontend
            </div>
            <div class="collapse-content">
              <p class="text-sm text-base-content/70">
                <a 
                  href="https://github.com/xfl03/33KitFrontend" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

