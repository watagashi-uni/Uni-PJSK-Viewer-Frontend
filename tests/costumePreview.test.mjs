import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import ts from 'typescript'

// Execute the real SFC and its template with Vue's renderer. GPU/network boundaries
// are replaced so role selection and retry behavior run without a browser or CDN.
const filename = new URL('../src/components/Costume3DPreview.vue', import.meta.url)
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename: filename.pathname })
const script = compileScript(descriptor, { id: 'costume-preview-test', inlineTemplate: true })
const code = ts.transpileModule(script.content, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText

const makeNode = type => ({
  type, props: {}, children: [], parent: null, text: '', style: {},
  getBoundingClientRect: () => ({ width: 700, height: 500 }),
  setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {},
})
const textOf = node => node.text + node.children.map(textOf).join('')
function find(node, predicate) {
  if (predicate(node)) return node
  for (const child of node.children) { const match = find(child, predicate); if (match) return match }
}
const flush = async () => { for (let i = 0; i < 12; i++) await Vue.nextTick() }

function mountPreview(props, options = {}) {
  const body = makeNode('body')
  const root = makeNode('root')
  const recipes = []
  const roles = []
  const modulesLoaded = []
  const originalOptions = []
  const backgrounds = []
  const yaws = []
  let engines = 0
  let destroyed = 0
  let masterFailed = false
  let initFailed = false
  let recipeFailed = false
  let backgroundFailed = false
  const globals = new Map(['window', 'document', 'ResizeObserver', 'IntersectionObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const previousError = console.error
  const errors = []
  console.error = (...args) => errors.push(args)
  globalThis.window = { fetch: async () => new Response(), setTimeout, clearTimeout, location: new URL('http://localhost/') }
  globalThis.document = {
    hidden: false, body,
    head: { appendChild() {} },
    createElement: makeNode,
    addEventListener() {}, removeEventListener() {},
  }
  globalThis.ResizeObserver = class { observe() {} disconnect() {} }
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} }
  const kernel = {
    async load(recipe) {
      if (options.failRecipe && !recipeFailed) { recipeFailed = true; throw new Error('temporary package failure') }
      recipes.push(recipe)
    },
    play() {}, pause() {}, resize() {}, async destroy() { destroyed++ },
  }
  class FakeEngine {
    constructor() { engines++ }
    setProjectedShadowSettings() {
      if (options.failInit && !initFailed) { initFailed = true; throw new Error('temporary engine failure') }
    }
    destroy() { destroyed++ }
  }
  const fakeMaster = {
    async getMaster(name) {
      if (options.waitForMaster) await options.waitForMaster
      if (options.failMaster && !masterFailed) { masterFailed = true; throw new Error('temporary master failure') }
      return name === 'gameCharacters'
        ? [{ id: 21, unit: 'piapro' }]
        : [{ id: 1, characterId: 21, unit: 'piapro' }, { id: 2, characterId: 21, unit: 'light_music_club' }]
    },
  }
  const modules = {
    vue: { ...Vue, vModelSelect: {} },
    'lucide-vue-next': Object.fromEntries(['Box', 'RotateCcw', 'Maximize2', 'Minimize2'].map(name => [name, { render: () => Vue.h('i') }])),
    '@/stores/master': { useMasterStore: () => fakeMaster },
    '@/utils/haruki3d': {
      HARUKI_ORIGINAL_ENABLED: Boolean(options.original),
      PJSK_3D_ASSETS_BASE_URL: options.original ? '/__local_3d/' : 'https://assets.example/jp/',
      PJSK_3D_BASIS_PATH: '/basis/', isWebGL2Supported: () => true,
    },
    '@/utils/haruki3dRegistry': {
      async loadRuntimeRoleData(characterId, unit) {
        roles.push(`${characterId}:${unit}`)
        if (options.missingRole) throw new Error('该角色暂无完整的 3D role catalog')
        return { defaults: { bodyCostume3dId: 1, headCostume3dId: 2, hairCostume3dId: 3 }, registry: [] }
      },
      findRuntimePart: () => undefined, runtimePartSlot: entry => entry.partType,
    },
    'haruki-3d-engine/internal': {
      Haruki3DEngine: FakeEngine, createHaruki3DKernelRuntime: () => kernel, previewLightDefaults: {},
    },
    'alone-3d-engine': {
      createHaruki3DKernel(settings) {
        engines++
        originalOptions.push(settings)
        return {
          ...kernel,
          setViewYawDegrees: degrees => yaws.push(degrees),
          async setBackground(background) {
            if (options.failBackground && !backgroundFailed) { backgroundFailed = true; throw new Error('temporary background failure') }
            backgrounds.push(background)
          },
        }
      },
    },
    'three/examples/jsm/controls/OrbitControls.js': { OrbitControls: class {} },
    three: {},
  }
  const output = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => {
    assert.ok(name in modules, `unexpected dependency ${name}`)
    modulesLoaded.push(name)
    return modules[name]
  }, output, output.exports)
  const renderer = Vue.createRenderer({
    createElement: makeNode, createText: text => ({ ...makeNode('text'), text }),
    createComment: () => ({ ...makeNode('comment'), text: '' }),
    setText: (node, text) => { node.text = text },
    setElementText: (node, text) => { node.text = text; node.children = [] },
    parentNode: node => node.parent,
    nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
    insert(node, parent, anchor = null) {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
      const index = anchor ? parent.children.indexOf(anchor) : -1
      if (index < 0) parent.children.push(node); else parent.children.splice(index, 0, node)
      node.parent = parent
    },
    remove(node) { node.parent?.children.splice(node.parent.children.indexOf(node), 1); node.parent = null },
    patchProp: (node, key, _previous, next) => { node.props[key] = next },
    querySelector: selector => selector === 'body' ? body : null,
  })
  const state = Vue.reactive(props)
  const app = renderer.createApp({ render: () => Vue.h(output.exports.default, state) })
  app.mount(root)
  let mounted = true
  return {
    state, recipes, roles, root, errors, modulesLoaded, originalOptions, backgrounds, yaws,
    engines: () => engines, destroyed: () => destroyed,
    async click(label) {
      const button = find(root, node => node.type === 'button' && textOf(node).includes(label))
      assert.ok(button, `button ${label} is rendered`)
      await button.props.onClick()
      await flush()
    },
    unmount() { if (mounted) { app.unmount(); mounted = false } },
    close() {
      this.unmount()
      console.error = previousError
      for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
      }
    },
  }
}

