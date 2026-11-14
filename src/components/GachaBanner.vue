<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Gift } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'

const props = defineProps<{
  gacha: { id: number; name: string; assetbundleName: string }
  assetsHost: string
}>()

// 依次尝试：首页横幅 → 卡池 logo（按 assetbundleName 必然存在）→ 占位图标。
// 复用其他卡池资源的池（复刻、常驻等）没有自己的横幅，直接从 logo 开始
const candidates = computed(() => {
  const { id, assetbundleName } = props.gacha
  const list: { url: string; isLogo: boolean }[] = []
  if (assetbundleName === `ab_gacha_${id}`) {
    list.push({ url: `${props.assetsHost}/startapp/home/banner/banner_gacha${id}/banner_gacha${id}.png`, isLogo: false })
  }
  list.push({ url: `${props.assetsHost}/ondemand/gacha/${assetbundleName}/logo/logo.png`, isLogo: true })
  return list
})
const stage = ref(0)
const current = computed(() => candidates.value[stage.value])

watch(candidates, () => { stage.value = 0 })
</script>

<template>
  <!-- 画框和首页横幅同比例（488×208）：横幅铺满；退回 logo 时完整显示、四周留空 -->
  <span class="banner-frame">
    <AssetImage
      v-if="current"
      :key="current.url"
      :src="current.url"
      :alt="gacha.name"
      :class="{ 'is-logo': current.isLogo }"
      @error="stage += 1"
    />
    <span v-else class="grid h-full w-full place-items-center"><Gift class="h-10 w-10 text-base-content/20" /></span>
    <slot></slot>
  </span>
</template>
