<script setup lang="ts">
import { ref, computed, onMounted, toRef } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { toPng } from 'html-to-image'
import AssetImage from '@/components/AssetImage.vue'
import { Download, Image as ImageIcon, Search, Crosshair, RefreshCcw, ZoomIn } from 'lucide-vue-next'
import { toRomaji } from '@/utils/kanaToRomaji'

interface Music {
  id: number
  title: string
  assetbundleName: string
  publishedAt: number
  pronunciation: string
}

interface MusicDifficulty {
  id: number
  musicId: number
  musicDifficulty: string
  playLevel: number
}

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

// 状态
const allMusics = ref<Music[]>([])
const allDifficulties = ref<MusicDifficulty[]>([])
const searchQuery = ref('')
const searchResults = ref<Music[]>([])

const selectedMusic = ref<Music | null>(null)
const selectedDifficulty = ref('master')
const customText = ref('ALL PERFECT')

// 图片变换控制
const bgImage = ref<string | null>(null)
const bgScale = ref(1.0)
const bgRotate = ref(0)
const bgX = ref(0)
const bgY = ref(0)

const exportNode = ref<HTMLElement | null>(null)
const isExporting = ref(false)

const difficultiesDict = ['easy', 'normal', 'hard', 'expert', 'master', 'append']

// 加载数据
onMounted(async () => {
  try {
    masterStore.getTranslations().catch(e => console.error('加载翻译失败:', e))
    const [musicsData, diffData] = await Promise.all([
      masterStore.getMaster<Music>('musics'),
      masterStore.getMaster<MusicDifficulty>('musicDifficulties')
    ])
    allMusics.value = musicsData
    allDifficulties.value = diffData
  } catch (error) {
    console.error('加载歌曲数据失败:', error)
  }
})

const translations = toRef(masterStore, 'translations')

// 搜索逻辑
function searchMusic() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  const query = searchQuery.value.toLowerCase()
  const matched = allMusics.value.filter(m => {
    const titleMatch = m.title.toLowerCase().includes(query)
    const transMatch = translations.value[m.id]?.toLowerCase().includes(query)
    const pronunciationMatch = m.pronunciation?.includes(query)
    const romajiMatch = toRomaji(m.pronunciation)?.toLowerCase().includes(query)
    return titleMatch || transMatch || pronunciationMatch || romajiMatch
  })

  // 最近的排最前面
  matched.sort((a, b) => {
    let cmp = b.publishedAt - a.publishedAt
    if (cmp === 0) cmp = b.id - a.id
    return cmp
  })

  searchResults.value = matched.slice(0, 10) // 最多展示10条
}

// 选择歌曲
function selectMusic(music: Music) {
  selectedMusic.value = music
  searchQuery.value = ''
  searchResults.value = []
}

// 图片上传处理（转为 data URL 以兼容 html-to-image 导出）
function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      bgImage.value = e.target?.result as string
      // 重置变换
      bgScale.value = 1.0
      bgRotate.value = 0
      bgX.value = 0
      bgY.value = 0
    }
    reader.readAsDataURL(file)
  }
}

// 计算属性
const coverUrl = computed(() => {
  if (!selectedMusic.value) return ''
  return `${settingsStore.assetsHost}/startapp/music/jacket/${selectedMusic.value.assetbundleName}/${selectedMusic.value.assetbundleName}.png`
})

const currentLevel = computed(() => {
  if (!selectedMusic.value) return 0
  const diff = allDifficulties.value.find(
    d => d.musicId === selectedMusic.value!.id && d.musicDifficulty === selectedDifficulty.value
  )
  return diff ? diff.playLevel : 0
})

