<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Play, Trash2, ExternalLink, Download } from 'lucide-vue-next'
import apiClient from '@/api/client'
import {
  renderSusToPng,
  renderSusToSvg,
  revokeSus2ImgResult,
  type Sus2ImgFrontendResult,
  type Sus2ImgSkin,
} from '@/utils/sus2img'

const FORM_STORAGE_KEY = 'sus2img-form-data'

type RenderEngine = 'frontend' | 'backend'
type RenderFormat = 'svg' | 'png'

type BackendResult = {
  source: 'backend'
  format: RenderFormat
  url: string
}

const form = ref({
  chart: '',
  rebase: '',
  title: '',
  artist: '',
  author: '',
  difficulty: '',
  playlevel: '',
  pixel: '240',
  format: 'svg' as RenderFormat,
  skin: 'custom01' as Sus2ImgSkin,
  engine: 'frontend' as RenderEngine,
})

const chartFile = ref<File | null>(null)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const infoMessage = ref<string | null>(null)

const resultData = ref<string | null>(null)
const resultFormat = ref<RenderFormat>('svg')
const resultSource = ref<'frontend' | 'backend' | null>(null)

let frontendResult: Sus2ImgFrontendResult | null = null

const resetFrontendResult = () => {
  if (frontendResult) {
    revokeSus2ImgResult(frontendResult)
    frontendResult = null
  }
}

const setResult = (result: Sus2ImgFrontendResult | BackendResult) => {
  resetFrontendResult()

  resultData.value = result.url
  resultFormat.value = result.format
  resultSource.value = result.source

  if (result.source === 'frontend') {
    frontendResult = result
  }
}

onMounted(() => {
  const saved = sessionStorage.getItem(FORM_STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(form.value, parsed)
    } catch {
      // ignore parse error
    }
  }
})

onBeforeUnmount(() => {
  resetFrontendResult()
})

watch(
  form,
  (newVal) => {
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newVal))
  },
  { deep: true },
)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    chartFile.value = target.files[0]
  }
}

