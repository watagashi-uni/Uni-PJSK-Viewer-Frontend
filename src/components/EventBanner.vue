<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EventData } from '@/types/master'
import { getEventBannerUrl, getEventLogoUrl, isTestEvent } from '@/utils/event'
import AssetImage from '@/components/AssetImage.vue'
import EventImagePlaceholder from '@/components/EventImagePlaceholder.vue'

const props = defineProps<{
  event: Pick<EventData, 'eventType' | 'assetbundleName' | 'name'>
  assetsHost: string
}>()

// 依次尝试：首页横幅 → 活动 logo。测试活动没有横幅，直接从 logo 开始；都加载失败才显示占位图
const candidates = computed(() => {
  const banner = getEventBannerUrl(props.event, props.assetsHost)
  const logo = getEventLogoUrl(props.event, props.assetsHost)
  return [
    ...(banner ? [{ url: banner, isLogo: false }] : []),
    ...(logo ? [{ url: logo, isLogo: true }] : []),
  ]
})
const stage = ref(0)
const current = computed(() => candidates.value[stage.value])

watch(candidates, () => { stage.value = 0 })
</script>

<template>
  <div class="aspect-[122/52] w-full overflow-hidden" :class="{ 'bg-base-200': current?.isLogo }">
    <AssetImage
      v-if="current"
      :key="current.url"
      :src="current.url"
      :alt="event.name"
      class="h-full w-full"
      :class="current.isLogo ? 'object-contain p-3' : 'object-cover'"
      @error="stage += 1"
    />
    <EventImagePlaceholder v-else :test-event="isTestEvent(event)" class="h-full w-full" />
  </div>
</template>
