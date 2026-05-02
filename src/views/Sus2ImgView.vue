<script setup lang="ts">
import { computed, nextTick, ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Play, Search, Trash2 } from 'lucide-vue-next'
import apiClient from '@/api/client'
import {
  renderSusToPng,
  renderSusToSvg,
  revokeSus2ImgResult,
  type Sus2ImgFrontendResult,
  type Sus2ImgSkin,
} from '@/vendor/sekai-sus2img'
import {
  analyzeSusConflicts,
  annotateSvgWithConflict,
  buildRenderOverlayContext,
  type ConflictDiagnostic,
} from '@/utils/susConflictAudit'

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
  bottomLeftImageUrl: '',
})

const chartFile = ref<File | null>(null)
const bottomLeftImageFile = ref<File | null>(null)
const bottomLeftImageDataUrl = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const infoMessage = ref<string | null>(null)
const auditError = ref<string | null>(null)
const isAnalyzing = ref(false)
const hasAuditRun = ref(false)
const isPreparingPreview = ref(false)

const resultData = ref<string | null>(null)
const resultFormat = ref<RenderFormat>('svg')
const resultSource = ref<'frontend' | 'backend' | null>(null)
const resultSvgText = ref<string | null>(null)
const resultSvgError = ref<string | null>(null)
const renderedChartText = ref('')
const renderedRebaseText = ref('')
const analyzedChartText = ref('')
const analyzedRebaseText = ref('')
const diagnostics = ref<ConflictDiagnostic[]>([])
const selectedConflictId = ref<string | null>(null)
const svgPreviewContainer = ref<HTMLDivElement | null>(null)

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
  resultSvgText.value = result.source === 'frontend' && result.format === 'svg' ? result.svgText : null
  resultSvgError.value = null

  if (result.source === 'frontend') {
    frontendResult = result
  }
}

const selectedConflict = computed(() =>
  diagnostics.value.find((item) => item.id === selectedConflictId.value) ?? null,
)

const isHighlightReady = computed(
  () =>
    Boolean(resultSvgText.value)
    && renderedChartText.value === analyzedChartText.value
    && renderedRebaseText.value === analyzedRebaseText.value,
)

const renderOverlayState = computed(() => {
  if (!resultSvgText.value || !renderedChartText.value) {
    return {
      context: null,
      error: null,
    }
  }

  const pixelValue = Number(form.value.pixel)
  const timeHeight = Number.isFinite(pixelValue) && pixelValue > 0 ? Math.floor(pixelValue) : 240

  try {
    return {
      context: buildRenderOverlayContext(renderedChartText.value, renderedRebaseText.value, timeHeight),
      error: null,
    }
  } catch (overlayError) {
    return {
      context: null,
      error: overlayError instanceof Error ? overlayError.message : '无法生成定位预览',
    }
  }
})

const renderOverlayContext = computed(() => renderOverlayState.value.context)

const previewErrorMessage = computed(() => resultSvgError.value ?? renderOverlayState.value.error)

const annotatedSvgText = computed(() => {
  if (!resultSvgText.value) {
    return null
  }

  const context = renderOverlayContext.value
  if (!context) {
    return resultSvgText.value
  }

  return annotateSvgWithConflict(
    resultSvgText.value,
    context,
    isHighlightReady.value ? selectedConflict.value : null,
  )
})

const diagnosticSummaryText = computed(() => {
  if (!hasAuditRun.value) {
    return ''
  }
  if (!diagnostics.value.length) {
    return '未发现会导致本家预览崩溃，或会被本家预览的规则处理的冲突。'
  }

  const crashCount = diagnostics.value.filter((item) => item.severity === 'crash').length
  if (!crashCount) {
    return `共发现 ${diagnostics.value.length} 处会被本家预览的规则处理的重叠冲突。`
  }

  const dedupCount = diagnostics.value.length - crashCount
  if (!dedupCount) {
    return `共发现 ${crashCount} 处冲突，都会导致本家预览崩溃。`
  }

  return `共发现 ${diagnostics.value.length} 处冲突，其中 ${crashCount} 处会导致本家预览崩溃，另有 ${dedupCount} 处会被本家预览的规则处理。`
})

