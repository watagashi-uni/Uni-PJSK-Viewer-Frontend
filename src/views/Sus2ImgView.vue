<script setup lang="ts">
import { computed, nextTick, ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { ArrowLeftRight, ClipboardCopy, Download, FileImage, Play, Search, Settings2, Sparkles, Trash2, TriangleAlert } from 'lucide-vue-next'
import {
  renderCustomScoreJsonToPng,
  renderCustomScoreJsonToPngWithRust,
  renderCustomScoreJsonToSvg,
  renderCustomScoreJsonToSvgWithRust,
  renderSusToPng,
  renderSusToPngWithRust,
  renderSusToSvg,
  renderSusToSvgWithRust,
  renderSusToSvgWithConflictOverlay,
  revokeSus2ImgResult,
  analyzeSusConflicts,
  convertSusToCustomScoreJson,
  convertCustomScoreJsonToSus,
  generateRebaseJsonFromCustomScore,
  generateRebaseJsonFromSus,
  type Sus2ImgFrontendResult,
  type Sus2ImgSkin,
  type ConflictDiagnostic,
} from '@/vendor/sekai-sus2img'

const FORM_STORAGE_KEY = 'sus2img-form-data'

type RenderEngine = 'frontend' | 'rust'
type RenderFormat = 'svg' | 'png'
type ChartInputType = 'sus' | 'json' | 'sus2json' | 'json2sus'

const form = ref({
  inputType: 'sus' as ChartInputType,
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
  condenseSpeedTrend: true,
  convertIncludeNoteSpeed: true,
})

const chartFile = ref<File | null>(null)
const bottomLeftImageFile = ref<File | null>(null)
const bottomLeftImageDataUrl = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const auditError = ref<string | null>(null)
const isAnalyzing = ref(false)
const hasAuditRun = ref(false)
const isPreparingPreview = ref(false)
const isDownloadingPng = ref(false)
const isGeneratingRebase = ref(false)
const rebaseGenerationError = ref<string | null>(null)
const rebaseGenerationMessage = ref<string | null>(null)

// 可选设置折叠状态（默认折叠，不持久化）
const showOptionalSettings = ref(false)

// SUS ⇄ JSON 互转状态
type ConversionOutput = {
  kind: 'sus' | 'json'
  text: string
}
const conversionOutput = ref<ConversionOutput | null>(null)
const isConverting = ref(false)
const conversionError = ref<string | null>(null)
const conversionMessage = ref<string | null>(null)
// 每次进入页面都需要重新勾选，不随表单持久化
const overlapAcknowledged = ref(false)

const resultData = ref<string | null>(null)
const resultFormat = ref<RenderFormat>('svg')
const resultSource = ref<RenderEngine | null>(null)
const resultSvgText = ref<string | null>(null)
const resultSvgError = ref<string | null>(null)
const downloadError = ref<string | null>(null)
const downloadMessage = ref<string | null>(null)
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

const setResult = (result: Sus2ImgFrontendResult, engine: RenderEngine) => {
  resetFrontendResult()

  resultData.value = result.url
  resultFormat.value = result.format
  resultSource.value = engine
  resultSvgText.value = result.svgText
  resultSvgError.value = null
  downloadError.value = null
  downloadMessage.value = null

  frontendResult = result
}

const isJsonInput = computed(() => form.value.inputType === 'json' || form.value.inputType === 'json2sus')

const isConvertMode = computed(() => form.value.inputType === 'sus2json' || form.value.inputType === 'json2sus')

const renderEngineName = (engine: RenderEngine): string =>
  engine === 'rust' ? 'Rust WASM' : '现有前端'

const isHighlightReady = computed(
  () =>
    !isJsonInput.value
    && Boolean(resultSvgText.value)
    && renderedChartText.value === analyzedChartText.value
    && renderedRebaseText.value === analyzedRebaseText.value,
)

const resultBaseFileName = computed(() => {
  const rawName = form.value.title.trim() || 'sus2img-chart'
  const normalized = rawName
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized || 'sus2img-chart'
})

const hasDownloadableResult = computed(() => Boolean(resultData.value || resultSvgText.value))

const canDownloadSvg = computed(() => Boolean(resultSvgText.value) || (resultFormat.value === 'svg' && Boolean(resultData.value)))

const canDownloadPng = computed(() => Boolean(resultSvgText.value) || (resultFormat.value === 'png' && Boolean(resultData.value)))

const resultDownloadDescription = computed(() => {
  if (!resultSource.value) {
    return ''
  }

  const sourceText = renderEngineName(resultSource.value)
  const formatText = resultFormat.value.toUpperCase()
  return `最近一次由${sourceText}生成，输出格式为 ${formatText}。`
})

const diagnosticSummaryText = computed(() => {
  if (!hasAuditRun.value) {
    return ''
  }
  if (!diagnostics.value.length) {
    return '未发现会让谱面内容在游戏读取后被忽略、覆盖，或导致预览异常的问题。'
  }

  const crashCount = diagnostics.value.filter((item) => item.severity === 'crash').length
  const renderBugCount = diagnostics.value.filter((item) => item.severity === 'render_bug').length
  const dedupCount = diagnostics.value.filter((item) => item.severity === 'dedup').length
  const parts = [
    crashCount ? `${crashCount} 处会导致本家预览崩溃` : '',
    renderBugCount ? `${renderBugCount} 处可能导致显示异常` : '',
    dedupCount ? `${dedupCount} 处谱面内容会在游戏读取或生成时发生变化` : '',
  ].filter(Boolean)

  return `共发现 ${diagnostics.value.length} 处问题，其中 ${parts.join('，另有 ')}。`
})

const crashDiagnosticCount = computed(
  () => diagnostics.value.filter((item) => item.severity === 'crash').length,
)

const dedupDiagnosticCount = computed(
  () => diagnostics.value.filter((item) => item.severity === 'dedup').length,
)

const renderBugDiagnosticCount = computed(
  () => diagnostics.value.filter((item) => item.severity === 'render_bug').length,
)

const scrollToSelectedConflict = async () => {
  await nextTick()

  const container = svgPreviewContainer.value
  if (!container) {
    return
  }

  // Try crash marker focus anchor first (new format)
  let focus = container.querySelector<SVGGraphicsElement>(
    `#sus-conflict-focus-${selectedConflictId.value}`,
  )
  // Fall back to legacy focus anchor
  if (!focus) {
    focus = container.querySelector<SVGGraphicsElement>('#sus-conflict-focus')
  }
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

const resetAuditState = () => {
  auditError.value = null
  isAnalyzing.value = false
  isPreparingPreview.value = false
  analyzedChartText.value = ''
  analyzedRebaseText.value = ''
  diagnostics.value = []
  selectedConflictId.value = null
  hasAuditRun.value = false
}

const resetRenderState = () => {
  resultData.value = null
  resultSource.value = null
  resultSvgText.value = null
  resultSvgError.value = null
  downloadError.value = null
  downloadMessage.value = null
  renderedChartText.value = ''
  renderedRebaseText.value = ''
  resetFrontendResult()
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
      if (form.value.engine !== 'rust') {
        form.value.engine = 'frontend'
      }
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
  [selectedConflictId, () => resultSvgText.value],
  () => {
    if (!selectedConflictId.value || !resultSvgText.value || !isHighlightReady.value) {
      return
    }
    void scrollToSelectedConflict()
  },
)

watch(
  () => form.value.inputType,
  () => {
    chartFile.value = null
    resetAuditState()
    resetRenderState()
    resetConversionState()
    rebaseGenerationError.value = null
    rebaseGenerationMessage.value = null
  },
)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    chartFile.value = target.files[0]
    rebaseGenerationError.value = null
    rebaseGenerationMessage.value = null
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

  throw new Error(isJsonInput.value ? '请提供 JSON 谱面内容或上传文件' : '请提供 SUS 文件内容或上传文件')
}

async function generateRebaseFromCurrentChart() {
  rebaseGenerationError.value = null
  rebaseGenerationMessage.value = null

  if (form.value.rebase.trim() && !window.confirm('这会覆盖文本框中现有的 rebase.json 内容，是否继续？')) {
    return
  }

  isGeneratingRebase.value = true
  try {
    const chartText = await getChartText()
    form.value.rebase = isJsonInput.value
      ? generateRebaseJsonFromCustomScore(parseCustomScoreJson(chartText), {
          title: form.value.title,
          artist: form.value.artist,
          author: form.value.author,
          difficulty: form.value.difficulty,
          playlevel: form.value.playlevel,
        })
      : generateRebaseJsonFromSus(chartText)
    rebaseGenerationMessage.value = '已根据当前谱面填入，可直接继续修改。'
  } catch (rebaseReason) {
    rebaseGenerationError.value = rebaseReason instanceof Error ? rebaseReason.message : '生成 rebase.json 失败'
  } finally {
    isGeneratingRebase.value = false
  }
}

const resetConversionState = () => {
  conversionOutput.value = null
  conversionError.value = null
  conversionMessage.value = null
  isConverting.value = false
}

const conversionOutputSizeText = computed(() => {
  const text = conversionOutput.value?.text
  if (!text) {
    return ''
  }
  const bytes = new Blob([text]).size
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
})

async function handleConvertFormat() {
  conversionError.value = null
  conversionMessage.value = null
  conversionOutput.value = null
  isConverting.value = true

  try {
    const chartText = await getChartText()

    if (form.value.inputType === 'json2sus') {
      if (!overlapAcknowledged.value) {
        throw new Error('请先阅读重叠说明并勾选"我已知晓"')
      }
      // 先做一次本地 JSON 校验，错误提示更友好
      parseCustomScoreJson(chartText)
      const susText = await convertCustomScoreJsonToSus(chartText, {
        title: form.value.title,
        artist: form.value.artist,
        designer: form.value.author,
        includeNoteSpeed: form.value.convertIncludeNoteSpeed,
      })
      conversionOutput.value = { kind: 'sus', text: susText }
      conversionMessage.value = 'JSON 转 SUS 完成。建议切换到「SUS 转图片」模式，对转换结果做一次 SUS 兼容性检查。'
    } else {
      const jsonText = await convertSusToCustomScoreJson(chartText)
      conversionOutput.value = { kind: 'json', text: jsonText }
      conversionMessage.value = 'SUS 转 JSON 完成。'
    }
  } catch (convertReason) {
    conversionError.value = convertReason instanceof Error ? convertReason.message : '格式转换失败'
  } finally {
    isConverting.value = false
  }
}

function downloadConversionOutput() {
  const output = conversionOutput.value
  if (!output) {
    return
  }

  const mime = output.kind === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8'
  const blob = new Blob([output.text], { type: mime })
  triggerBlobDownload(blob, `${resultBaseFileName.value}.${output.kind}`)
}

async function copyConversionOutput() {
  const output = conversionOutput.value
  if (!output) {
    return
  }

  try {
    await navigator.clipboard.writeText(output.text)
    conversionMessage.value = '已复制到剪贴板。'
  } catch {
    conversionError.value = '复制到剪贴板失败，请使用下载按钮'
  }
}

async function runAudit(chartText: string) {
  if (isJsonInput.value) {
    resetAuditState()
    return
  }

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
    auditError.value = auditReason instanceof Error ? auditReason.message : 'SUS 兼容性检查失败'
  } finally {
    isAnalyzing.value = false
  }
}