test('parent unit drives role and body defaults, including later VS unit changes', async () => {
  const preview = mountPreview({ characterId: 21, unit: 'light_music_club' })
  try {
    await preview.click('加载 3D 预览')
    assert.equal(preview.recipes.at(-1).roleId, '21:light_music_club')
    assert.equal(preview.recipes.at(-1).bodyRoleId, '21:light_music_club')
    assert.equal(find(preview.root, node => node.type === 'select'), undefined, 'controlled preview has no second unit selector')
    preview.state.unit = 'piapro'
    await flush()
    assert.equal(preview.recipes.at(-1).roleId, '21:piapro')
    assert.equal(preview.recipes.at(-1).bodyRoleId, '21:piapro')
    preview.state.bodyRole = { characterId: 1, unit: 'light_music_club' }
    await flush()
    assert.equal(preview.recipes.at(-1).roleId, '21:piapro')
    assert.equal(preview.recipes.at(-1).bodyRoleId, '1:light_music_club', 'cross-body role remains independent')
  } finally { preview.close() }
})

test('costume details retain their own unit selector when no parent unit is supplied', async () => {
  const preview = mountPreview({ characterId: 21 })
  try {
    await preview.click('加载 3D 预览')
    assert.equal(preview.recipes.at(-1).roleId, '21:piapro')
    const select = find(preview.root, node => node.type === 'select')
    assert.ok(select)
    select.props['onUpdate:modelValue']('light_music_club')
    await flush()
    assert.equal(preview.recipes.at(-1).roleId, '21:light_music_club')
  } finally { preview.close() }
})

for (const failure of ['failMaster', 'failInit', 'failRecipe']) {
  test(`retry recovers ${failure} without remounting the preview`, async () => {
    const preview = mountPreview({ characterId: 21, unit: 'piapro' }, { [failure]: true })
    try {
      await preview.click('加载 3D 预览')
      assert.equal(preview.recipes.length, 0)
      if (failure === 'failInit') assert.equal(preview.destroyed(), 1, 'partially initialized engine is released')
      await preview.click('重试')
      assert.equal(preview.recipes.length, 1)
      assert.equal(preview.recipes[0].roleId, '21:piapro')
      assert.equal(preview.engines(), failure === 'failInit' ? 2 : 1)
    } finally { preview.close() }
  })
}

