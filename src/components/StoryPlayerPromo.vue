<script setup lang="ts">
import { BookmarkCheck, ChevronRight, Languages, Mic, Play, Sparkles } from 'lucide-vue-next'

const features = [
  { icon: Sparkles, label: 'Live2D 演出', detail: '动作与表情实时呈现' },
  { icon: Mic, label: '角色语音', detail: '台词配音同步播放' },
  { icon: Languages, label: '中文翻译', detail: '日中双语字幕，优先官方译文' },
  { icon: BookmarkCheck, label: '进度保存', detail: '下次从上次的台词继续' },
]
</script>

<template>
  <section class="story-promo rounded-box border border-base-300 bg-base-100" aria-labelledby="story-promo-title">
    <div class="promo-copy">
      <div class="promo-title">
        <h2 id="story-promo-title" class="text-base font-bold sm:text-xl">新版剧情播放器</h2>
        <span class="badge badge-xs badge-outline badge-primary hidden font-semibold sm:inline-flex">NEW</span>
      </div>

      <ul class="promo-features">
        <li v-for="feature in features" :key="feature.label">
          <component :is="feature.icon" class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span class="text-xs font-semibold sm:text-sm">{{ feature.label }}</span>
          <span class="promo-detail text-xs text-base-content/55">{{ feature.detail }}</span>
        </li>
      </ul>

      <div class="promo-actions">
        <RouterLink
          to="/stories?tab=unit&story=2&episode=20007"
          class="btn btn-sm btn-primary"
          aria-label="试看凤笑梦与神代类的剧情"
        >
          <Play class="h-3.5 w-3.5 fill-current" aria-hidden="true" /> 试看一段
        </RouterLink>
        <RouterLink to="/stories" class="btn btn-sm btn-ghost hidden border-base-300 sm:inline-flex">
          全部剧情 <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>

    <!-- 与「试看一段」同目标，读屏和键盘只保留按钮这一个入口 -->
    <RouterLink to="/stories?tab=unit&story=2&episode=20007" class="promo-shot" tabindex="-1" aria-hidden="true">
      <img src="/img/promo/story-player-wonder.jpg" alt="" width="1280" height="720" fetchpriority="high" />
    </RouterLink>
  </section>
</template>

<style scoped>
.story-promo {
  --shot: 24rem;
  --cut: 2.75rem;
  --stage: calc(var(--shot) + var(--cut) + 2.25rem);
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--shot);
  align-items: center;
  gap: calc(var(--cut) + 2.5rem);
  padding: 1rem 1rem 1rem 1.5rem;
  overflow: hidden;
  isolation: isolate;
  container-type: inline-size;
}

/* 播放器窗口后面的斜切舞台，加一道平行细线 */
.story-promo::before,
.story-promo::after {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 0 0 auto;
}

.story-promo::before {
  width: var(--stage);
  background: color-mix(in oklab, var(--color-primary) 12%, transparent);
  clip-path: polygon(var(--cut) 0, 100% 0, 100% 100%, 0 100%);
}

.story-promo::after {
  right: calc(var(--stage) + 0.5rem - var(--cut) - 0.25rem);
  width: calc(var(--cut) + 0.25rem);
  background: var(--color-primary);
  clip-path: polygon(var(--cut) 0, 100% 0, 0.25rem 100%, 0 100%);
}

.promo-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.promo-features {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.promo-features li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: 0.5rem;
}

.promo-detail {
  grid-column: 2;
}

.promo-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.promo-shot {
  display: block;
  overflow: hidden;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.2);
}

.promo-shot img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  transition: transform 0.4s ease;
}

.promo-shot:hover img {
  transform: scale(1.02);
}

/* 主栏够宽时四个卖点横排，避免文字区留白 */
@container (min-width: 60rem) {
  .promo-features {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .promo-actions {
    margin-top: 1.25rem;
  }
}

@media (max-width: 1023px) {
  .story-promo {
    --shot: 19rem;
  }
}

@media (max-width: 767px) {
  .story-promo {
    --shot: 16rem;
  }
}

/* 手机上窗口占满卡片宽度，文字压缩成一行标题加一行卖点 */
@media (max-width: 639px) {
  .story-promo {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    padding: 0;
  }

  .story-promo::before,
  .story-promo::after {
    display: none;
  }

  .promo-shot {
    order: -1;
    border-radius: 0;
    box-shadow: none;
  }

  .promo-copy {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.25rem 0.75rem;
    padding: 0.75rem 0.875rem;
  }

  .promo-features {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    grid-row: 2;
    gap: 0.25rem 0.875rem;
    margin-top: 0;
  }

  .promo-features li {
    display: flex;
    gap: 0.25rem;
  }

  .promo-features :deep(svg) {
    width: 0.875rem;
    height: 0.875rem;
  }

  .promo-detail {
    display: none;
  }

  .promo-actions {
    margin-top: 0;
  }
}
</style>