async function handleAnalyze() {
  error.value = null
  auditError.value = null

  if (isJsonInput.value) {
    resetAuditState()
    return
  }

  try {
    const chartText = await getChartText()
    await runAudit(chartText)
    if (diagnostics.value.length) {
      await ensureSvgPreview(chartText, diagnostics.value)
      if (selectedConflictId.value) {
        await scrollToSelectedConflict()
      }
    }
  } catch (auditReason) {
    diagnostics.value = []
    hasAuditRun.value = false
    selectedConflictId.value = null
    auditError.value = auditReason instanceof Error ? auditReason.message : 'SUS 兼容性检查失败'
  }
}

async function ensureSvgPreview(chartText: string, diagnosticsForGhost?: ConflictDiagnostic[]) {
  if (
    resultSvgText.value
    && renderedChartText.value === chartText
    && renderedRebaseText.value === form.value.rebase
  ) {
    return
  }

  resultSvgError.value = null
  isPreparingPreview.value = true

  const baseInput = {
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
    condenseSpeedTrend: form.value.condenseSpeedTrend,
  }

  try {
    const preview = diagnosticsForGhost?.length
      ? await renderSusToSvgWithConflictOverlay({
          ...baseInput,
          diagnostics: diagnosticsForGhost,
        })
      : form.value.engine === 'rust'
        ? await renderSusToSvgWithRust(baseInput)
        : await renderSusToSvg(baseInput)

    resultSvgText.value = preview.svgText
    renderedChartText.value = chartText
    renderedRebaseText.value = form.value.rebase
    revokeSus2ImgResult(preview)
  } catch (previewError) {
    resultSvgText.value = null
    resultSvgError.value = previewError instanceof Error ? previewError.message : '前端生成 SVG 预览失败'
  } finally {
    isPreparingPreview.value = false
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function fetchResultBlob(): Promise<Blob> {
  if (!resultData.value) {
    throw new Error('没有可下载的生成结果')
  }

  const response = await fetch(resultData.value)
  if (!response.ok) {
    throw new Error(`下载生成结果失败：HTTP ${response.status}`)
  }

  return await response.blob()
}

function parseSvgLength(value: string | null): number | null {
  if (!value) {
    return null
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function getSvgCanvasSize(svgText: string): { width: number; height: number } {
  if (frontendResult?.width && frontendResult.height) {
    return {
      width: frontendResult.width,
      height: frontendResult.height,
    }
  }

  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svgElement = document.documentElement
  const width = parseSvgLength(svgElement.getAttribute('width'))
  const height = parseSvgLength(svgElement.getAttribute('height'))

  if (width && height) {
    return { width, height }
  }

  const viewBox = svgElement.getAttribute('viewBox')?.trim().split(/\s+/).map(Number)
  const viewBoxWidth = viewBox?.[2]
  const viewBoxHeight = viewBox?.[3]
  if (
    viewBox?.length === 4
    && viewBox.every(Number.isFinite)
    && typeof viewBoxWidth === 'number'
    && typeof viewBoxHeight === 'number'
    && viewBoxWidth > 0
    && viewBoxHeight > 0
  ) {
    return {
      width: viewBoxWidth,
      height: viewBoxHeight,
    }
  }

  throw new Error('无法从 SVG 中读取图片尺寸')
}

async function svgTextToPngBlob(svgText: string): Promise<Blob> {
  const { width, height } = getSvgCanvasSize(svgText)
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = new Image()
    image.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('SVG 转 PNG 时图片载入失败'))
      image.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width)
    canvas.height = Math.ceil(height)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('浏览器不支持 Canvas 导出')
    }

    context.drawImage(image, 0, 0)

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error('浏览器导出 PNG 失败'))
      }, 'image/png')
    })

    return pngBlob
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

