<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOAuthStore } from '@/stores/oauth'

const route = useRoute()
const router = useRouter()
const oauthStore = useOAuthStore()

const loading = ref(true)
const errorMsg = ref('')

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : undefined
  const state = typeof route.query.state === 'string' ? route.query.state : undefined
  const error = typeof route.query.error === 'string' ? route.query.error : undefined
  const errorDescription = typeof route.query.error_description === 'string'
    ? route.query.error_description
    : undefined

  try {
    const returnTo = await oauthStore.handleAuthorizationCallback({
      code,
      state,
      error,
      errorDescription,
    })
    await router.replace(returnTo || '/')
  } catch (e: any) {
    errorMsg.value = e?.message || 'OAuth 回调处理失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-xl mx-auto p-6">
    <div v-if="loading" class="card bg-base-100 shadow-lg">
      <div class="card-body items-center text-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <h2 class="text-xl font-semibold">正在完成授权</h2>
        <p class="text-sm text-base-content/60">请稍候，正在验证并保存 OAuth Token。</p>
      </div>
    </div>

    <div v-else-if="errorMsg" class="card bg-base-100 shadow-lg">
      <div class="card-body gap-4">
        <h2 class="text-xl font-semibold text-error">授权失败</h2>
        <p class="text-sm break-words">{{ errorMsg }}</p>
        <div class="card-actions justify-end">
          <button class="btn btn-primary btn-sm" @click="router.replace('/')">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>
