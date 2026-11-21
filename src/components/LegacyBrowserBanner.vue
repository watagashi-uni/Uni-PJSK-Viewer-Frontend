<script setup lang="ts">
import { ref } from 'vue'
import { describeBrowser, detectPlatform, isLegacyBrowser, legacyBrowserAdvice } from '@/utils/browserSupport'

// 关闭后本次会话不再显示；下次打开网站仍会提醒
const DISMISS_KEY = 'legacy_browser_banner_dismissed'

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

const userAgent = navigator.userAgent
const visible = ref(isLegacyBrowser() && !readDismissed())
const browser = describeBrowser(userAgent)
const advice = legacyBrowserAdvice(detectPlatform(userAgent, navigator.maxTouchPoints))

function dismiss() {
  visible.value = false
  try {
    sessionStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // 存储不可用时只关闭当前页面的提示
  }
}
</script>

<template>
  <div v-if="visible" class="legacy-banner" role="alert">
    <div class="legacy-banner__body">
      <p class="legacy-banner__title">
        你的浏览器版本不兼容<template v-if="browser">（{{ browser }}）</template>，部分界面无法正常显示，并可能出现无法预料的问题。
      </p>
      <p class="legacy-banner__advice">{{ advice }}</p>
    </div>
    <button type="button" class="legacy-banner__close" aria-label="关闭提示" @click="dismiss">×</button>
  </div>
</template>

<style scoped>
/* 显示在旧浏览器上：只用固定颜色，不用 color-mix() 和主题变量 */
.legacy-banner {
  position: relative;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid #e8b44c;
  background: #fff3d1;
  color: #4a3300;
  font-size: 14px;
  line-height: 1.55;
}

.legacy-banner__body {
  flex: 1;
  min-width: 0;
}

.legacy-banner__title {
  margin: 0;
  font-weight: 700;
}

.legacy-banner__advice {
  margin: 2px 0 0;
}

.legacy-banner__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-left: 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #4a3300;
  font-size: 22px;
  line-height: 32px;
  cursor: pointer;
}

.legacy-banner__close:hover {
  background: #f5e0a8;
}
</style>
