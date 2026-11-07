<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ShieldAlert, X } from 'lucide-vue-next'
import { useModalDialog } from '@/composables/useModalDialog'
import { useSettingsStore } from '@/stores/settings'

// 开启剧透前的规则确认。按浏览器语言显示，可在弹窗里切换语言；
// 必须手动勾选同意后才能开启，取消或关闭都保持关闭。

type RulesLang = 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'en'
interface RulesText {
  label: string
  title: string
  rules: string[]
  agree: string
  confirm: string
  cancel: string
  close: string
  notice: string
}

const TEXTS: Record<RulesLang, RulesText> = {
  'zh-Hans': {
    label: '简体中文',
    title: '开启剧透内容前请阅读',
    rules: [
      '剧透内容包括尚未在游戏内公开的活动、卡面、歌曲、剧情等，仅供你本人浏览。',
      '请勿以任何形式将剧透内容转发、截图或搬运到其他平台、群聊或社交媒体。',
      '如果发现剧透内容大量外流，本站可能会永久关闭剧透功能，届时所有人都将无法查看。',
      '剧透内容来自游戏数据，可能与正式公开时不同，请以官方为准。',
    ],
    agree: '我已阅读并同意以上规则',
    confirm: '同意并开启',
    cancel: '取消',
    close: '关闭',
    notice: '剧透显示已关闭：开启前需要先阅读并同意新的使用规则。',
  },
  'zh-Hant': {
    label: '繁體中文',
    title: '開啟劇透內容前請閱讀',
    rules: [
      '劇透內容包括尚未在遊戲內公開的活動、卡面、歌曲、劇情等，僅供你本人瀏覽。',
      '請勿以任何形式將劇透內容轉發、截圖或搬運到其他平台、群組或社群媒體。',
      '如果發現劇透內容大量外流，本站可能會永久關閉劇透功能，屆時所有人都將無法查看。',
      '劇透內容來自遊戲資料，可能與正式公開時不同，請以官方為準。',
    ],
    agree: '我已閱讀並同意以上規則',
    confirm: '同意並開啟',
    cancel: '取消',
    close: '關閉',
    notice: '劇透顯示已關閉：開啟前需要先閱讀並同意新的使用規則。',
  },
  ja: {
    label: '日本語',
    title: 'ネタバレ表示を有効にする前にお読みください',
    rules: [
      'ネタバレには、ゲーム内でまだ公開されていないイベント・カード・楽曲・ストーリーなどが含まれます。ご本人の閲覧のみに限ります。',
      'ネタバレ内容を、転載・スクリーンショット・引用などいかなる形でも、他のサービス、グループチャット、SNS に持ち出さないでください。',
      'ネタバレ内容の大規模な流出が確認された場合、本サイトはネタバレ機能を恒久的に停止することがあります。その場合、すべての利用者が閲覧できなくなります。',
      'ネタバレ内容はゲームデータに基づくもので、正式公開時と異なる場合があります。公式の発表を優先してください。',
    ],
    agree: '上記のルールを読み、同意します',
    confirm: '同意して有効にする',
    cancel: 'キャンセル',
    close: '閉じる',
    notice: 'ネタバレ表示をオフにしました。有効にするには新しいルールへの同意が必要です。',
  },
  ko: {
    label: '한국어',
    title: '스포일러 표시를 켜기 전에 읽어 주세요',
    rules: [
      '스포일러에는 아직 게임에 공개되지 않은 이벤트, 카드, 곡, 스토리 등이 포함되며, 본인만 열람할 수 있습니다.',
      '스포일러 내용을 어떤 형태로든 다른 플랫폼, 단체 채팅방, SNS에 공유하거나 캡처하거나 옮기지 마세요.',
      '스포일러 내용이 대량으로 유출된 것이 확인되면 본 사이트는 스포일러 기능을 영구적으로 종료할 수 있으며, 이 경우 모든 이용자가 볼 수 없게 됩니다.',
      '스포일러 내용은 게임 데이터를 바탕으로 하며 정식 공개 시와 다를 수 있습니다. 공식 발표를 우선해 주세요.',
    ],
    agree: '위 규칙을 읽었으며 동의합니다',
    confirm: '동의하고 켜기',
    cancel: '취소',
    close: '닫기',
    notice: '스포일러 표시가 꺼졌습니다. 다시 켜려면 새 이용 규칙에 동의해야 합니다.',
  },
  en: {
    label: 'English',
    title: 'Before you turn on spoilers',
    rules: [
      'Spoilers include events, cards, songs and stories that have not yet been released in the game. They are for your own viewing only.',
      'Do not share, screenshot or repost spoiler content to any other platform, group chat or social media, in any form.',
      'If spoiler content leaks widely, this site may turn the spoiler feature off permanently for everyone.',
      'Spoilers come from game data and may differ from the official release. The official announcement always takes precedence.',
    ],
    agree: 'I have read and agree to these rules',
    confirm: 'Agree and turn on',
    cancel: 'Cancel',
    close: 'Close',
    notice: 'Spoilers have been turned off. To turn them on again, please read and agree to the new rules.',
  },
}
const LANGS = Object.keys(TEXTS) as RulesLang[]
const HTML_LANG: Record<RulesLang, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', ja: 'ja', ko: 'ko', en: 'en' }

