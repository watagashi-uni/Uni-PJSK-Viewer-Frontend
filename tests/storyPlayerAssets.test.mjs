import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
const compile = file => ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const playback = url(compile('../src/utils/storyPlayback.ts'))
const source = compile('../src/utils/storyPlayerAssets.ts').replace("'./storyPlayback'", JSON.stringify(playback))
const { storyPlayerResolver, parsePlayerScenario, loadStoryPlayerIndex } = await import(url(source))
const { buildStoryFrames } = await import(playback)

test('native model, physics, case-insensitive shared and costume-specific motions', () => {
  const model = { modelDir: 'startapp/live2d/model/ichika', modelFile: 'ichika.model3', physicsPath: 'startapp/live2d/model/ichika/ichika.physics3', motionLibrary: 'v1/ichika', extraMotions: { 'motion/custom': 'startapp/live2d/model/ichika/motions/custom.motion3.json' } }
  const index = { models: { ichika: model }, motions: { 'v1/ichika': { 'motion/tiltheadb': 'startapp/live2d/motion/tiltheadb.motion3.json' } }, backgrounds: { bg_one: 'ondemand/scenario/background/bg_one/scenariobgdata.png' }, bgm: {}, se: {}, movies: {} }
  const assets = storyPlayerResolver(index, 'https://assets.unipjsk.com/scenario.json')
  assert.equal(assets.model(model), 'https://assets.unipjsk.com/startapp/live2d/model/ichika/ichika.model3')
  assert.match(assets.physics(model), /ichika\.physics3$/)
  assert.equal(assets.physics({}), null)
  assert.match(assets.motion(model, 'motion', 'tiltheadB'), /tiltheadb\.motion3\.json$/)
  assert.match(assets.motion(model, 'motion', 'CUSTOM'), /\/motions\/custom\.motion3\.json$/)
  assert.equal(assets.motion(model, 'facial', 'missing'), null)
  assert.match(assets.background('bg_one'), /scenariobgdata\.png$/)
  assert.equal(assets.bgm('bgm00000'), null)
  assert.equal(assets.movie('missing'), null)
  assert.match(assets.voice('001001_ichika01', 'voice_01')[0], /card_scenario/)
  assert.deepEqual(assets.voice('../bad', 'voice_01'), [])
})

test('resume and transcript seek use snippet indices rather than talk array indices', () => {
  const scenario = parsePlayerScenario({ TalkData: [{ Body: 'A' }, { Body: 'B' }],
    Snippets: [{ Action: 6, ReferenceIndex: 0 }, { Action: 1, ReferenceIndex: 1 }, { Action: 1, ReferenceIndex: 0 }, { Action: 1, ReferenceIndex: 1 }],
  }, 'episode')
  assert.equal(scenario.ScenarioId, 'episode')
  assert.deepEqual(scenario.LayoutData, [])
  assert.deepEqual(buildStoryFrames(scenario).map(x => x.snippetIndex), [1, 2, 3])
  assert.deepEqual(buildStoryFrames(scenario).map(x => x.talkIndex), [1, 0, 1])
  const withoutSnippets = parsePlayerScenario({ TalkData: [{ Body: 'A' }] }, 'episode')
  assert.equal(withoutSnippets.Snippets[0].Action, 1)
  assert.throws(() => parsePlayerScenario('<html>', 'episode'), /格式/)
})

test('index failures are surfaced and an aborted load cannot silently continue', async () => {
  const fetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('not found', { status: 404 })
    await assert.rejects(loadStoryPlayerIndex(new AbortController().signal), /目录/)
    globalThis.fetch = async () => new Response(JSON.stringify({ version: 2, models: {}, motions: {} }))
    await assert.rejects(loadStoryPlayerIndex(new AbortController().signal), /格式/)
    globalThis.fetch = async (_, options) => { options.signal.throwIfAborted() }
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(loadStoryPlayerIndex(controller.signal), { name: 'AbortError' })
  } finally { globalThis.fetch = fetch }
})
