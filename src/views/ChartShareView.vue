<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Link, Copy, Check, Music, FileText, AlertCircle } from 'lucide-vue-next'
import { request } from '@/utils/request'

const susFile = ref<File | null>(null)
const bgmFile = ref<File | null>(null)
const isUploading = ref(false)
const shareUrl = ref('')
const errorMsg = ref('')
const copied = ref(false)
const chartSharePathPrefix = '/chart/s/'

function parseWaveOffsetMs(chartText: string) {
  const match = chartText.match(/^\s*#WAVEOFFSET\s+([+-]?\d+(?:\.\d+)?)\s*$/im)
  if (!match) {
    return 0
  }

  const seconds = Number(match[1])
  if (!Number.isFinite(seconds)) {
    return 0
  }

  return Math.round(seconds * 1000)
}

function extractShareId(rawUrl: string) {
  try {
    const normalized = new URL(rawUrl, window.location.origin)
    const susUrl = normalized.searchParams.get('sus')
    const bgmUrl = normalized.searchParams.get('bgm')

    for (const fileUrl of [susUrl, bgmUrl]) {
      if (!fileUrl) continue
      const filePath = new URL(fileUrl, window.location.origin).pathname.split('/').filter(Boolean)
      if (filePath.length >= 2) {
        return filePath[filePath.length - 2]
      }
    }

    const pathParts = normalized.pathname.split('/').filter(Boolean)
    if (pathParts.length >= 2) {
      return pathParts[pathParts.length - 2]
    }

    return pathParts[pathParts.length - 1] || normalized.searchParams.get('id') || ''
  } catch {
    return ''
  }
}

function toLocalShareUrl(rawUrl: string, waveOffsetMs = 0) {
  const shareId = extractShareId(rawUrl)
  if (!shareId) {
    return rawUrl
  }

  const localUrl = new URL(`${chartSharePathPrefix}${encodeURIComponent(shareId)}`, window.location.origin)
  if (waveOffsetMs !== 0) {
    localUrl.searchParams.set('offset', String(waveOffsetMs))
  }
  return localUrl.toString()
}

function onSusChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'sus' && ext !== 'txt') {
    errorMsg.value = '谱面文件仅支持 .sus / .txt 格式'
    susFile.value = null
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    errorMsg.value = '谱面文件不能超过 10MB'
    susFile.value = null
    return
  }
  errorMsg.value = ''
  susFile.value = file
}

function onBgmChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'mp3') {
    errorMsg.value = '音频文件仅支持 .mp3 格式'
    bgmFile.value = null
    return
  }
  if (file.size > 30 * 1024 * 1024) {
    errorMsg.value = '音频文件不能超过 30MB'
    bgmFile.value = null
    return
  }
  errorMsg.value = ''
  bgmFile.value = file
}

async function upload() {
  if (!susFile.value || !bgmFile.value) {
    errorMsg.value = '请选择谱面文件和音频文件'
    return
  }

  isUploading.value = true
  errorMsg.value = ''
  shareUrl.value = ''

  try {
    const susText = await susFile.value.text()
    const waveOffsetMs = parseWaveOffsetMs(susText)
    const formData = new FormData()
    formData.append('sus', susFile.value)
    formData.append('bgm', bgmFile.value)

    const data = await request.post<any>('/api/chart-share', formData)

    if (data.success) {
      shareUrl.value = toLocalShareUrl(data.url || '', waveOffsetMs)
    } else {
      errorMsg.value = data.message || '上传失败'
    }
  } catch {
    errorMsg.value = '网络错误，请重试'
  } finally {
    isUploading.value = false
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback
    const input = document.createElement('input')
    input.value = shareUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-2">谱面分享</h1>
    <p class="text-base-content/60 mb-6">
      上传谱面文件和音频文件，生成可分享的预览链接
    </p>

    <div class="card bg-base-100 shadow-lg mb-4">
      <div class="card-body flex-row items-center gap-4 p-4">
        <img
          src="/img/chartviewsc.jpg"
          alt="可播放谱面 3D 预览"
          class="w-28 h-20 rounded-lg object-cover shrink-0"
        />
        <div class="min-w-0">
          <h2 class="card-title text-base leading-snug">支持可播放的 3D 谱面预览</h2>
          <p class="text-sm text-base-content/70 mt-1">
            上传 SUS + 音频后，分享出去就是可直接播放的 3D 页面链接。
          </p>
        </div>
      </div>
    </div>

    <!-- 上传表单 -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body gap-4">
        <!-- SUS 文件 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <FileText :size="16" />
              谱面文件
              <span class="text-xs text-base-content/40">(.sus / .txt, 最大 10MB)</span>
            </span>
          </label>
          <input 
            type="file" 
            accept=".sus,.txt"
            class="file-input file-input-bordered w-full"
            @change="onSusChange"
          />
          <span v-if="susFile" class="text-sm text-success mt-1">
            ✓ {{ susFile.name }} ({{ (susFile.size / 1024).toFixed(1) }}KB)
          </span>
        </div>

        <!-- BGM 文件 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <Music :size="16" />
              音频文件
              <span class="text-xs text-base-content/40">(.mp3, 最大 30MB)</span>
            </span>
          </label>
          <input 
            type="file" 
            accept=".mp3"
            class="file-input file-input-bordered w-full"
            @change="onBgmChange"
          />
          <span v-if="bgmFile" class="text-sm text-success mt-1">
            ✓ {{ bgmFile.name }} ({{ (bgmFile.size / 1024 / 1024).toFixed(1) }}MB)
          </span>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMsg" class="alert alert-error">
          <AlertCircle :size="16" />
          <span>{{ errorMsg }}</span>
        </div>

        <!-- 上传按钮 -->
        <button 
          class="btn btn-primary" 
          :disabled="!susFile || !bgmFile || isUploading"
          @click="upload"
        >
          <span v-if="isUploading" class="loading loading-spinner loading-sm"></span>
          <Upload v-else :size="16" />
          {{ isUploading ? '上传中...' : '上传并生成链接' }}
        </button>

        <!-- 有效期提示 -->
        <p class="text-xs text-base-content/40 text-center">
          分享链接有效期为 3 天，过期后文件将被自动清理
        </p>
      </div>
    </div>

    <!-- 结果 -->
    <div v-if="shareUrl" class="card bg-base-100 shadow-lg mt-4">
      <div class="card-body">
        <h2 class="card-title text-lg">
          <Link :size="18" />
          分享链接已生成
        </h2>
        <div class="flex gap-2 items-center">
          <input 
            type="text" 
            :value="shareUrl" 
            readonly 
            class="input input-bordered flex-1 text-sm"
          />
          <button class="btn btn-outline btn-sm" @click="copyUrl">
            <Check v-if="copied" :size="14" />
            <Copy v-else :size="14" />
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
        <a 
          :href="shareUrl" 
          target="_blank" 
          class="btn btn-accent btn-sm mt-2"
        >
          打开预览
        </a>
        <p class="text-xs text-base-content/40 mt-1">
          此链接将在 3 天后过期
        </p>
      </div>
    </div>
  </div>
</template>