const crashDiagnosticCount = computed(
  () => diagnostics.value.filter((item) => item.severity === 'crash').length,
)

const dedupDiagnosticCount = computed(
  () => diagnostics.value.filter((item) => item.severity === 'dedup').length,
)

const scrollToSelectedConflict = async () => {
  await nextTick()

  const container = svgPreviewContainer.value
  if (!container) {
    return
  }

  const focus = container.querySelector<SVGGraphicsElement>('#sus-conflict-focus')
  if (!focus) {
    return
  }

  const containerRect = container.getBoundingClientRect()
  const focusRect = focus.getBoundingClientRect()
  const targetTop = container.scrollTop + (focusRect.top - containerRect.top) - (container.clientHeight / 2) + (focusRect.height / 2)
  const targetLeft = container.scrollLeft + (focusRect.left - containerRect.left) - (container.clientWidth / 2) + (focusRect.width / 2)

  container.scrollTo({
    top: Math.max(0, targetTop),
    left: Math.max(0, targetLeft),
    behavior: 'smooth',
  })
}

const selectConflict = async (conflictId: string) => {
  selectedConflictId.value = conflictId
  await scrollToSelectedConflict()
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

watch(
  [selectedConflictId, annotatedSvgText],
  () => {
    if (!selectedConflictId.value || !annotatedSvgText.value || !isHighlightReady.value) {
      return
    }
    void scrollToSelectedConflict()
  },
)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    chartFile.value = target.files[0]
  }
}

function handleBottomLeftImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    bottomLeftImageFile.value = null
    bottomLeftImageDataUrl.value = ''
    return
  }

  bottomLeftImageFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    bottomLeftImageDataUrl.value = String(reader.result ?? '')
  }
  reader.onerror = () => {
    bottomLeftImageDataUrl.value = ''
    error.value = '读取左下角图片失败'
  }
  reader.readAsDataURL(file)
}

