import { createApp, h, reactive } from 'vue'
import { createPinia } from 'pinia'
import StoryReader from '../../src/components/StoryReader.vue'
import '../../src/style.css'

// The real scenario and every media file come from the asset origin; no game
// data is bundled into this fixture. Tests can route this origin to a local tree.
const props = reactive({
  title: '剧情播放验证', episodeLabel: 'Live2D', scenarioId: 'event_107_01',
  scenarioUrls: ['https://assets.unipjsk.com/ondemand/event_story/event_study_2023/scenario/event_107_01.json'],
})
const app = createApp({ render: () => h(StoryReader, props) })
app.use(createPinia())
app.mount('#preview')
window.storyPlayerFixture = { props, unmount: () => app.unmount() }
