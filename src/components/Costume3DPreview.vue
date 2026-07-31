<script lang="ts">
// 只插入一次 3d-export 的 preconnect
let preconnectAdded = false
</script>

<script setup lang="ts">
/**
 * Costume3DPreview - 衣装 3D 预览
 *
 * 基于 Haruki 3D Engine（src/vendor/haruki-3d-engine）。引擎与 three.js
 * 通过动态 import 按需加载，点击"加载 3D 预览"前不产生任何开销。
 *
 * 相机交互（拖动旋转 / 滚轮及双指缩放）通过 internal 入口的 Haruki3DEngine
 * controlsFactory 注入 three 的 OrbitControls 实现（公开 kernel 不暴露相机）。
 *
 * recipe 组装规则（与游戏内 CostumeShop 一致）：
 * - 未选择的槽位用 role catalog 声明的角色默认部件补全；
 * - 已选择但 registry 中不可用的部件直接提示暂无，不静默回退；
 * - 具体槽位以 role registry 的 headCostume3dAssetbundleType 为准；
 * - registry 标记 missing 的早期部件同样视为不可用。
 */
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Box, RotateCcw, Maximize2, Minimize2 } from 'lucide-vue-next'
import type { Haruki3DKernel } from 'haruki-3d-engine'
import type { Haruki3DEngine as Haruki3DEngineType } from 'haruki-3d-engine/internal'
import { useMasterStore } from '@/stores/master'
import { PJSK_3D_ASSETS_BASE_URL, PJSK_3D_BASIS_PATH, isWebGL2Supported } from '@/utils/haruki3d'
import {
  findRuntimePart,
  loadRuntimeRoleData,
  runtimePartSlot,
} from '@/utils/haruki3dRegistry'
import type { CostumePart, CostumeColorVariant } from '@/types/costume'

interface Character {
  id: number
  unit: string
}

interface Character3dRole {
  id: number
  characterId: number
  unit: string
}

const props = defineProps<{
  characterId: number
  parts?: CostumePart[]
  selection?: {
    body?: CostumeColorVariant | null
    head?: CostumeColorVariant | null
    hair?: CostumeColorVariant | null
  }
  bodyRole?: {
    characterId: number
    unit: string
  } | null
}>()

const masterStore = useMasterStore()

const started = ref(false)
const isBusy = ref(false)
const errorMsg = ref('')
const viewerHost = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

const unitOptions = ref<string[]>([])
const selectedUnit = ref('')
const selectedColorId = ref(1)

// 加载进度：引擎不暴露进度，且需要哪些包是解析过程中逐步发现的，无法事先知道总数。
// 加载期间临时接管 fetch，按"已完成 / 已发现"做收敛式进度条（Content-Length
// 是 CORS 安全头，可以直接读到流量）。
const progressStarted = ref(0)
const progressDone = ref(0)
const progressBytes = ref(0)
const progressText = computed(() => {
  const mb = progressBytes.value / 1048576
  return `已加载 ${progressDone.value} / ${progressStarted.value} 个文件${mb > 0.05 ? ` · ${mb.toFixed(1)} MB` : ''}`
})

let kernel: Haruki3DKernel | null = null
let engineInstance: Haruki3DEngineType | null = null
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let viewerInView = true
let originalFetch: typeof window.fetch | null = null
let recipeLoadGeneration = 0

const assetsOrigin = new URL(PJSK_3D_ASSETS_BASE_URL).origin

function beginProgress() {
  progressStarted.value = 0
  progressDone.value = 0
  progressBytes.value = 0
  if (originalFetch) return
  const baseFetch = window.fetch.bind(window)
  originalFetch = window.fetch
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url)
    const tracked = url.startsWith(assetsOrigin)
    if (tracked) progressStarted.value += 1
    try {
      const response = await baseFetch(input, init)
      if (tracked) {
        progressDone.value += 1
        progressBytes.value += Number(response.headers.get('content-length')) || 0
      }
      return response
    } catch (error) {
      if (tracked) progressDone.value += 1
      throw error
    }
  }
}

function endProgress() {
  if (originalFetch) {
    window.fetch = originalFetch
    originalFetch = null
  }
}

