<script setup lang="ts">
/**
 * CostumeThumb - 衣装缩略图
 *
 * 衣装缩略图仅海外源有全量同步，这里固定使用海外源。
 * 部分早期 unique_head 资源的缩略图使用去掉 unique_ 的文件名，
 * 加载失败时自动回退，仍失败则显示占位图标。
 */
import { ref, computed, watch } from 'vue'
import { Shirt } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { costumeThumbUrl } from '@/utils/costume'

const props = defineProps<{
  assetbundleName: string
  alt?: string
}>()

const settingsStore = useSettingsStore()

const candidates = computed(() => {
  const names = [props.assetbundleName]
  if (props.assetbundleName.includes('unique_')) {
    names.push(props.assetbundleName.replace(/unique_/g, ''))
  }
  return names.map(name => costumeThumbUrl(settingsStore.ASSETS_HOST_GLOBAL, name))
})

const stage = ref(0)
watch(() => props.assetbundleName, () => { stage.value = 0 })
</script>

<template>
  <div class="flex items-center justify-center">
    <img
      v-if="stage < candidates.length"
      :src="candidates[stage]"
      :alt="props.alt || ''"
      loading="lazy"
      crossorigin="anonymous"
      class="max-w-full max-h-full object-contain"
      @error="stage += 1"
    />
    <Shirt v-else class="w-1/3 h-1/3 text-base-content/20" />
  </div>
</template>