function showGeneratingHint(previewTab: Window | null) {
  if (!previewTab || previewTab.closed) return

  try {
    previewTab.document.title = '正在生成谱面预览...'
    previewTab.document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="text-align:center;">
          <div style="font-size:22px;font-weight:700;margin-bottom:10px;">正在生成谱面预览</div>
          <div style="font-size:14px;opacity:.8;">请稍候，生成完成后将自动跳转...</div>
        </div>
      </div>
    `
  } catch {
    // ignore cross-origin / document write issues
  }
}

async function getChartText(): Promise<string> {
  if (form.value.chart.trim()) {
    return form.value.chart
  }

  if (chartFile.value) {
    return await chartFile.value.text()
  }

  throw new Error('请提供 SUS 文件内容或上传文件')
}

function buildBackendFormData(chartText: string): FormData {
  const formData = new FormData()
  formData.append('chart', chartText)
  formData.append('rebase', form.value.rebase)
  formData.append('title', form.value.title)
  formData.append('artist', form.value.artist)
  formData.append('author', form.value.author)
  formData.append('difficulty', form.value.difficulty)
  formData.append('playlevel', form.value.playlevel)
  formData.append('pixel', form.value.pixel)
  formData.append('form', form.value.format)
  formData.append('skin', form.value.skin)
  return formData
}

async function renderViaBackend(chartText: string): Promise<BackendResult> {
  const response = await apiClient.post('/api/sus2img', buildBackendFormData(chartText), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 100000,
  })

  const result = response.data
  if (!result.success) {
    throw new Error(result.error || '转换失败')
  }

  return {
    source: 'backend',
    format: result.format,
    url: result.url,
  }
}

async function renderViaFrontend(chartText: string): Promise<Sus2ImgFrontendResult> {
  const input = {
    sus: chartText,
    rebase: form.value.rebase,
    title: form.value.title,
    artist: form.value.artist,
    author: form.value.author,
    difficulty: form.value.difficulty,
    playlevel: form.value.playlevel,
    pixel: form.value.pixel,
    skin: form.value.skin,
  }

  if (form.value.format === 'png') {
    return await renderSusToPng(input)
  }

  return await renderSusToSvg(input)
}

async function handleSubmit() {
  isSubmitting.value = true
  error.value = null
  infoMessage.value = null
  const previewTab = window.open('', '_blank')
  showGeneratingHint(previewTab)

  try {
    const chartText = await getChartText()

    if (form.value.engine === 'backend') {
      const backendResult = await renderViaBackend(chartText)
      setResult(backendResult)
      if (previewTab && !previewTab.closed) {
        previewTab.location.href = backendResult.url
      } else {
        window.open(backendResult.url, '_blank')
      }
      return
    }

    try {
      const frontend = await renderViaFrontend(chartText)
      setResult(frontend)
      if (previewTab && !previewTab.closed) {
        previewTab.location.href = frontend.url
      } else {
        window.open(frontend.url, '_blank')
      }
    } catch (frontendError) {
      const frontendMessage = frontendError instanceof Error ? frontendError.message : '前端转换失败'
      const backendResult = await renderViaBackend(chartText)
      setResult(backendResult)
      infoMessage.value = `前端转换失败，已自动回退后端：${frontendMessage}`
      if (previewTab && !previewTab.closed) {
        previewTab.location.href = backendResult.url
      } else {
        window.open(backendResult.url, '_blank')
      }
    }
  } catch (e) {
    if (previewTab && !previewTab.closed) {
      previewTab.close()
    }
    error.value = e instanceof Error ? e.message : '转换失败'
  } finally {
    isSubmitting.value = false
  }
}

function clearForm() {
  form.value = {
    chart: '',
    rebase: '',
    title: '',
    artist: '',
    author: '',
    difficulty: '',
    playlevel: '',
    pixel: '240',
    format: 'svg',
    skin: 'custom01',
    engine: 'frontend',
  }

  chartFile.value = null
  error.value = null
  infoMessage.value = null
  resultData.value = null
  resultSource.value = null
  resetFrontendResult()
  sessionStorage.removeItem(FORM_STORAGE_KEY)
}

function openInNewTab() {
  if (!resultData.value) return
  window.open(resultData.value, '_blank')
}

function downloadResult() {
  if (!resultData.value) return

  const link = document.createElement('a')
  link.href = resultData.value
  link.download = `chart.${resultFormat.value}`
  link.rel = 'noopener'
  link.click()
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-center text-primary mb-2">SUS 谱面转图片</h1>
    <p class="text-center text-base-content/60 text-sm mb-6">粘贴SUS 和 上传文件 二选一即可</p>

    <div class="card bg-base-100 shadow-lg animate-fade-in-up">
      <div class="card-body">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">SUS 内容</span>
              </label>
              <textarea
                v-model="form.chart"
                class="textarea textarea-bordered h-40 font-mono text-sm w-full"
                placeholder="在此粘贴 SUS 文件内容"
              ></textarea>
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">rebase.json 内容（可选）</span>
              </label>
              <textarea
                v-model="form.rebase"
                class="textarea textarea-bordered h-40 font-mono text-sm w-full"
                placeholder="在此粘贴 rebase.json 内容"
              ></textarea>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">歌曲标题（可省略）</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                class="input input-bordered w-full"
                placeholder="歌曲标题"
              />
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">作曲作词编曲（可省略）</span>
              </label>
              <input
                v-model="form.artist"
                type="text"
                class="input input-bordered w-full"
                placeholder="作曲作词编曲"
              />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">谱面作者（可省略）</span>
              </label>
              <input
                v-model="form.author"
                type="text"
                class="input input-bordered w-full"
                placeholder="谱面作者"
              />
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">难度（可省略）</span>
              </label>
              <input
                v-model="form.difficulty"
                type="text"
                class="input input-bordered w-full"
                placeholder="难度"
              />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">定数（可省略）</span>
              </label>
              <input
                v-model="form.playlevel"
                type="text"
                class="input input-bordered w-full"
                placeholder="定数"
              />
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">每秒长度（默认240）</span>
              </label>
              <input
                v-model="form.pixel"
                type="text"
                class="input input-bordered w-full"
                placeholder="每秒长度"
              />
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">输出格式</span>
              </label>
              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2">
                  <input v-model="form.format" type="radio" value="svg" class="radio radio-primary" />
                  <span class="label-text">SVG</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input v-model="form.format" type="radio" value="png" class="radio radio-primary" />
                  <span class="label-text">PNG</span>
                </label>
              </div>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">皮肤</span>
              </label>
              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2">
                  <input v-model="form.skin" type="radio" value="custom01" class="radio radio-primary" />
                  <span class="label-text">默认</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input v-model="form.skin" type="radio" value="custom02" class="radio radio-primary" />
                  <span class="label-text">3周年新增</span>
                </label>
              </div>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">生成引擎</span>
              </label>
              <div class="flex gap-4 flex-wrap">
                <label class="label cursor-pointer gap-2">
                  <input v-model="form.engine" type="radio" value="frontend" class="radio radio-primary" />
                  <span class="label-text">前端（极速）</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input v-model="form.engine" type="radio" value="backend" class="radio radio-primary" />
                  <span class="label-text">后端（兼容）</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">上传 SUS 文件（可选，和上方SUS二选一即可）</span>
            </label>
            <input
              type="file"
              class="file-input file-input-bordered w-full"
              accept=".sus,.txt"
              @change="handleFileChange"
            />
          </div>

          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>

          <div v-if="infoMessage" class="alert alert-info">
            <span>{{ infoMessage }}</span>
          </div>

          <div class="flex justify-center gap-4">
            <button type="button" class="btn btn-outline btn-error" @click="clearForm">
              <Trash2 class="w-4 h-4" />
              清空
            </button>
            <button type="submit" class="btn btn-primary btn-wide" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              <Play v-else class="w-4 h-4" />
              {{ isSubmitting ? '转换中...' : '开始转换' }}
            </button>
          </div>

          <div v-if="resultData" class="alert alert-success mt-6">
            <div class="flex flex-col sm:flex-row gap-4 w-full items-center justify-between">
              <span class="font-medium">
                ✓ 转换完成！
                <span v-if="resultSource === 'frontend'" class="text-success">（前端）</span>
                <span v-else-if="resultSource === 'backend'" class="text-warning">（后端）</span>
              </span>
              <div class="flex gap-2 flex-wrap justify-center">
                <button class="btn btn-sm btn-primary" @click="openInNewTab">
                  <ExternalLink class="w-4 h-4" />
                  打开预览
                </button>
                <button class="btn btn-sm btn-success" @click="downloadResult">
                  <Download class="w-4 h-4" />
                  下载
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <footer class="text-center text-sm text-base-content/60 mt-8 space-y-2">
      <p>如浏览器无法保存 PNG，请直接拖动到桌面保存。</p>
      <p>
        模块修改自
        <a href="https://gitlab.com/pjsekai/musics" target="_blank" class="link link-primary">pjsekai/musics</a>
      </p>
    </footer>
  </div>
</template>