function isSupersededSelectionError(error: unknown): boolean {
  return error instanceof Error
    && error.name === 'AbortError'
    && error.message === 'Custom part selection was superseded by a newer request.'
}

const colorOptions = computed(() => {
  const primary = props.parts?.[0]
  if (!primary) return []
  return primary.variants.map(v => ({ colorId: v.colorId, colorName: v.colorName }))
})

function pickVariant(partType: string): CostumeColorVariant | null {
  if (props.selection && partType in props.selection) {
    return props.selection[partType as keyof typeof props.selection] ?? null
  }
  const part = props.parts?.find(p => p.partType === partType)
  if (!part) return null
  return part.variants.find(v => v.colorId === selectedColorId.value) || part.variants[0] || null
}

async function buildRecipe() {
  const roleData = await loadRuntimeRoleData(props.characterId, selectedUnit.value)
  const defaults = roleData.defaults
  const bodyCharacterId = props.bodyRole?.characterId ?? props.characterId
  const bodyUnit = props.bodyRole?.unit ?? selectedUnit.value
  const bodyRoleData = bodyCharacterId === props.characterId && bodyUnit === selectedUnit.value
    ? roleData
    : await loadRuntimeRoleData(bodyCharacterId, bodyUnit)
  const body = pickVariant('body')
  const head = pickVariant('head')
  const hair = pickVariant('hair')

  const bodyEntry = body
    ? findRuntimePart(bodyRoleData, body.costume3dId, ['body'])
    : undefined
  const hairEntry = hair
    ? findRuntimePart(roleData, hair.costume3dId, ['hair'])
    : undefined
  if (body && !bodyEntry) {
    throw new Error('所选衣服暂无 3D 模型')
  }
  if (hair && !hairEntry) {
    throw new Error('所选发型暂无 3D 模型')
  }

  let headCostume3dId = defaults.headCostume3dId
  let headOptionalCostume3dId: number | null = null
  if (head) {
    const headEntry = findRuntimePart(roleData, head.costume3dId, ['head', 'head_optional'])
    if (!headEntry) {
      throw new Error('所选发饰暂无 3D 模型')
    }
    const slot = runtimePartSlot(headEntry)
    if (slot === 'head') {
      headCostume3dId = head.costume3dId
    } else if (slot === 'head_optional') {
      headOptionalCostume3dId = head.costume3dId
    }
  }

  return {
    roleId: `${props.characterId}:${selectedUnit.value}`,
    bodyRoleId: `${bodyCharacterId}:${bodyUnit}`,
    bodyCostume3dId: body?.costume3dId ?? bodyRoleData.defaults.bodyCostume3dId,
    headCostume3dId,
    hairCostume3dId: hair?.costume3dId ?? defaults.hairCostume3dId,
    headOptionalCostume3dId,
  }
}

async function loadContextData() {
  const [charactersData, characterRolesData] = await Promise.all([
    masterStore.getMaster<Character>('gameCharacters'),
    masterStore.getMaster<Character3dRole>('character3ds'),
  ])

  const units = [...new Set(
    characterRolesData
      .filter(role => role.characterId === props.characterId)
      .sort((a, b) => a.id - b.id)
      .map(role => role.unit)
  )]
  const chara = charactersData.find(c => c.id === props.characterId)
  unitOptions.value = units.length > 0 ? units : (chara ? [chara.unit] : [])
  if (!unitOptions.value.includes(selectedUnit.value)) {
    selectedUnit.value = unitOptions.value[0] || ''
  }
}

async function applyRecipe() {
  const activeKernel = kernel
  if (!activeKernel) return
  const generation = ++recipeLoadGeneration
  isBusy.value = true
  errorMsg.value = ''
  beginProgress()
  try {
    const recipe = await buildRecipe()
    if (generation !== recipeLoadGeneration || kernel !== activeKernel) return
    await activeKernel.load(recipe)
    if (generation !== recipeLoadGeneration || kernel !== activeKernel) return
    syncPlayState()
  } catch (error) {
    if (
      generation !== recipeLoadGeneration
      || kernel !== activeKernel
      || isSupersededSelectionError(error)
    ) {
      return
    }
    console.error('3D 预览加载失败:', error)
    errorMsg.value = error instanceof Error ? error.message : String(error)
    activeKernel.pause()
  } finally {
    if (generation === recipeLoadGeneration && kernel === activeKernel) {
      endProgress()
      isBusy.value = false
    }
  }
}