function detectLang(): RulesLang {
  const list = typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language])
  for (const raw of list) {
    const tag = (raw || '').toLowerCase()
    if (/^zh-(hant|tw|hk|mo)\b/.test(tag)) return 'zh-Hant'
    if (/^zh\b/.test(tag)) return 'zh-Hans'
    if (/^ja\b/.test(tag)) return 'ja'
    if (/^ko\b/.test(tag)) return 'ko'
    if (/^en\b/.test(tag)) return 'en'
  }
  return 'en'
}

const settings = useSettingsStore()
const lang = ref<RulesLang>(detectLang())
const text = computed(() => TEXTS[lang.value])
const agreed = ref(false)
const enabling = computed(() => settings.spoilerRulesMode === 'enable')

const { onDialogClose } = useModalDialog('rulesDialog', () => settings.spoilerRulesOpen, () => settings.closeSpoilerRules())
// 每次打开都要重新勾选
watch(() => settings.spoilerRulesOpen, (open) => { if (open) agreed.value = false })

function confirm() {
  if (agreed.value) settings.acceptSpoilerRules()
}

// 迁移提示：显示一次，十秒后自动收起
const noticeLang = detectLang()
let noticeTimer: ReturnType<typeof setTimeout> | undefined
watch(() => settings.spoilerResetNotice, (show) => {
  clearTimeout(noticeTimer)
  if (show) noticeTimer = setTimeout(() => { settings.spoilerResetNotice = false }, 10000)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>

<template>
  <dialog ref="rulesDialog" class="modal modal-bottom sm:modal-middle" :lang="HTML_LANG[lang]" @close="onDialogClose">
    <div class="modal-box max-w-lg">
      <div class="flex items-start gap-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/15 text-warning"><ShieldAlert class="h-5 w-5" /></span>
        <h3 class="flex-1 pt-1.5 text-lg font-bold leading-snug">{{ text.title }}</h3>
        <select v-model="lang" class="select select-ghost select-xs w-auto shrink-0" aria-label="Language">
          <option v-for="code in LANGS" :key="code" :value="code">{{ TEXTS[code].label }}</option>
        </select>
      </div>
      <ol class="rules mt-4 space-y-2.5 text-sm leading-6 text-base-content/80">
        <li v-for="(rule, index) in text.rules" :key="index"><span class="rule-no">{{ index + 1 }}</span><span>{{ rule }}</span></li>
      </ol>
      <label v-if="enabling" class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-base-200/50 p-3">
        <input v-model="agreed" type="checkbox" class="checkbox checkbox-primary checkbox-sm mt-0.5" />
        <span class="text-sm font-medium">{{ text.agree }}</span>
      </label>
      <div class="modal-action">
        <template v-if="enabling">
          <button type="button" class="btn btn-ghost" @click="settings.closeSpoilerRules()">{{ text.cancel }}</button>
          <button type="button" class="btn btn-primary" :disabled="!agreed" @click="confirm">{{ text.confirm }}</button>
        </template>
        <button v-else type="button" class="btn" @click="settings.closeSpoilerRules()">{{ text.close }}</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>{{ text.cancel }}</button></form>
  </dialog>

  <Teleport to="body">
    <Transition name="spoiler-notice">
      <div v-if="settings.spoilerResetNotice" class="fixed bottom-4 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2" role="status" :lang="HTML_LANG[noticeLang]">
        <div class="alert border border-warning/40 bg-base-100 shadow-2xl">
          <ShieldAlert class="h-5 w-5 shrink-0 text-warning" />
          <span class="text-sm">{{ TEXTS[noticeLang].notice }}</span>
          <button type="button" class="btn btn-ghost btn-sm btn-circle" :aria-label="TEXTS[noticeLang].close" @click="settings.spoilerResetNotice = false"><X class="h-4 w-4" /></button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rules li { display: grid; grid-template-columns: 1.5rem 1fr; gap: 0.5rem; }
.rule-no { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; color: var(--color-primary); background: color-mix(in oklab, var(--color-primary) 12%, transparent); }
.spoiler-notice-enter-active, .spoiler-notice-leave-active { transition: opacity 0.2s, transform 0.2s; }
.spoiler-notice-enter-from, .spoiler-notice-leave-to { opacity: 0; transform: translateY(0.75rem); }
</style>