const difficultyColors: Record<string, { bg: string, text: string, shadow: string }> = {
  easy: { bg: '#6EE1D6', text: 'text-[#6EE1D6]', shadow: 'rgba(110,225,214,0.8)' },
  normal: { bg: '#34DDFF', text: 'text-[#34DDFF]', shadow: 'rgba(52,221,255,0.8)' },
  hard: { bg: '#FBCC26', text: 'text-[#FBCC26]', shadow: 'rgba(251,204,38,0.8)' },
  expert: { bg: '#EA5B75', text: 'text-[#EA5B75]', shadow: 'rgba(234,91,117,0.8)' },
  master: { bg: '#C656EA', text: 'text-[#C656EA]', shadow: 'rgba(198,86,234,0.8)' },
  append: { bg: '#EE78DC', text: 'text-[#EE78DC]', shadow: 'rgba(238,120,220,0.8)' },
}

const currentColors = computed(() => {
  return difficultyColors[selectedDifficulty.value] || difficultyColors['master'] || { bg: '#C656EA', text: 'text-[#C656EA]', shadow: 'rgba(198,86,234,0.8)' }
})

// 重置变换
function resetTransform() {
  bgScale.value = 1.0
  bgRotate.value = 0
  bgX.value = 0
  bgY.value = 0
}