// 全屏：全平台统一用 CSS 覆盖层（Teleport 到 body）。
// 不用原生 Fullscreen API——各浏览器对 WebGL canvas 上层元素的渲染行为不一致，
// 退出按钮时隐时现；CSS 方案行为完全一致且已验证
const cssFullscreen = ref(false)
const isFullscreen = computed(() => cssFullscreen.value)

function handleFullscreenKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && cssFullscreen.value) {
    cssFullscreen.value = false
  }
}

function toggleFullscreen() {
  cssFullscreen.value = !cssFullscreen.value
}

// CSS 全屏时锁定背景滚动（iOS Safari 上尤其必要）
watch(cssFullscreen, (active) => {
  document.body.style.overflow = active ? 'hidden' : ''
})

// 页面隐藏或画布滚出视口时暂停渲染循环，省电省 GPU
function syncPlayState() {
  if (!kernel || errorMsg.value) return
  if (document.hidden || !viewerInView) kernel.pause()
  else kernel.play()
}

function handleVisibilityChange() {
  syncPlayState()
}

async function start() {
  if (started.value) return
  started.value = true
  isBusy.value = true
  errorMsg.value = ''
  try {
    if (!isWebGL2Supported()) {
      throw new Error('当前浏览器不支持 WebGL 2，无法显示 3D 预览')
    }
    await nextTick()
    await loadContextData()

    const [{ Haruki3DEngine, createHaruki3DKernelRuntime, previewLightDefaults }, { OrbitControls }, THREE] = await Promise.all([
      import('haruki-3d-engine/internal'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three'),
    ])
    if (!canvasEl.value || !viewerHost.value) {
      throw new Error('预览画布初始化失败')
    }

    // 公开 kernel 不暴露相机，用 internal 引擎注入 OrbitControls 后再套 kernel 运行时
    const engine = new Haruki3DEngine({
      canvas: canvasEl.value,
      initialLight: { ...previewLightDefaults },
      autoRender: false,
      manageResize: false,
      ktx2TranscoderPath: PJSK_3D_BASIS_PATH,
      controlsFactory: ({ camera, canvas, target, onChange }) => {
        const controls = new OrbitControls(camera, canvas)
        controls.target.copy(target)
        controls.enableDamping = true
        controls.dampingFactor = 0.1
        controls.rotateSpeed = 0.9
        controls.zoomSpeed = 0.8
        controls.panSpeed = 0.8
        controls.minDistance = 0.4
        controls.maxDistance = 8
        // 触屏：单指旋转、双指捏合缩放 + 划动平移；鼠标：左键旋转、右键平移
        controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
        controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }

        // 触控板双指划动平移（wheel 事件）：捏合是 ctrl+wheel 走缩放，
        // 鼠标滚轮（行模式或大步进）也走缩放，其余按平移处理
        const panByScreenDelta = (dx: number, dy: number) => {
          const targetDistance = camera.position.distanceTo(controls.target)
            * Math.tan((camera.fov / 2) * Math.PI / 180)
          const panX = (2 * dx * targetDistance) / canvas.clientHeight
          const panY = (2 * dy * targetDistance) / canvas.clientHeight
          const te = camera.matrix.elements
          const pan = new THREE.Vector3(
            -te[0] * panX + te[4] * panY,
            -te[1] * panX + te[5] * panY,
            -te[2] * panX + te[6] * panY,
          )
          camera.position.add(pan)
          controls.target.add(pan)
          onChange(controls.target)
        }
        const isTrackpadPanScroll = (event: WheelEvent) => {
          if (event.ctrlKey) return false
          if (event.deltaMode !== 0) return false
          if (Math.abs(event.deltaX) > 0) return true
          return Math.abs(event.deltaY) < 40
        }
        const handleWheel = (event: WheelEvent) => {
          if (!isTrackpadPanScroll(event)) return
          event.preventDefault()
          event.stopPropagation()
          panByScreenDelta(-event.deltaX, -event.deltaY)
        }
        const wheelTarget = canvas.parentElement ?? canvas
        wheelTarget.addEventListener('wheel', handleWheel, { passive: false, capture: true })

        // 游戏内方向光挂在 CameraRoot 下（动态光源）：转相机时光要一起转。
        // 引擎不自动处理，这里按相机方位角的变化量旋转默认光向量。
        const baseAzimuth = Math.atan2(
          camera.position.x - controls.target.x,
          camera.position.z - controls.target.z
        )
        const baseLight = { x: previewLightDefaults.x, y: previewLightDefaults.y, z: previewLightDefaults.z }
        let lightSyncQueued = false
        const syncLightToCamera = () => {
          lightSyncQueued = false
          if (!engineInstance) return
          const azimuth = Math.atan2(
            camera.position.x - controls.target.x,
            camera.position.z - controls.target.z
          )
          const yaw = azimuth - baseAzimuth
          const cos = Math.cos(yaw)
          const sin = Math.sin(yaw)
          engineInstance.updatePreviewLight({
            ...previewLightDefaults,
            x: baseLight.x * cos + baseLight.z * sin,
            y: baseLight.y,
            z: -baseLight.x * sin + baseLight.z * cos,
          })
        }

        controls.addEventListener('change', () => {
          onChange(controls.target)
          if (!lightSyncQueued) {
            lightSyncQueued = true
            requestAnimationFrame(syncLightToCamera)
          }
        })
        return {
          target: controls.target,
          minPolarAngle: controls.minPolarAngle,
          maxPolarAngle: controls.maxPolarAngle,
          update: () => controls.update(),
          dispose: () => {
            wheelTarget.removeEventListener('wheel', handleWheel, true)
            controls.dispose()
          },
        }
      },
    })
    // 不显示地面投影阴影
    engine.setProjectedShadowSettings({ opacity: 0, crossOpacity: 0 })
    engineInstance = engine
    kernel = createHaruki3DKernelRuntime(engine, PJSK_3D_ASSETS_BASE_URL)

    const host = viewerHost.value
    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      if (width > 0 && height > 0) kernel?.resize(width, height)
    }
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()
    intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      viewerInView = entry.isIntersecting
      syncPlayState()
    })
    intersectionObserver.observe(host)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleFullscreenKeydown)

    await applyRecipe()
  } catch (error) {
    console.error('3D 预览初始化失败:', error)
    errorMsg.value = error instanceof Error ? error.message : String(error)
    isBusy.value = false
  }
}

