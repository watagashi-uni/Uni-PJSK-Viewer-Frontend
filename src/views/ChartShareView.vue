<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Link, Copy, Check, Music, FileText, AlertCircle } from 'lucide-vue-next'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''

const susFile = ref<File | null>(null)
const bgmFile = ref<File | null>(null)
const isUploading = ref(false)
const shareUrl = ref('')
const errorMsg = ref('')
const copied = ref(false)

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
    const formData = new FormData()
    formData.append('sus', susFile.value)
    formData.append('bgm', bgmFile.value)

    const resp = await fetch(`${apiBase}/api/chart-share`, {
      method: 'POST',
      body: formData
    })
    const data = await resp.json()

    if (data.success) {
      shareUrl.value = data.url
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