// 导出为图片
async function generateImage() {
  if (!exportNode.value || !bgImage.value) return
  isExporting.value = true
  try {
    const dataUrl = await toPng(exportNode.value, {
      pixelRatio: 2, // 提高清晰度
      cacheBust: true,
      skipFonts: false
    })
    
    // 下载图片
    const link = document.createElement('a')
    link.download = `sekai-result-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('生成图片失败:', err)
    alert('生成图片失败，请检查浏览器控制台或尝试其他浏览器。')
  } finally {
    isExporting.value = false
  }
}

// 复制歌名
function copyMusicTitle() {
  if (selectedMusic.value) {
    navigator.clipboard.writeText(selectedMusic.value.title)
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
    
    <!-- 左侧：预览区域 -->
    <div class="lg:w-2/3 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-black flex items-center gap-2">
          <ImageIcon class="w-6 h-6 text-primary" />
          截图生成工具
        </h1>
        <button 
          v-if="bgImage"
          class="btn btn-primary btn-sm rounded-full px-6 shadow-lg shadow-primary/30"
          :disabled="isExporting"
          @click="generateImage"
        >
          <span v-if="isExporting" class="loading loading-spinner loading-xs"></span>
          <Download v-else class="w-4 h-4" />
          保存图片
        </button>
      </div>

      <!-- 导出节点容器 (固定 8:5 以防止不同设备渲染比例不一致) -->
      <div class="w-full bg-base-200/50 rounded-2xl p-2 border border-base-content/10 shadow-inner overflow-hidden flex items-center justify-center">
        <!-- 固定宽高比的预览框，导出时就是这个框里的内容 -->
        <div 
          ref="exportNode" 
          class="relative w-full aspect-[8.2/5] bg-black overflow-hidden shadow-2xl rounded-lg"
          style="container-type: inline-size"
        >
          <!-- 背景图 -->
          <div v-if="!bgImage" class="absolute inset-0 flex flex-col items-center justify-center text-base-content/40 bg-base-300">
            <ImageIcon class="w-16 h-16 mb-4 opacity-50" />
            <p>请在右侧上传游戏底图</p>
          </div>
          <img 
            v-else 
            :src="bgImage" 
            class="absolute inset-0 w-full h-full object-cover touch-none pointer-events-none" 
            :style="{ transform: `translate(${bgX}px, ${bgY}px) scale(${bgScale}) rotate(${bgRotate}deg)`, transformOrigin: 'center' }" 
            crossorigin="anonymous"
          />

          <!-- 左侧上宽下窄的模糊封面（叠在截图上方，不透明，斜线边缘羽化） -->
          <template v-if="selectedMusic && coverUrl && bgImage">
            <div 
              class="absolute inset-0 pointer-events-none z-[5]"
              :style="{ 
                WebkitMaskImage: 'linear-gradient(97deg, black 0%, black 20%, transparent 38%)',
                maskImage: 'linear-gradient(97deg, black 0%, black 30%, transparent 32%)'
              }"
            >
              <img
                :src="coverUrl"
                class="absolute inset-0 w-full h-full object-cover blur-[7px]"
                crossorigin="anonymous"
              />
            </div>
          </template>

          <!-- 前景 Overlay（左上角），宽度固定为容器的 30% -->
          <div 
            v-if="selectedMusic && bgImage" 
            class="absolute top-[6%] left-[3%] flex flex-col items-start select-none pointer-events-none z-10"
            style="width: 35%"
          >
            <!-- 封面图 -->
            <div class="relative w-full aspect-square" style="margin-bottom: 2%">
              <!-- 偏移旋转底色块（中心旋转） -->
              <div 
                class="absolute inset-0 rounded-sm" 
                :style="{ backgroundColor: currentColors.bg, transform: 'rotate(-4deg)', transformOrigin: 'center center' }"
              />
              <div 
                class="absolute inset-0 bg-black/40 blur-sm rounded-sm"
                style="transform: translate(3%, 3%)"
              />
              <!-- 实际封面 -->
              <AssetImage 
                :src="coverUrl" 
                class="relative w-full h-full object-cover z-10 border border-white/20 rounded-sm shadow-md"
              />
            </div>
            
            <!-- 文字区域（与封面同宽） -->
            <div class="flex flex-col items-start w-full" :style="{
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))',
              transform: 'translateX(4%)'
            }">
              <!-- 难度和等级 -->
              <div class="flex items-baseline gap-[0.4em] w-full" :style="{
                marginBottom: '-2%',
                filter: 'drop-shadow(0 0 10px #ae17ff) drop-shadow(0 0 4px #ae17ff)',
                fontSize: '5.5cqi',
                letterSpacing: '0.05em' /* <--- 在这里调整 MASTER 和数字的字间距，0em 为默认，越大间距越宽 */
              }">
                <span class="font-bold text-white" style="-webkit-text-stroke: 1px white">
                  {{ selectedDifficulty.toUpperCase() }}
                </span>
                <span class="font-bold text-white" style="-webkit-text-stroke: 1px white">
                  {{ currentLevel }}
                </span>
              </div>
              
              <!-- 评价文本 (ALL PERFECT 等) -->
              <div class="font-black uppercase whitespace-nowrap w-full" :style="{
                fontSize: '5.2cqi',
                color: 'transparent',
                backgroundImage: 'linear-gradient(to bottom, #c164eb 0%, #cdfdff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                filter: 'drop-shadow(0 0 8px rgba(193,100,235,0.5))'
              }">
                {{ customText }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：控制面板 -->
    <div class="lg:w-1/3 flex flex-col gap-4">
      <div class="card bg-base-100 shadow-xl border border-base-200">
        <div class="card-body p-5">
          <h2 class="card-title text-base border-b border-base-200 pb-2 mb-2">1. 上传底图</h2>
          <div class="form-control w-full">
            <input 
              type="file" 
              accept="image/*" 
              class="file-input file-input-bordered border-primary/30 w-full" 
              @change="handleFileUpload" 
            />
          </div>

          <template v-if="bgImage">
            <div class="divider my-2">底图微调</div>
            
            <!-- X 轴 -->
            <div class="form-control">
              <label class="label py-1"><span class="label-text text-xs flex items-center gap-1"><Crosshair class="w-3 h-3"/> 水平平移 (X)</span></label>
              <input type="range" min="-1000" max="1000" v-model.number="bgX" class="range range-xs range-primary" />
            </div>
            
            <!-- Y 轴 -->
            <div class="form-control">
              <label class="label py-1"><span class="label-text text-xs flex items-center gap-1"><Crosshair class="w-3 h-3"/> 垂直平移 (Y)</span></label>
              <input type="range" min="-1000" max="1000" v-model.number="bgY" class="range range-xs range-primary" />
            </div>

            <!-- 缩放 -->
            <div class="form-control">
              <label class="label py-1"><span class="label-text text-xs flex items-center gap-1"><ZoomIn class="w-3 h-3"/> 缩放比例</span></label>
              <input type="range" min="0.1" max="3" step="0.01" v-model.number="bgScale" class="range range-xs range-secondary" />
            </div>

            <!-- 旋转 -->
            <div class="form-control">
              <label class="label py-1"><span class="label-text text-xs flex items-center gap-1"><RefreshCcw class="w-3 h-3"/> 旋转角度</span></label>
              <input type="range" min="-180" max="180" v-model.number="bgRotate" class="range range-xs range-accent" />
            </div>

            <button class="btn btn-outline btn-sm mt-3 w-full" @click="resetTransform">重置微调</button>
          </template>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl border border-base-200">
        <div class="card-body p-5">
          <h2 class="card-title text-base border-b border-base-200 pb-2 mb-2">2. 选择歌曲与状态</h2>
          
          <!-- 搜寻歌曲 -->
          <div class="form-control w-full relative">
            <label class="label py-1"><span class="label-text text-xs">搜索歌曲名称</span></label>
            <div class="relative">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="输入歌名..." 
                class="input input-sm input-bordered w-full pr-8"
                @input="searchMusic"
                @focus="searchMusic"
              />
              <Search class="w-4 h-4 absolute right-2 top-2 text-base-content/40" />
            </div>
            
            <!-- 搜索结果下拉 -->
            <ul 
              v-if="searchResults.length > 0" 
              class="menu bg-base-100 border border-base-300 w-full rounded-box shadow-xl absolute top-[60px] z-50 max-h-48 flex-nowrap overflow-y-auto"
            >
              <li v-for="music in searchResults" :key="music.id">
                <a @click="selectMusic(music)" class="py-2 text-sm">
                  <AssetImage 
                    :src="`${settingsStore.assetsHost}/startapp/music/jacket/${music.assetbundleName}/${music.assetbundleName}.png`" 
                    class="w-8 h-8 rounded shrink-0 object-cover"
                  />
                  <span class="truncate">{{ music.title }}</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- 已选歌曲展示 -->
          <div v-if="selectedMusic" class="mt-3 p-2 bg-base-200/50 rounded-lg flex items-center gap-3 relative group">
            <AssetImage :src="coverUrl" class="w-12 h-12 rounded shadow-sm object-cover" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate pr-6">{{ selectedMusic.title }}</p>
              <p class="text-xs text-base-content/60">Level: {{ currentLevel }}</p>
            </div>
            <button 
              class="btn btn-xs btn-ghost btn-square absolute right-2 opacity-50 hover:opacity-100" 
              title="复制歌名"
              @click="copyMusicTitle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>

          <!-- 难度选择 -->
          <div class="form-control mt-3">
            <label class="label py-1"><span class="label-text text-xs">难度</span></label>
            <select v-model="selectedDifficulty" class="select select-sm select-bordered w-full font-bold" :class="currentColors.text">
              <option v-for="diff in difficultiesDict" :key="diff" :value="diff">
                {{ diff.toUpperCase() }}
              </option>
            </select>
          </div>

          <!-- 状态文字 -->
          <div class="form-control mt-3">
            <label class="label py-1"><span class="label-text text-xs">结算状态文字</span></label>
            <input 
              v-model="customText" 
              type="text" 
              class="input input-sm input-bordered w-full font-bold" 
            />
            <div class="flex gap-2 mt-2">
              <button class="btn btn-xs btn-outline" @click="customText = 'ALL PERFECT'">AP</button>
              <button class="btn btn-xs btn-outline" @click="customText = 'FULL COMBO'">FC</button>
              <button class="btn btn-xs btn-outline" @click="customText = 'CLEAR'">CLEAR</button>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>