// 切换配色 / 组合（VS 角色分组合角色包）时重新装配；引擎内部会序列化并丢弃过期请求
watch([selectedColorId, selectedUnit], () => {
  if (kernel) applyRecipe()
})

watch(
  () => [
    props.characterId,
    props.bodyRole?.characterId,
    props.bodyRole?.unit,
    props.selection?.body?.costume3dId,
    props.selection?.head?.costume3dId,
    props.selection?.hair?.costume3dId,
  ],
  async ([characterId], previous) => {
    if (!kernel) return
    if (characterId !== previous?.[0]) {
      await loadContextData()
    }
    await applyRecipe()
  }
)

onMounted(() => {
  // 提前和 3d-export 建立连接，点开预览时省一次握手
  if (!preconnectAdded) {
    preconnectAdded = true
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = assetsOrigin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }
})

onBeforeUnmount(() => {
  recipeLoadGeneration += 1
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('keydown', handleFullscreenKeydown)
  document.body.style.overflow = ''
  endProgress()
  resizeObserver?.disconnect()
  resizeObserver = null
  intersectionObserver?.disconnect()
  intersectionObserver = null
  if (kernel) {
    void kernel.destroy()
    kernel = null
  }
  engineInstance = null
})
</script>

<template>
  <div>
    <h3 class="font-semibold text-primary mb-3 flex items-center gap-2">
      <Box class="w-5 h-5" /> 3D 预览
    </h3>

    <!-- 未开始：按需加载入口 -->
    <div v-if="!started" class="bg-base-200 rounded-xl p-6 flex flex-col items-center gap-3">
      <p class="text-sm text-base-content/60">在线预览该衣装的 3D 模型（首次加载约 5~10 MB）</p>
      <button class="btn btn-primary btn-sm" @click="start">
        <Box class="w-4 h-4" /> 加载 3D 预览
      </button>
    </div>

    <template v-else>
      <!-- 控制栏 -->
      <div class="flex flex-wrap items-center gap-3 mb-3">
        <div v-if="colorOptions.length > 1" class="flex flex-wrap gap-1.5">
          <button
            v-for="color in colorOptions"
            :key="color.colorId"
            class="btn btn-xs"
            :class="selectedColorId === color.colorId ? 'btn-primary' : 'btn-outline'"
            :disabled="isBusy"
            @click="selectedColorId = color.colorId"
          >
            {{ color.colorName }}
          </button>
        </div>
        <select
          v-if="unitOptions.length > 1"
          v-model="selectedUnit"
          class="select select-bordered select-xs w-40"
          :disabled="isBusy"
        >
          <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ unit }}</option>
        </select>
        <button class="btn btn-xs btn-outline gap-1" @click="toggleFullscreen">
          <Minimize2 v-if="isFullscreen" class="w-3.5 h-3.5" />
          <Maximize2 v-else class="w-3.5 h-3.5" />
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>

      <!-- 画布。CSS 全屏时 Teleport 到 body：详情页卡片的入场动画会在祖先留下
           transform，fixed 定位会被它劫持导致盖不住页面 header（Safari 尤其明显） -->
      <Teleport to="body" :disabled="!cssFullscreen">
        <div
          ref="viewerHost"
          class="bg-base-200 overflow-hidden"
          :class="cssFullscreen ? 'fixed inset-0 z-[1000]' : 'relative w-full aspect-[7/5] rounded-xl'"
        >
          <canvas ref="canvasEl" class="block w-full h-full touch-none cursor-grab active:cursor-grabbing"></canvas>

          <!-- 进入全屏（transform-gpu 强制独立合成层，避免 Safari 把它画到 WebGL canvas 下面；
               全屏中的退出按钮在下方 body 层单独渲染，避开 canvas 兄弟元素的合成问题） -->
          <!-- absolute!/fixed! 加 important：jirai 等主题的 [data-theme] .btn 会用更高优先级覆盖 position -->
          <button
            v-if="!cssFullscreen"
            class="btn btn-sm btn-circle bg-base-100/90 border border-base-300 shadow-md absolute! top-2 right-2 z-30 transform-gpu"
            title="全屏预览"
            @click="toggleFullscreen"
          >
            <Maximize2 class="w-4 h-4" />
          </button>

          <!-- 加载进度 -->
          <div v-if="isBusy" class="absolute inset-0 z-20 grid place-items-center bg-base-200/70">
            <div class="flex flex-col items-center gap-3 text-center px-4">
              <progress
                class="progress progress-primary w-56 max-w-full"
                :value="progressDone"
                :max="Math.max(progressStarted, 1)"
              ></progress>
              <p class="text-xs text-base-content/70">{{ progressText }}</p>
            </div>
          </div>

          <div v-if="errorMsg" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-base-200/90 p-4 text-center">
            <p class="text-sm text-error break-all max-w-full">{{ errorMsg }}</p>
            <button class="btn btn-sm btn-outline" @click="applyRecipe">
              <RotateCcw class="w-4 h-4" /> 重试
            </button>
          </div>
        </div>
      </Teleport>

      <!-- CSS 全屏的退出按钮：独立挂在 body 层（z 高于全屏容器），
           不作为 canvas 的兄弟元素，避开 iOS Safari 的合成层 bug；留出刘海安全区 -->
      <Teleport to="body">
        <button
          v-if="cssFullscreen"
          class="btn btn-circle bg-base-100/90 border border-base-300 shadow-md fixed! right-3 z-[1001]"
          style="top: calc(0.75rem + env(safe-area-inset-top))"
          title="退出全屏"
          @click="toggleFullscreen"
        >
          <Minimize2 class="w-5 h-5" />
        </button>
      </Teleport>

      <p class="text-xs text-base-content/50 mt-2">
        拖动旋转 · 滚轮 / 捏合缩放 · 双指划动 / 右键平移
      </p>
    </template>
  </div>
</template>
