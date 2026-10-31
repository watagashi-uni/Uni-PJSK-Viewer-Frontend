import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
const source = readFileSync(new URL('../src/utils/storyPlayback.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const { buildStoryFrames, voicePaths, specialScenarioPath } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('special scenarios resolve from the episode bundle and fall back to the parent', () => {
  const available = new Set([
    'startapp/scenario/special/story_1st_countdown/1st_countdown_01.json',
    'startapp/scenario/special/special-story/op_01.json',
  ])
  const countdown = { assetbundleName: 'story_1st_countdown', scenarioId: '1st_countdown_01' }
  assert.equal(specialScenarioPath('special-story', countdown, available), 'startapp/scenario/special/story_1st_countdown/1st_countdown_01.json')
  const opening = { assetbundleName: 'story_sp_ts_01_01', scenarioId: 'op_01' }
  assert.equal(specialScenarioPath('special-story', opening, available), 'startapp/scenario/special/special-story/op_01.json')
  assert.equal(specialScenarioPath('special-story', { ...opening, scenarioId: 'op_03' }, available), undefined)
})

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
