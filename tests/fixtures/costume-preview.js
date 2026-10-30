import { createApp, h, reactive } from 'vue'
import { createPinia } from 'pinia'
import Costume3DPreview from '../../src/components/Costume3DPreview.vue'
import { useMasterStore } from '../../src/stores/master'
import '../../src/style.css'

const pinia = createPinia()
const store = useMasterStore(pinia)
// Only master metadata is fixed; the real registry, original bundles, textures,
// engine, shaders and canvas all come through the local development server.
const tables = {
  gameCharacters: [
    { id: 21, firstName: '初音', givenName: 'ミク', unit: 'piapro' },
    { id: 1, firstName: '星乃', givenName: '一歌', unit: 'light_sound' },
  ],
  character3ds: [
    { id: 21, characterId: 21, unit: 'piapro' },
    { id: 27, characterId: 21, unit: 'light_sound' },
    { id: 1, characterId: 1, unit: 'light_sound' },
  ],
}
store.getMaster = async name => tables[name] ?? []
const props = reactive({ characterId: 21, unit: 'piapro' })
const app = createApp({ render: () => h(Costume3DPreview, props) })
app.use(pinia).mount('#preview')
window.costumePreviewFixture = { props, unmount: () => app.unmount() }
