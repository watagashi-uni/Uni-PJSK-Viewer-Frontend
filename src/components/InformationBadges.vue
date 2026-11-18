<script setup lang="ts">
import { informationTagLabel } from '@/api/information'
import { informationStatusLabels, type InformationStatus } from '@/utils/information'

defineProps<{
  tag: string
  status: InformationStatus
}>()
</script>

<template>
  <span class="info-tag" :data-tag="tag">{{ informationTagLabel(tag) }}</span>
  <span v-if="status" class="info-status" :data-status="status">{{ informationStatusLabels[status] }}</span>
</template>

<style scoped>
.info-tag,
.info-status {
  display: inline-flex;
  align-items: center;
  height: 1.25rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  white-space: nowrap;
}

.info-tag {
  --tag: var(--color-primary);
  background-color: color-mix(in oklab, var(--tag) 14%, transparent);
  color: color-mix(in oklab, var(--tag) 85%, var(--color-base-content));
}

.info-tag[data-tag='gacha'] { --tag: var(--color-secondary); }
.info-tag[data-tag='event'] { --tag: var(--color-accent); }
.info-tag[data-tag='bug'] { --tag: var(--color-error); }
.info-tag[data-tag='update'] { --tag: var(--color-info); }
.info-tag[data-tag='music'],
.info-tag[data-tag='campaign'] { --tag: var(--color-success); }

.info-status[data-status='upcoming'] {
  background-color: var(--color-warning);
  color: var(--color-warning-content);
}

.info-status[data-status='new'] {
  background-color: var(--color-primary);
  color: var(--color-primary-content);
}

.info-status[data-status='ended'],
.info-status[data-status='gone'] {
  background-color: color-mix(in oklab, var(--color-base-content) 10%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
}
</style>