function showGeneratingHint(previewTab: Window | null) {
  if (!previewTab || previewTab.closed) return

  try {
    previewTab.document.title = '正在生成谱面预览...'
    previewTab.document.documentElement.style.margin = '0'
    previewTab.document.documentElement.style.height = '100%'
    previewTab.document.body.style.margin = '0'
    previewTab.document.body.style.height = '100%'
    previewTab.document.body.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 20% 20%, #f8fafc 0%, #eef2ff 45%, #e2e8f0 100%);color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="width:min(92vw,520px);padding:clamp(18px,3vw,28px);border-radius:16px;background:#ffffffcc;backdrop-filter:blur(8px);box-shadow:0 16px 40px rgba(15,23,42,.12);border:1px solid #cbd5e1;text-align:center;">
          <div style="font-size:clamp(18px,2.4vw,24px);font-weight:700;letter-spacing:.01em;margin-bottom:8px;">正在生成谱面预览</div>
          <div style="font-size:clamp(13px,1.8vw,15px);color:#475569;">请稍候，生成完成后将自动跳转...</div>
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

async function runAudit(chartText: string) {
  isAnalyzing.value = true
  auditError.value = null

  try {
    const nextDiagnostics = analyzeSusConflicts(chartText)
    diagnostics.value = nextDiagnostics
    analyzedChartText.value = chartText
    analyzedRebaseText.value = form.value.rebase
    hasAuditRun.value = true

    if (nextDiagnostics.some((item) => item.id === selectedConflictId.value)) {
      return
    }
    selectedConflictId.value = nextDiagnostics[0]?.id ?? null
  } catch (auditReason) {
    diagnostics.value = []
    hasAuditRun.value = true
    selectedConflictId.value = null
    auditError.value = auditReason instanceof Error ? auditReason.message : 'note重叠检查失败'
  } finally {
    isAnalyzing.value = false
  }
}

async function handleAnalyze() {
  error.value = null
  infoMessage.value = null
  auditError.value = null

  try {
    const chartText = await getChartText()
    await runAudit(chartText)
    if (diagnostics.value.length) {
      await ensureSvgPreview(chartText)
      if (selectedConflictId.value) {
        await scrollToSelectedConflict()
      }
    }
  } catch (auditReason) {
    diagnostics.value = []
    hasAuditRun.value = false
    selectedConflictId.value = null
    auditError.value = auditReason instanceof Error ? auditReason.message : 'note重叠检查失败'
  }
}

function buildSvgBackendFormData(chartText: string): FormData {
  const formData = buildBackendFormData(chartText)
  formData.set('form', 'svg')
  return formData
}

async function renderSvgPreviewViaBackend(chartText: string): Promise<string> {
  const response = await apiClient.post('/api/sus2img', buildSvgBackendFormData(chartText), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 100000,
  })

  const result = response.data
  if (!result.success || !result.url) {
    throw new Error(result.error || '生成 SVG 预览失败')
  }

  const svgResponse = await fetch(result.url)
  if (!svgResponse.ok) {
    throw new Error(`载入 SVG 预览失败：HTTP ${svgResponse.status}`)
  }

  return await svgResponse.text()
}

async function ensureSvgPreview(chartText: string) {
  if (
    resultSvgText.value
    && renderedChartText.value === chartText
    && renderedRebaseText.value === form.value.rebase
  ) {
    return
  }

  resultSvgError.value = null
  isPreparingPreview.value = true

  try {
    const preview = await renderSusToSvg({
      sus: chartText,
      rebase: form.value.rebase,
      title: form.value.title,
      artist: form.value.artist,
      author: form.value.author,
      difficulty: form.value.difficulty,
      playlevel: form.value.playlevel,
      pixel: form.value.pixel,
      skin: form.value.skin,
      jacket: bottomLeftImageDataUrl.value || form.value.bottomLeftImageUrl.trim(),
    })

    resultSvgText.value = preview.svgText
    renderedChartText.value = chartText
    renderedRebaseText.value = form.value.rebase
    revokeSus2ImgResult(preview)
  } catch (previewError) {
    const frontendMessage = previewError instanceof Error ? previewError.message : '前端生成 SVG 预览失败'

    try {
      resultSvgText.value = await renderSvgPreviewViaBackend(chartText)
      renderedChartText.value = chartText
      renderedRebaseText.value = form.value.rebase
      resultSvgError.value = `前端预览失败，已自动回退后端：${frontendMessage}`
    } catch (backendError) {
      resultSvgText.value = null
      resultSvgError.value = backendError instanceof Error ? backendError.message : '生成 SVG 预览失败'
    }
  } finally {
    isPreparingPreview.value = false
  }
}

async function loadResultSvgText(result: BackendResult | Sus2ImgFrontendResult) {
  if (result.source === 'frontend') {
    resultSvgText.value = result.format === 'svg' ? result.svgText : null
    resultSvgError.value = null
    return
  }

  if (result.format !== 'svg') {
    resultSvgText.value = null
    resultSvgError.value = 'PNG 结果不支持在页面内高亮冲突。'
    return
  }

  try {
    const response = await fetch(result.url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    resultSvgText.value = await response.text()
    resultSvgError.value = null
  } catch (svgReason) {
    resultSvgText.value = null
    resultSvgError.value = svgReason instanceof Error ? `载入 SVG 预览失败：${svgReason.message}` : '载入 SVG 预览失败'
  }
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
  const bottomLeftImage = bottomLeftImageDataUrl.value || form.value.bottomLeftImageUrl.trim()
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
    jacket: bottomLeftImage,
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
    await runAudit(chartText)

    if (form.value.engine === 'backend') {
      const backendResult = await renderViaBackend(chartText)
      setResult(backendResult)
      renderedChartText.value = chartText
      renderedRebaseText.value = form.value.rebase
      await loadResultSvgText(backendResult)
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
      renderedChartText.value = chartText
      renderedRebaseText.value = form.value.rebase
      await loadResultSvgText(frontend)
      if (previewTab && !previewTab.closed) {
        previewTab.location.href = frontend.url
      } else {
        window.open(frontend.url, '_blank')
      }
    } catch (frontendError) {
      const frontendMessage = frontendError instanceof Error ? frontendError.message : '前端转换失败'
      const backendResult = await renderViaBackend(chartText)
      setResult(backendResult)
      renderedChartText.value = chartText
      renderedRebaseText.value = form.value.rebase
      await loadResultSvgText(backendResult)
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
    bottomLeftImageUrl: '',
  }

  chartFile.value = null
  bottomLeftImageFile.value = null
  bottomLeftImageDataUrl.value = ''
  error.value = null
  infoMessage.value = null
  auditError.value = null
  resultData.value = null
  resultSource.value = null
  resultSvgText.value = null
  resultSvgError.value = null
  renderedChartText.value = ''
  renderedRebaseText.value = ''
  analyzedChartText.value = ''
  analyzedRebaseText.value = ''
  diagnostics.value = []
  selectedConflictId.value = null
  hasAuditRun.value = false
  resetFrontendResult()
  sessionStorage.removeItem(FORM_STORAGE_KEY)
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

          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">左下角图片 URL（前端专用，可选）</span>
              </label>
              <input
                v-model="form.bottomLeftImageUrl"
                type="text"
                class="input input-bordered w-full"
                placeholder="可填 data/http/绝对路径"
              />
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">上传左下角图片（前端专用，可选）</span>
              </label>
              <input
                type="file"
                class="file-input file-input-bordered w-full"
                accept="image/*"
                @change="handleBottomLeftImageChange"
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
            <button type="button" class="btn btn-outline" :disabled="isAnalyzing || isSubmitting" @click="handleAnalyze">
              <span v-if="isAnalyzing" class="loading loading-spinner"></span>
              <Search v-else class="w-4 h-4" />
              {{ isAnalyzing ? 'note重叠检查中...' : 'note重叠检查' }}
            </button>
            <button type="submit" class="btn btn-primary btn-wide" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              <Play v-else class="w-4 h-4" />
              {{ isSubmitting ? '转换中...' : '开始转换' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="hasAuditRun || resultSvgText || auditError || resultSvgError" class="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section class="card bg-base-100 shadow-lg">
        <div class="card-body gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="card-title text-lg">note重叠检查结果</h2>
              <p class="text-sm text-base-content/60 mt-1">{{ diagnosticSummaryText }}</p>
            </div>
            <span v-if="diagnostics.length" class="badge badge-primary badge-outline">{{ diagnostics.length }}</span>
          </div>

          <div v-if="crashDiagnosticCount" class="alert alert-error">
            <span>发现 {{ crashDiagnosticCount }} 处会导致本家预览崩溃的写法，请优先处理。</span>
          </div>

          <div v-else-if="dedupDiagnosticCount" class="alert alert-warning">
            <span>发现 {{ dedupDiagnosticCount }} 处会被本家预览的规则去重或隐藏的冲突。</span>
          </div>

          <div v-if="auditError" class="alert alert-error">
            <span>{{ auditError }}</span>
          </div>

          <div v-else-if="hasAuditRun && !diagnostics.length" class="alert alert-success">
            <span>当前谱面没有发现会导致本家预览崩溃，或会被本家预览的规则隐藏的冲突。</span>
          </div>

          <div v-else class="space-y-3 max-h-[70vh] overflow-auto pr-1">
            <button
              v-for="item in diagnostics"
              :key="item.id"
              type="button"
              class="w-full text-left rounded-xl border px-4 py-3 transition-colors"
              :class="[
                item.severity === 'crash'
                  ? (item.id === selectedConflictId
                    ? 'border-error bg-error/10 shadow-[0_0_0_1px_rgba(220,38,38,0.15)]'
                    : 'border-error/40 bg-error/5 hover:border-error hover:bg-error/10')
                  : (item.id === selectedConflictId
                    ? 'border-warning bg-warning/10'
                    : 'border-base-300 hover:border-warning/50 hover:bg-base-200/70'),
              ]"
              @click="selectConflict(item.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="font-semibold text-sm">{{ item.title }}</div>
                    <span
                      class="badge badge-sm shrink-0"
                      :class="item.severity === 'crash' ? 'badge-error' : 'badge-warning badge-outline'"
                    >
                      {{ item.severity === 'crash' ? '会崩溃' : '会被处理' }}
                    </span>
                  </div>
                  <div class="text-xs text-base-content/60 mt-1">{{ item.positionText }} · {{ item.trackText }}</div>
                </div>
                <span class="badge badge-outline shrink-0">{{ item.measure }}</span>
              </div>
              <p
                class="text-sm mt-2 leading-6"
                :class="item.severity === 'crash' ? 'text-error' : 'text-base-content/70'"
              >
                {{ item.summary }}
              </p>
            </button>
          </div>
        </div>
      </section>

      <section class="card bg-base-100 shadow-lg">
        <div class="card-body gap-4">
          <div>
            <h2 class="card-title text-lg">SVG 高亮预览</h2>
            <p class="text-sm text-base-content/60 mt-1">
              {{ isHighlightReady ? '点击左侧冲突后会自动定位到对应位置。' : '定位高亮只会作用在最近一次生成且与当前检查结果一致的 SVG 上。' }}
            </p>
          </div>

          <div v-if="isPreparingPreview" class="alert alert-info">
            <span>检测到冲突，正在生成 SVG 预览并定位到对应位置，请稍候...</span>
          </div>

          <div v-if="previewErrorMessage" class="alert alert-warning">
            <span>{{ previewErrorMessage }}</span>
          </div>

          <div v-else-if="!annotatedSvgText && !isPreparingPreview" class="alert">
            <span>检查到冲突后会自动生成 SVG，并在这里显示定位高亮结果。</span>
          </div>

          <div v-else-if="annotatedSvgText" ref="svgPreviewContainer" class="h-[58vh] overflow-auto rounded-xl border border-base-300 bg-white p-4 scroll-smooth">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="inline-block min-w-full [&_svg]:max-w-none" v-html="annotatedSvgText"></div>
          </div>
        </div>
      </section>
    </div>

    <footer class="text-center text-sm text-base-content/60 mt-8 space-y-2">
      <a
        href="https://chartview.unipjsk.com/"
        class="card bg-base-100 shadow-lg text-left transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl block"
      >
        <div class="card-body flex-row items-center gap-4 p-4">
          <img
            src="/img/chart.webp"
            alt="本家 1:1 复刻谱面在线预览"
            class="w-28 h-20 rounded-lg object-cover shrink-0"
          />
          <div class="min-w-0">
            <h2 class="card-title text-base leading-snug">在线1:1预览本家谱面效果</h2>
            <p class="text-sm text-base-content/70 mt-1">
              点击这里上传谱面，直接体验在线可播放的 3D 谱面预览。
            </p>
          </div>
        </div>
      </a>
      <p>如浏览器无法保存 PNG，请直接拖动到桌面保存。</p>
      <p>
        模块修改自
        <a href="https://gitlab.com/pjsekai/musics" target="_blank" class="link link-primary">pjsekai/musics</a>
      </p>
    </footer>
  </div>
</template>