async function downloadSvgResult() {
  downloadError.value = null
  downloadMessage.value = null

  try {
    const blob = resultSvgText.value
      ? new Blob([resultSvgText.value], { type: 'image/svg+xml;charset=utf-8' })
      : await fetchResultBlob()
    triggerBlobDownload(blob, `${resultBaseFileName.value}.svg`)
    downloadMessage.value = 'SVG 下载已开始'
  } catch (downloadReason) {
    downloadError.value = downloadReason instanceof Error ? downloadReason.message : 'SVG 下载失败'
  }
}

async function downloadPngResult() {
  downloadError.value = null
  downloadMessage.value = null
  isDownloadingPng.value = true

  try {
    const blob = frontendResult?.format === 'png'
      ? frontendResult.blob
      : resultFormat.value === 'png' && !resultSvgText.value
        ? await fetchResultBlob()
        : await svgTextToPngBlob(resultSvgText.value ?? '')

    triggerBlobDownload(blob, `${resultBaseFileName.value}.png`)
    downloadMessage.value = 'PNG 下载已开始'
  } catch (downloadReason) {
    downloadError.value = downloadReason instanceof Error ? downloadReason.message : 'PNG 下载失败'
  } finally {
    isDownloadingPng.value = false
  }
}

function parseCustomScoreJson(chartText: string): unknown {
  try {
    return JSON.parse(chartText)
  } catch {
    throw new Error('JSON 谱面内容不是合法 JSON')
  }
}

