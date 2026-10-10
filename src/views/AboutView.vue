<script setup lang="ts">
import { 
  Music, Code, Wrench, ExternalLink, Github, Heart, Languages
} from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-3xl font-bold">关于 Uni PJSK Viewer</h1>
      <p class="text-sm text-base-content/60 mt-1">Project SEKAI 游戏资料查看与工具站</p>
    </div>

    <!-- <AlertBanner type="warning">
      <strong class="flex items-center gap-1"><AlertTriangle class="w-4 h-4" /> 内测中！</strong> 该网站还在内部测试中，出现问题请及时反馈
    </AlertBanner> -->

    <!-- 开发者信息 -->
    <div class="card bg-base-100 shadow-lg">
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
    <div class="card bg-base-100 shadow-lg">
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
    <div class="card bg-base-100 shadow-lg">
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
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <h3 class="card-title text-lg flex items-center gap-2">
          <Wrench class="w-5 h-5 text-primary" /> 技术栈
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
    <div class="card bg-base-100 shadow-lg">
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
                <a 
                  href="https://github.com/Sekai-World/sekai-viewer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
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
          <!-- pjsekai.scores -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              pjsekai.scores (SUS 转图片核心算法)
            </div>
            <div class="collapse-content">
              <p class="text-sm text-base-content/70 mb-2">
                <a
                  href="https://gitlab.com/pjsekai/scores"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
              <pre class="text-xs bg-base-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">MIT License

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
SOFTWARE.</pre>
            </div>
          </div>
          <!-- Sekai SUS Parser -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              Sekai SUS Parser（SUS 转 JSON WebAssembly）
            </div>
            <div class="collapse-content space-y-2">
              <p class="text-sm text-base-content/70">
                谱面转图片前使用其 C++17 解析器将 SUS 转为 JSON，再交给前端渲染器绘制。
                上游通过 Emscripten 构建，产出成对的
                <code class="text-xs">sus_to_json_wasm.js</code> 加载胶水与
                <code class="text-xs">sus_to_json_wasm.wasm</code> 二进制；本站的
                TypeScript 包装层负责动态加载并调用导出函数。
              </p>
              <p class="text-sm text-base-content/70">
                <a
                  href="https://github.com/watagashi-uni/Sekai-SUS-Parser"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
                ·
                <a
                  href="https://github.com/watagashi-uni/Sekai-SUS-Parser/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  MIT License
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <!-- MikuMikuWorld -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              MikuMikuWorld（JSON 转 SUS）
            </div>
            <div class="collapse-content space-y-2">
              <p class="text-sm text-base-content/70">
                JSON 转 SUS 功能基于修改后的 MikuMikuWorld 导出器：从导出器中提取转换部分，
                再通过 Emscripten 构建为
                <code class="text-xs">json_to_sus_wasm.js</code> 加载胶水与
                <code class="text-xs">json_to_sus_wasm.wasm</code> 二进制。
                修改后的导出器源码未公开；原项目采用 MIT 协议。
              </p>
              <p class="text-sm text-base-content/70">
                <a
                  href="https://github.com/Sekai-World/MikuMikuWorld"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 原项目
                  <ExternalLink class="w-3 h-3" />
                </a>
                ·
                <a
                  href="https://github.com/Sekai-World/MikuMikuWorld/blob/master/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  MIT License
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <!-- Haruki 3D Exporter -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              Haruki 3D Exporter（衣装 3D 预览）
            </div>
            <div class="collapse-content space-y-2">
              <p class="text-sm text-base-content/70">
                衣装 3D 预览所用运行时资源由该项目离线导出。它将 Unity AssetBundle
                转换为适合浏览器加载的 Brotli 压缩 MessagePack 运行时包，再由本站内置的
                Haruki 3D Engine 构建文件加载与渲染。
              </p>
              <p class="text-sm text-base-content/70">
                作者：<strong>storyxy3</strong> · MIT License
              </p>
              <p class="text-sm text-base-content/70">
                <a
                  href="https://github.com/Team-Haruki/Haruki-3D-Exporter"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
                ·
                <a
                  href="https://github.com/Team-Haruki/Haruki-3D-Exporter/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  MIT License
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
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
          <!-- lunabot -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
              lunabot
            </div>
            <div class="collapse-content">
              <p class="text-sm text-base-content/70 mb-2">
                <a
                  href="https://github.com/NeuraXmy/lunabot"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  GitHub 项目地址
                  <ExternalLink class="w-3 h-3" />
                </a>
              </p>
              <p class="text-sm text-base-content/70">
                协议全文请参阅：
                <a
                  href="https://github.com/NeuraXmy/lunabot/blob/master/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary inline-flex items-center gap-1"
                >
                  LICENSE
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
