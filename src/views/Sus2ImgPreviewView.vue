<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const imageData = ref<string | null>(null)
const imageFormat = ref<string>('svg')
const zoom = ref(100)

// 从 sessionStorage 获取预览数据
onMounted(() => {
  const data = sessionStorage.getItem('sus2img-preview-data')
  const format = sessionStorage.getItem('sus2img-preview-format')
  
  if (data && format) {
    imageData.value = data
    imageFormat.value = format
  } else {
    // 没有数据，返回转换页面
    router.push('/sus2img')
  }
})

// 缩放后的样式
const zoomStyle = computed(() => ({
  transform: `scale(${zoom.value / 100})`,
  transformOrigin: 'top left',
}))

// 返回转换页面
function goBack() {
  router.push('/sus2img')
}

// 下载
function downloadImage() {
  if (!imageData.value) return
  
  const link = document.createElement('a')
  link.href = imageData.value
  link.download = `chart.${imageFormat.value}`
  link.click()
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-[#1a1a2e] flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="flex-shrink-0 bg-[#252541] p-3 flex justify-between items-center gap-4 shadow-lg">
      <div class="flex items-center gap-4">
        <button 
          @click="goBack" 
          class="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          ← 返回
        </button>
        <h2 class="text-white font-bold hidden sm:block">谱面预览</h2>
      </div>
      
      <!-- 缩放控制 -->
      <div class="flex items-center gap-3 flex-1 max-w-md">
        <span class="text-white/60 text-sm whitespace-nowrap">缩放</span>
        <input 
          v-model="zoom" 
          type="range" 
          min="25" 
          max="200" 
          step="5"
          class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span class="text-white text-sm w-12 text-right">{{ zoom }}%</span>
      </div>
      
      <button 
        @click="downloadImage" 
        class="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
      >
        📥 <span class="hidden sm:inline">下载</span>
      </button>
    </div>
    
    <!-- 图片内容（可滚动区域） -->
    <div class="flex-1 overflow-auto">
      <div v-if="imageData" class="p-4 inline-block min-w-full">
        <div :style="zoomStyle" class="transition-transform duration-150 inline-block">
          <img 
            :src="imageData" 
            alt="谱面" 
            class="max-w-none"
          />
        </div>
      </div>
      
      <!-- 加载中 -->
      <div v-else class="flex-1 flex items-center justify-center">
        <span class="loading loading-spinner loading-lg text-white"></span>
      </div>
    </div>
  </div>
</template>
