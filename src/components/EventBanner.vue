<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EventData } from '@/types/master'
import { getEventBannerUrl, isTestEvent } from '@/utils/event'
import AssetImage from '@/components/AssetImage.vue'
import EventImagePlaceholder from '@/components/EventImagePlaceholder.vue'

const props = defineProps<{
  event: Pick<EventData, 'eventType' | 'assetbundleName' | 'name'>
  assetsHost: string
}>()

const bannerUrl = computed(() => getEventBannerUrl(props.event, props.assetsHost))
const failedUrl = ref('')

watch(bannerUrl, () => { failedUrl.value = '' })

function markFailed(event: Event) {
  failedUrl.value = (event.target as HTMLImageElement).getAttribute('src') || ''
}
</script>

<template>
  <div class="aspect-[122/52] w-full overflow-hidden">
    <AssetImage
      v-if="bannerUrl && failedUrl !== bannerUrl"
      :key="bannerUrl"
      :src="bannerUrl"
      :alt="event.name"
      class="h-full w-full object-cover"
      @error="markFailed"
    />
    <EventImagePlaceholder v-else :test-event="isTestEvent(event)" class="h-full w-full" />
  </div>
</template>