async function renderViaFrontend(chartText: string): Promise<Sus2ImgFrontendResult> {
  const bottomLeftImage = bottomLeftImageDataUrl.value || form.value.bottomLeftImageUrl.trim()
  const commonInput = {
    title: form.value.title,
    artist: form.value.artist,
    author: form.value.author,
    difficulty: form.value.difficulty,
    playlevel: form.value.playlevel,
    pixel: form.value.pixel,
    skin: form.value.skin,
    jacket: bottomLeftImage,
    condenseSpeedTrend: form.value.condenseSpeedTrend,
  }

  if (isJsonInput.value) {
    const input = {
      ...commonInput,
      scoreJson: parseCustomScoreJson(chartText),
      rebase: form.value.rebase,
    }

    if (form.value.format === 'png') {
      return form.value.engine === 'rust'
        ? await renderCustomScoreJsonToPngWithRust(input)
        : await renderCustomScoreJsonToPng(input)
    }

    return form.value.engine === 'rust'
      ? await renderCustomScoreJsonToSvgWithRust(input)
      : await renderCustomScoreJsonToSvg(input)
  }

  const input = {
    ...commonInput,
    sus: chartText,
    rebase: form.value.rebase,
  }

  if (form.value.format === 'png') {
    return form.value.engine === 'rust'
      ? await renderSusToPngWithRust(input)
      : await renderSusToPng(input)
  }

  return form.value.engine === 'rust'
    ? await renderSusToSvgWithRust(input)
    : await renderSusToSvg(input)
}

