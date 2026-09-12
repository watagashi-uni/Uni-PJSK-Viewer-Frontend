import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
const source = readFileSync(new URL('../src/utils/storyPlayback.ts', import.meta.url), 'utf8')
  .replace('import.meta.env.VITE_STORY_ASSET_BASE_URL', 'undefined')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const { buildStoryFrames, voicePaths, backgroundPath, bgmPath } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('script order, repeated lines and scene state survive seeking', () => {
  const frames = buildStoryFrames({
    FirstBackground: 'bg_a000000', FirstBgm: 'bgm00040',
    TalkData: [{ Body: 'first' }, { Body: 'second' }],
    SpecialEffectData: [{ EffectType: 7, StringValSub: 'bg_e000702' }, { EffectType: 8, StringVal: '病院' }],
    SoundData: [{ Bgm: 'bgm00000' }, { Bgm: 'bgm00039_01' }],
    Snippets: [{ Action: 1, ReferenceIndex: 1 }, { Action: 6, ReferenceIndex: 0 }, { Action: 6, ReferenceIndex: 1 },
      { Action: 7, ReferenceIndex: 0 }, { Action: 1, ReferenceIndex: 0 }, { Action: 7, ReferenceIndex: 1 }, { Action: 1, ReferenceIndex: 0 }],
  })
  assert.deepEqual(frames.map(x => x.talk.Body), ['second', 'first', 'first'])
  assert.equal(new Set(frames.map(x => x.key)).size, 3)
  assert.equal(frames[0].background, 'bg_a000000')
  assert.equal(frames[1].background, 'bg_e000702')
  assert.equal(frames[1].location, '病院')
  assert.equal(frames[1].bgm, '')
  assert.equal(frames[2].bgm, 'bgm00039_01')
})
test('missing snippets retain readable lines; invalid references do not crash', () => {
  assert.equal(buildStoryFrames({ TalkData: [{}, { Body: 'text' }] }).length, 1)
  assert.equal(buildStoryFrames({ TalkData: [{ Body: 'text' }], Snippets: [{ Action: 1, ReferenceIndex: 999 }] }).length, 1)
  assert.throws(() => buildStoryFrames({}), /格式/)
})
test('voices use actual event and card directories without arbitrary path access', () => {
  assert.equal(voicePaths('event_01_01', 'voice_ev_band_01_1_01_02')[0], 'ondemand/sound/scenario/voice/event_01_01/voice_ev_band_01_1_01_02.mp3')
  assert.equal(voicePaths('001001_ichika01', 'voice_card_01_01a_01_01')[0], 'ondemand/sound/card_scenario/voice/001001_ichika01/voice_card_01_01a_01_01.mp3')
  assert.deepEqual(voicePaths('../secret', 'voice'), [])
  assert.deepEqual(voicePaths('event_01_01', '//example.com/a'), [])
})
test('manifest resolves nonstandard backgrounds; new conventional paths still work', () => {
  const media = { backgrounds: { bg_s000569: 'ondemand/scenario/background/background/bg_s000569.png' }, bgm: {}, comics: [] }
  assert.equal(backgroundPath('bg_s000569', media), media.backgrounds.bg_s000569)
  assert.equal(backgroundPath('bg_new', media), 'ondemand/scenario/background/bg_new/bg_new.png')
  assert.equal(backgroundPath('../bad', media), '')
  assert.equal(bgmPath('bgm00000', media), '')
})
test('published gallery contains only intended global media types', () => {
  const media = JSON.parse(readFileSync(new URL('../public/data/story-media-index.json', import.meta.url)))
  assert.ok(Object.keys(media.backgrounds).length > 1000)
  assert.ok(media.comics.length > 50)
  assert.equal(media.backgrounds.bg_s000636, 'ondemand/scenario/background/bg_s000636/scenariobgdata.png')
  assert.equal(media.backgrounds.bg_a000702, 'ondemand/scenario/background/bg_a000702/bg_a000702.png')
  assert.equal(media.backgrounds.bg_c000702, 'ondemand/scenario/background/bg_c000702/bg_a000702.png')
  for (const path of Object.values(media.backgrounds)) assert.match(path, /^ondemand\/scenario\/background\/.+\.png$/)
  for (const path of Object.values(media.bgm)) assert.match(path, /^(ondemand\/sound\/scenario\/bgm|ondemand\/unit_story)\/.+\.mp3$/)
  for (const path of media.comics) assert.match(path, /^startapp\/comic\/one_frame\/comic_\d+\.png$/)
})
