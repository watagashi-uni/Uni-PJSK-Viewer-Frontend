<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Play, Trash2, ExternalLink, Download } from 'lucide-vue-next'
import apiClient from '@/api/client'

const FORM_STORAGE_KEY = 'sus2img-form-data'

const form = ref({
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
})

const chartFile = ref<File | null>(null)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// 结果数据
const resultData = ref<string | null>(null)
const resultFormat = ref<string>('svg')

// 恢复表单数据
onMounted(() => {
  const saved = sessionStorage.getItem(FORM_STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(form.value, parsed)
    } catch (e) {
      // ignore parse error
    }
  }
})

// 保存表单数据
watch(form, (newVal) => {
  sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newVal))
}, { deep: true })

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    chartFile.value = target.files[0]
  }
}

async function handleSubmit() {
  if (!form.value.chart && !chartFile.value) {
    error.value = '请提供 SUS 文件内容或上传文件'
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const formData = new FormData()
    
    if (chartFile.value) {
      formData.append('chart_file', chartFile.value)
    } else {
      formData.append('chart', form.value.chart)
    }
    
    formData.append('rebase', form.value.rebase)
    formData.append('title', form.value.title)
    formData.append('artist', form.value.artist)
    formData.append('author', form.value.author)
    formData.append('difficulty', form.value.difficulty)
    formData.append('playlevel', form.value.playlevel)
    formData.append('pixel', form.value.pixel)
    formData.append('form', form.value.format)
    formData.append('skin', form.value.skin)

    const response = await apiClient.post('/api/sus2img', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const result = response.data

    if (!result.success) {
      throw new Error(result.error || '转换失败')
    }

    // 显示结果（URL 模式，让用户点击打开）
    resultData.value = result.url
    resultFormat.value = result.format
  } catch (e) {
    error.value = e instanceof Error ? e.message : '转换失败'
  } finally {
    isSubmitting.value = false
  }
}

// 清空表单
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
  }
  chartFile.value = null
  error.value = null
  resultData.value = null
  sessionStorage.removeItem(FORM_STORAGE_KEY)
}

// 在新标签页打开结果
function openInNewTab() {
  if (!resultData.value) return
  window.open(resultData.value, '_blank')
}

// 下载结果（通过打开 URL 触发浏览器下载）
function downloadResult() {
  if (!resultData.value) return
  
  // 创建一个 a 标签下载
  const link = document.createElement('a')
  link.href = resultData.value
  link.download = `chart.${resultFormat.value}`
  link.target = '_blank'
  link.click()
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-center text-primary mb-2">SUS 谱面转图片</h1>
    <p class="text-center text-base-content/60 text-sm mb-6">粘贴SUS 和 上传文件 二选一即可</p>

    <div class="card bg-base-100 shadow-lg animate-fade-in-up">
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- SUS 内容和 rebase -->
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

          <!-- 歌曲信息 -->
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

          <!-- 选项 -->
          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">输出格式</span>
              </label>
              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2">
                  <input type="radio" v-model="form.format" value="svg" class="radio radio-primary" />
                  <span class="label-text">SVG (快速)</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input type="radio" v-model="form.format" value="png" class="radio radio-primary" />
                  <span class="label-text">PNG (需要约10秒)</span>
                </label>
              </div>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">皮肤</span>
              </label>
              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2">
                  <input type="radio" v-model="form.skin" value="custom01" class="radio radio-primary" />
                  <span class="label-text">默认</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input type="radio" v-model="form.skin" value="custom02" class="radio radio-primary" />
                  <span class="label-text">3周年新增</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 文件上传 -->
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

          <!-- 错误提示 -->
          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>

          <!-- 提交按钮 -->
          <div class="flex justify-center gap-4">
            <button 
              type="button"
              class="btn btn-outline btn-error"
              @click="clearForm"
            >
              <Trash2 class="w-4 h-4" />
              清空
            </button>
            <button 
              type="submit" 
              class="btn btn-primary btn-wide"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              <Play v-else class="w-4 h-4" />
              {{ isSubmitting ? '转换中...' : '开始转换' }}
            </button>
          </div>

          <!-- 转换结果 -->
          <div v-if="resultData" class="alert alert-success mt-6">
            <div class="flex flex-col sm:flex-row gap-4 w-full items-center justify-between">
              <span class="font-medium">✓ 转换完成！</span>
              <div class="flex gap-2 flex-wrap justify-center">
                <!-- 打开预览 -->
                <button 
                  @click="openInNewTab"
                  class="btn btn-sm btn-primary"
                >
                  <ExternalLink class="w-4 h-4" />
                  打开预览
                </button>
                <!-- 下载 -->
                <button 
                  @click="downloadResult"
                  class="btn btn-sm btn-success"
                >
                  <Download class="w-4 h-4" />
                  下载
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- 页脚说明 -->
    <footer class="text-center text-sm text-base-content/60 mt-8 space-y-2">
      <p>如浏览器无法保存 PNG，请直接拖动到桌面保存。</p>
      <p>
        模块修改自 
        <a href="https://gitlab.com/pjsekai/musics" target="_blank" class="link link-primary">pjsekai/musics</a>
      </p>
    </footer>
  </div>
</template>