test('leaving during initialization never creates a detached engine', async () => {
  let finishMaster
  const waitForMaster = new Promise(resolve => { finishMaster = resolve })
  const preview = mountPreview({ characterId: 21, unit: 'piapro' }, { waitForMaster })
  try {
    const loading = preview.click('加载 3D 预览')
    await flush()
    preview.unmount()
    finishMaster()
    await loading
    assert.equal(preview.engines(), 0)
    assert.equal(preview.recipes.length, 0)
  } finally { preview.close() }
})

test('original engine stays lazy and supports background, motion and pointer view controls', async () => {
  const preview = mountPreview({ characterId: 21, unit: 'piapro' }, { original: true })
  try {
    assert.equal(preview.modulesLoaded.includes('alone-3d-engine'), false)
    await preview.click('加载 3D 预览')
    assert.equal(preview.originalOptions[0].assetBaseUrl, 'http://localhost/__local_3d/')
    assert.equal(preview.originalOptions[0].background, 'transparent')
    assert.equal(preview.modulesLoaded.includes('haruki-3d-engine/internal'), false)
    assert.equal(preview.modulesLoaded.includes('three/examples/jsm/controls/OrbitControls.js'), false)
    assert.equal(preview.recipes.at(-1).motionRoleId, null)
    await preview.click('显示原版背景')
    await preview.click('隐藏原版背景')
    assert.deepEqual(preview.backgrounds, ['archive', 'transparent'])
    assert.equal(preview.recipes.length, 1, 'background changes do not reload the costume')
    const motion = find(preview.root, node => node.props['aria-label'] === '展示动作来源')
    motion.props['onUpdate:modelValue']('21:light_music_club')
    await flush()
    assert.equal(preview.recipes.at(-1).motionRoleId, '21:light_music_club')
    assert.equal(preview.recipes.at(-1).roleId, '21:piapro', 'motion does not replace the selected character')
    const canvas = find(preview.root, node => node.type === 'canvas')
    canvas.props.onPointerdown({ button: 0, isPrimary: true, pointerId: 1, clientX: 0 })
    canvas.props.onPointermove({ pointerId: 1, clientX: 350 })
    canvas.props.onPointerup({ pointerId: 1 })
    canvas.props.onPointermove({ pointerId: 1, clientX: 700 })
    assert.deepEqual(preview.yaws, [0, 90], 'drag ends on pointer release')
  } finally { preview.close() }
})

test('missing original role is reported without substituting another character', async () => {
  const preview = mountPreview({ characterId: 1, unit: 'light_music_club' }, { original: true, missingRole: true })
  try {
    await preview.click('加载 3D 预览')
    assert.deepEqual(preview.roles, ['1:light_music_club'])
    assert.equal(preview.recipes.length, 0)
    assert.match(textOf(preview.root), /该角色暂无完整的 3D role catalog/)
  } finally { preview.close() }
})

test('background failure keeps the costume available and allows another attempt', async () => {
  const preview = mountPreview({ characterId: 21, unit: 'piapro' }, { original: true, failBackground: true })
  try {
    await preview.click('加载 3D 预览')
    await preview.click('显示原版背景')
    assert.match(textOf(preview.root), /背景加载失败/)
    await preview.click('显示原版背景')
    assert.deepEqual(preview.backgrounds, ['archive'])
    assert.equal(preview.recipes.length, 1)
    assert.equal(preview.engines(), 1)
  } finally { preview.close() }
})

test('local original assets require the development flag and cannot become the production default', async () => {
  const source = readFileSync(new URL('../src/utils/haruki3d.ts', import.meta.url), 'utf8')
  for (const env of [{ DEV: true, VITE_LOCAL_3D_STORE: '1' }, { DEV: true }, { DEV: false, VITE_LOCAL_3D_STORE: '1' }]) {
    const config = ts.transpileModule(source.replaceAll('import.meta.env', JSON.stringify(env)), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText
    const values = await import(`data:text/javascript;base64,${Buffer.from(config).toString('base64')}`)
    const enabled = env.DEV && env.VITE_LOCAL_3D_STORE === '1'
    assert.equal(values.HARUKI_ORIGINAL_ENABLED, enabled)
    assert.equal(values.PJSK_3D_ASSETS_BASE_URL, enabled ? '/__local_3d/' : 'https://3d-export.unipjsk.com/jp/')
  }
})