async function handleFormSubmit() {
  if (isConvertMode.value) {
    await handleConvertFormat()
    return
  }
  await handleSubmit()
}

async function handleSubmit() {
  isSubmitting.value = true
  error.value = null
  const previewTab = window.open('', '_blank')
  showGeneratingHint(previewTab)

  try {
    const chartText = await getChartText()

    const frontend = await renderViaFrontend(chartText)
    setResult(frontend, form.value.engine)
    renderedChartText.value = chartText
    renderedRebaseText.value = form.value.rebase
    if (previewTab && !previewTab.closed) {
      previewTab.location.href = frontend.url
    } else {
      window.open(frontend.url, '_blank')
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
    inputType: 'sus',
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
    condenseSpeedTrend: true,
    convertIncludeNoteSpeed: true,
  }

  chartFile.value = null
  bottomLeftImageFile.value = null
  bottomLeftImageDataUrl.value = ''
  error.value = null
  resetAuditState()
  resetRenderState()
  resetConversionState()
  overlapAcknowledged.value = false
  isGeneratingRebase.value = false
  rebaseGenerationError.value = null
  rebaseGenerationMessage.value = null
  sessionStorage.removeItem(FORM_STORAGE_KEY)
}

</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-center text-primary mb-2">SUS / JSON 谱面转图片</h1>
    <p class="text-center text-base-content/60 text-sm mb-6">粘贴谱面内容和上传文件二选一即可，支持 SUS / JSON 转图片与 SUS ⇄ JSON 互转</p>

    <div class="card bg-base-100 shadow-lg animate-fade-in-up">
      <div class="card-body">
        <form class="space-y-6" @submit.prevent="handleFormSubmit">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">功能选择</span>
            </label>
            <div class="flex gap-4 flex-wrap">
              <label class="label cursor-pointer gap-2">
                <input v-model="form.inputType" type="radio" value="sus" class="radio radio-primary" />
                <span class="label-text">SUS 转图片</span>
              </label>
              <label class="label cursor-pointer gap-2">
                <input v-model="form.inputType" type="radio" value="json" class="radio radio-primary" />
                <span class="label-text">JSON 转图片</span>
              </label>
              <label class="label cursor-pointer gap-2">
                <input v-model="form.inputType" type="radio" value="sus2json" class="radio radio-primary" />
                <span class="label-text">SUS 转 JSON</span>
              </label>
              <label class="label cursor-pointer gap-2">
                <input v-model="form.inputType" type="radio" value="json2sus" class="radio radio-primary" />
                <span class="label-text">JSON 转 SUS</span>
              </label>
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">{{ isJsonInput ? 'JSON 谱面内容' : 'SUS 内容' }}</span>
            </label>
            <textarea
              v-model="form.chart"
              class="textarea textarea-bordered h-40 font-mono text-sm w-full"
              :placeholder="isJsonInput ? '在此粘贴 JSON 谱面内容' : '在此粘贴 SUS 文件内容'"
            ></textarea>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">
                上传{{ isJsonInput ? ' JSON' : ' SUS' }}文件（可选，和上方内容二选一即可）
              </span>
            </label>
            <input
              :key="form.inputType"
              type="file"
              class="file-input file-input-bordered w-full"
              :accept="isJsonInput ? '.json,.txt' : '.sus,.txt'"
              @change="handleFileChange"
            />
            <div v-if="!isJsonInput" class="alert alert-info mt-3 py-3 text-sm">
              <span>SUS 读取已完全还原游戏逻辑，会自动去重和一些其他重叠处理操作</span>
            </div>
          </div>

          <template v-if="form.inputType === 'json2sus'">
            <div class="alert alert-warning items-start">
              <TriangleAlert class="w-6 h-6 shrink-0 mt-0.5" />
              <div class="space-y-2 text-sm leading-6 min-w-0">
                <p class="font-bold text-base">JSON 转 SUS 前，请先确认谱面没有重叠的 note</p>
                <p>
                  SUS 格式没有独立的"note 种类"字段——它靠把多个记号<b>叠放在同一时刻、同一位置</b>来表达种类：
                  比如 trace 长条尾其实是"长条尾 + trace 记号"叠在一起，隐藏长条头是"长条头 + 隐藏记号"叠在一起，
                  黄条（critical）也是在原 note 上叠一个 critical 记号。
                </p>
                <p>因此，如果你的谱面<b>本身</b>就存在下面这类重叠，导出的 SUS 会把它们误读成"种类修饰"，互相污染：</p>
                <ul class="list-disc list-inside space-y-1">
                  <li>长条（slide）节点之间的重叠（包括中继点与中继点、中继点与头尾）</li>
                  <li>长条头 / 尾与其他长条头尾、tap、trace、flick 的重叠</li>
                  <li>guide 的头尾、节点与其他 note 或 guide 之间的重叠</li>
                  <li>同一位置只要有一个 critical note，同处的其他 note 也会被"传染"成 critical</li>
                </ul>
                <p>
                  转换过程<b>不会报错</b>——问题只会在游戏或编辑器读取转换结果时显现：note 变种、丢失、被合并。
                  建议转换完成后，切到「SUS 转图片」模式对结果运行一次「SUS 兼容性检查」。
                </p>
                <p><b>遇到重叠的时候，请使用 1920 分把重叠的 note 错开即可。</b></p>
              </div>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer justify-start items-start gap-3 whitespace-normal">
                <input v-model="overlapAcknowledged" type="checkbox" class="checkbox checkbox-warning shrink-0" />
                <span class="label-text font-medium min-w-0">我已知晓：谱面存在重叠 note 时，转换出的 SUS 可能不符合预期</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer justify-start items-start gap-3 whitespace-normal">
                <input v-model="form.convertIncludeNoteSpeed" type="checkbox" class="checkbox checkbox-primary shrink-0" />
                <span class="label-text min-w-0">
                  导出 note speed 扩展
                  <span class="text-xs opacity-60 block">该格式只有本家可以读取，第三方工具可能不兼容</span>
                </span>
              </label>
            </div>
          </template>

          <div v-if="!isConvertMode" class="grid md:grid-cols-3 gap-4">
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
                  <span class="label-text">现有前端（兼容）</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input v-model="form.engine" type="radio" value="rust" class="radio radio-primary" />
                  <span class="label-text">Rust WASM（快速）</span>
                </label>
              </div>
            </div>
          </div>

          <div v-if="!isConvertMode" class="collapse collapse-arrow bg-base-200/60 border border-base-300 rounded-lg">
            <input v-model="showOptionalSettings" type="checkbox" />
            <div class="collapse-title font-medium flex items-center gap-2">
              <Settings2 class="w-4 h-4" />
              可选设置
              <span class="text-xs opacity-60">（rebase / 标题信息 / 左下角图片 / highspeed 展示）</span>
            </div>
            <div class="collapse-content space-y-6">
              <div class="form-control w-full">
                <label class="label flex-wrap gap-2">
                  <span class="label-text font-medium">rebase.json 内容（可选）</span>
                  <button type="button" class="btn btn-xs btn-outline btn-primary gap-1.5" :disabled="isGeneratingRebase" @click="generateRebaseFromCurrentChart">
                    <span v-if="isGeneratingRebase" class="loading loading-spinner loading-xs"></span>
                    <Sparkles v-else class="w-3.5 h-3.5" />
                    {{ isGeneratingRebase ? '生成中…' : form.rebase.trim() ? '根据当前谱面重新生成' : '根据当前谱面生成' }}
                  </button>
                </label>
                <textarea
                  v-model="form.rebase"
                  class="textarea textarea-bordered h-32 font-mono text-sm w-full"
                  placeholder="在此粘贴 rebase.json 内容"
                ></textarea>
                <p v-if="rebaseGenerationMessage" class="mt-1 text-xs text-success">{{ rebaseGenerationMessage }}</p>
                <p v-if="rebaseGenerationError" class="mt-1 text-xs text-error">{{ rebaseGenerationError }}</p>
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

              <div class="form-control">
                <label class="label cursor-pointer justify-start items-start gap-3 whitespace-normal">
                  <input v-model="form.condenseSpeedTrend" type="checkbox" class="checkbox checkbox-primary shrink-0" />
                  <span class="label-text min-w-0">
                    highspeed 短时间密集变化折叠为趋势箭头
                    <span class="text-xs opacity-60 block">关闭后将逐条展示每个 highspeed 变化（密集处文字可能重叠）；仅现有前端引擎生效</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>

          <div class="flex justify-center gap-4 flex-wrap">
            <button type="button" class="btn btn-outline btn-error" @click="clearForm">
              <Trash2 class="w-4 h-4" />
              清空
            </button>
            <button v-if="!isJsonInput" type="button" class="btn btn-outline" :disabled="isAnalyzing || isSubmitting" @click="handleAnalyze">
              <span v-if="isAnalyzing" class="loading loading-spinner"></span>
              <Search v-else class="w-4 h-4" />
              {{ isAnalyzing ? 'SUS 兼容性检查中...' : '检查 SUS 兼容性' }}
            </button>
            <button
              v-if="isConvertMode"
              type="submit"
              class="btn btn-primary btn-wide"
              :disabled="isConverting || (form.inputType === 'json2sus' && !overlapAcknowledged)"
            >
              <span v-if="isConverting" class="loading loading-spinner"></span>
              <ArrowLeftRight v-else class="w-4 h-4" />
              {{ isConverting ? '转换中...' : form.inputType === 'json2sus' ? 'JSON 转 SUS' : 'SUS 转 JSON' }}
            </button>
            <button v-else type="submit" class="btn btn-primary btn-wide" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              <Play v-else class="w-4 h-4" />
              {{ isSubmitting ? '转换中...' : '开始转换' }}
            </button>
          </div>

          <p v-if="form.inputType === 'json2sus' && !overlapAcknowledged" class="text-center text-sm text-base-content/60">
            勾选"我已知晓"后才能转换
          </p>

          <div v-if="conversionError" class="alert alert-error">
            <span>{{ conversionError }}</span>
          </div>

          <div v-if="conversionMessage" class="alert alert-success">
            <span>{{ conversionMessage }}</span>
          </div>

          <div v-if="conversionOutput" class="flex flex-wrap justify-center items-center gap-3">
            <button type="button" class="btn btn-outline btn-primary" @click="downloadConversionOutput">
              <Download class="w-4 h-4" />
              下载 {{ conversionOutput.kind === 'sus' ? 'SUS' : 'JSON' }}（{{ conversionOutputSizeText }}）
            </button>
            <button type="button" class="btn btn-outline" @click="copyConversionOutput">
              <ClipboardCopy class="w-4 h-4" />
              复制到剪贴板
            </button>
          </div>
        </form>
      </div>
    </div>

    <section v-if="hasDownloadableResult" class="card bg-base-100 shadow-lg mt-6">
      <div class="card-body gap-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="card-title text-lg">生成结果下载</h2>
            <p class="text-sm text-base-content/60 mt-1">{{ resultDownloadDescription }}</p>
          </div>
          <span v-if="resultSource" class="badge badge-outline shrink-0">
            {{ renderEngineName(resultSource) }}生成
          </span>
        </div>

        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-outline btn-primary" :disabled="!canDownloadSvg" @click="downloadSvgResult">
            <Download class="w-4 h-4" />
            下载 SVG
          </button>
          <button type="button" class="btn btn-outline btn-secondary" :disabled="!canDownloadPng || isDownloadingPng" @click="downloadPngResult">
            <span v-if="isDownloadingPng" class="loading loading-spinner loading-sm"></span>
            <FileImage v-else class="w-4 h-4" />
            {{ isDownloadingPng ? '正在生成 PNG...' : '下载 PNG' }}
          </button>
        </div>

        <div v-if="downloadMessage" class="alert alert-success">
          <span>{{ downloadMessage }}</span>
        </div>

        <div v-if="downloadError" class="alert alert-error">
          <span>{{ downloadError }}</span>
        </div>
      </div>
    </section>

    <div v-if="!isJsonInput && (hasAuditRun || auditError || (hasAuditRun && (resultSvgText || resultSvgError)))" class="mt-8 grid min-w-0 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section class="card min-w-0 bg-base-100 shadow-lg">
        <div class="card-body min-w-0 gap-4 p-4 sm:p-6">
          <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h2 class="card-title break-words text-lg">SUS 兼容性检查结果</h2>
              <p class="mt-1 break-words text-sm text-base-content/60">{{ diagnosticSummaryText }}</p>
            </div>
            <span v-if="diagnostics.length" class="badge badge-primary badge-outline">{{ diagnostics.length }}</span>
          </div>

          <div v-if="crashDiagnosticCount" class="alert alert-error">
            <span>发现 {{ crashDiagnosticCount }} 处会导致本家预览崩溃的写法，请优先处理。</span>
          </div>

          <div v-if="renderBugDiagnosticCount" class="alert alert-warning">
            <span>发现 {{ renderBugDiagnosticCount }} 处可能导致本家预览显示异常的写法。</span>
          </div>

          <div v-else-if="dedupDiagnosticCount && !crashDiagnosticCount" class="alert alert-warning">
            <span>发现 {{ dedupDiagnosticCount }} 处谱面内容会在游戏读取或生成时被忽略、覆盖或改变。</span>
          </div>

          <div v-if="auditError" class="alert alert-error">
            <span>{{ auditError }}</span>
          </div>

          <div v-else-if="hasAuditRun && !diagnostics.length" class="alert alert-success">
            <span>当前谱面没有发现会让内容被忽略、覆盖，或导致预览异常的问题。</span>
          </div>

          <div v-else class="max-h-[70vh] min-w-0 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
            <button
              v-for="item in diagnostics"
              :key="item.id"
              type="button"
              class="w-full min-w-0 max-w-full overflow-hidden rounded-xl border px-3 py-3 text-left transition-colors sm:px-4"
              :class="[
                item.severity === 'crash'
                  ? (item.id === selectedConflictId
                    ? 'border-error bg-error/10 shadow-[0_0_0_1px_rgba(220,38,38,0.15)]'
                    : 'border-error/40 bg-error/5 hover:border-error hover:bg-error/10')
                  : item.severity === 'render_bug'
                    ? (item.id === selectedConflictId
                      ? 'border-warning bg-warning/10 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]'
                      : 'border-warning/50 bg-warning/5 hover:border-warning hover:bg-warning/10')
                    : (item.id === selectedConflictId
                      ? 'border-warning bg-warning/10'
                      : 'border-base-300 hover:border-warning/50 hover:bg-base-200/70'),
              ]"
              @click="selectConflict(item.id)"
            >
              <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <div class="min-w-0 break-words text-sm font-semibold">{{ item.title }}</div>
                    <span
                      class="badge badge-sm shrink-0"
                      :class="item.severity === 'crash' ? 'badge-error' : 'badge-warning badge-outline'"
                    >
                      {{ item.severity === 'crash' ? '可能崩溃' : item.severity === 'render_bug' ? '显示异常' : '内容会改变' }}
                    </span>
                    <span class="badge badge-sm badge-ghost shrink-0">
                      {{ item.stage === 'import' ? '读取时' : item.stage === 'maker' ? '生成谱面时' : '预览时' }}
                    </span>
                  </div>
                  <div class="mt-1 break-words text-xs text-base-content/60">{{ item.positionText }} · {{ item.trackText }}</div>
                </div>
                <span class="badge badge-outline shrink-0">{{ item.measure }}</span>
              </div>
              <p
                class="mt-2 break-words text-sm leading-6 [overflow-wrap:anywhere]"
                :class="item.severity === 'crash' ? 'text-error' : item.severity === 'render_bug' ? 'text-warning' : 'text-base-content/70'"
              >
                {{ item.summary }}
              </p>
            </button>
          </div>
        </div>
      </section>

      <section class="card min-w-0 bg-base-100 shadow-lg">
        <div class="card-body min-w-0 gap-4 p-4 sm:p-6">
          <div>
            <h2 class="card-title text-lg">SVG 高亮预览</h2>
            <p class="text-sm text-base-content/60 mt-1">
              {{ isHighlightReady ? '点击左侧冲突后会自动定位到对应位置。' : '定位高亮只会作用在最近一次生成且与当前检查结果一致的 SVG 上。' }}
            </p>
          </div>

          <div v-if="isPreparingPreview" class="alert alert-info">
            <span>检测到冲突，正在生成 SVG 预览并定位到对应位置，请稍候...</span>
          </div>

          <div v-if="resultSvgError" class="alert alert-warning">
            <span>{{ resultSvgError }}</span>
          </div>

          <div v-else-if="!resultSvgText && !isPreparingPreview" class="alert">
            <span>检查到冲突后会自动生成 SVG，并在这里显示定位高亮结果。</span>
          </div>

          <div v-else-if="resultSvgText" ref="svgPreviewContainer" class="h-[58vh] min-w-0 max-w-full overflow-auto rounded-xl border border-base-300 bg-white p-4 scroll-smooth">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="inline-block min-w-full [&_svg]:max-w-none" v-html="resultSvgText"></div>
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
