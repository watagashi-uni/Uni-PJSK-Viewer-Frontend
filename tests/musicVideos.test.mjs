import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  new Function('exports', compiled)(exports)
  return exports
}
const videos = load('../src/utils/musicVideos.ts')
const timeline = load('../src/utils/mvSubtitleTimeline.ts')

test('a song plays the game MV, a rendition with its own MV plays that one', () => {
  const both = new Set(['mv', 'mv_2d', 'original'])
  assert.deepEqual(videos.musicVideoSources(8, { id: 10, type: 'sekai' }, both, undefined), [
    { kind: 'sekai', bundle: '0008' },
    { kind: 'original', bundle: '0008' },
  ])
  assert.deepEqual(videos.musicVideoSources(8, { id: 111, type: 'virtual_singer' }, new Set(['mv_2d']), '8005'), [{ kind: 'sekai', bundle: '8005' }])
  // The creator's own recording opens with the creator's MV.
  assert.equal(videos.musicVideoSources(8, { id: 9, type: 'original_song' }, both, undefined)[0].kind, 'original')
  assert.deepEqual(videos.musicVideoSources(342, { id: 842, type: 'virtual_singer' }, new Set(['original']), undefined), [{ kind: 'original', bundle: '0342' }])
  assert.deepEqual(videos.musicVideoSources(1, { id: 1, type: 'sekai' }, new Set(['mv', 'image']), undefined), [])
  assert.deepEqual(videos.musicVideoSources(1, { id: 1, type: 'sekai' }, undefined, undefined), [])
})

test('MV videos always come from the overseas host', () => {
  assert.equal(videos.musicVideoUrl({ kind: 'original', bundle: '0342' }), 'https://assets.unipjsk.com/ondemand/live/2dmode/original_mv/0342/0342.mp4')
  assert.equal(videos.musicVideoUrl({ kind: 'sekai', bundle: '8005' }), 'https://assets.unipjsk.com/ondemand/live/2dmode/sekai_mv/8005/8005.mp4')
})

test('KTV rows alternate, and the next line waits in the row the last one left', () => {
  const lines = [
    { start: 10, end: 13 },
    { start: 13, end: 16 },
    { start: 16, end: 19 },
    { start: 19, end: 22 },
  ]
  const t = timeline.subtitleTimeline(lines, 9)
  assert.deepEqual(t.map(x => x.slot), [0, 1, 0, 1])
  // The first verse is counted in; its second line arrives with the first.
  assert.equal(t[0].lead, true)
  assert.equal(t[0].show, 10 - timeline.KTV_PREVIEW_SEC)
  assert.equal(t[1].show, t[0].show)
  // Line 3 takes line 1's row as soon as line 1 is sung, which is also when line 1 leaves.
  assert.equal(t[2].show, 13)
  assert.equal(t[0].hide, 13)
  // Nothing replaces the last lines: they stay a moment, then go.
  assert.equal(t[3].hide, 22 + timeline.KTV_LINGER_SEC)
})

test('a long pause starts a new verse on the upper row', () => {
  const lines = [
    { start: 10, end: 13 },
    { start: 13, end: 16 },
    { start: 16, end: 19 },
    { start: 40, end: 43 },
    { start: 43, end: 46 },
  ]
  const t = timeline.subtitleTimeline(lines, 0)
  assert.deepEqual(t.map(x => x.slot), [0, 1, 0, 0, 1])
  assert.deepEqual(t.map(x => x.lead), [true, false, false, true, false])
  // Before the break the screen clears instead of showing the next verse early.
  assert.equal(t[2].hide, 19 + timeline.KTV_LINGER_SEC)
  assert.equal(t[3].show, 40 - timeline.KTV_PREVIEW_SEC)
  assert.equal(t[4].show, t[3].show)
})

test('a line is never shown after it has started, even when three lines overlap', () => {
  const lines = [
    { start: 10, end: 20 },
    { start: 11, end: 20 },
    { start: 12, end: 14 },
  ]
  const t = timeline.subtitleTimeline(lines, 0)
  assert.equal(t[2].show, 12)
  assert.equal(t[0].hide, 12)
})

test('a film subtitle lingers briefly but gives way to the next line', () => {
  const t = timeline.subtitleTimeline([
    { start: 10, end: 12 },
    { start: 12.2, end: 14 },
    { start: 20, end: 22 },
  ], 0)
  assert.equal(t[0].until, 12.2)
  assert.equal(t[1].until, 14 + timeline.LYRICS_LINGER_SEC)
})

test('the count-in goes out one dot at a time', () => {
  assert.equal(timeline.countInDots(3.5), 0)
  assert.equal(timeline.countInDots(3), 4)
  assert.equal(timeline.countInDots(2.2), 3)
  assert.equal(timeline.countInDots(0.1), 1)
  assert.equal(timeline.countInDots(0), 0)
})

const singing = load('../src/utils/singingTimeline.ts')

test('a word-timed line hands over between singers where the words change hands', () => {
  const line = {
    start: 10, end: 14, text: 'ABCD',
    segments: [{ text: 'AB', performerIds: ['1'] }, { text: 'CD', performerIds: ['2'] }],
    words: [{ from: 0, to: 1, start: 10, end: 11 }, { from: 1, to: 2, start: 11, end: 12 }, { from: 2, to: 3, start: 12, end: 13 }, { from: 3, to: 4, start: 13, end: 14 }],
  }
  assert.deepEqual(singing.lineVoices(line), [{ start: 10, ids: ['1'] }, { start: 12, ids: ['2'] }])
  const voices = [singing.lineVoices(line)]
  assert.deepEqual(singing.singersAt([line], voices, 11.5), ['1'])
  assert.deepEqual(singing.singersAt([line], voices, 12.5), ['2'])
  // Between lines nobody is singing: the caller keeps who it had.
  assert.equal(singing.singersAt([line], voices, 15), null)
})

test('a line without units is sung by everyone on it; lines sung together add up', () => {
  const lead = { start: 0, end: 4, text: 'la', performerIds: ['1', '2'] }
  const backing = { start: 2, end: 4, text: '(la)', segments: [{ text: '(la)', performerIds: ['3'] }] }
  const lines = [lead, backing]
  const voices = lines.map(singing.lineVoices)
  assert.deepEqual(singing.singersAt(lines, voices, 1), ['1', '2'])
  assert.deepEqual(singing.singersAt(lines, voices, 3), ['1', '2', '3'])
})

test('the cast on screen is worked out ahead: whole cast first, then whoever sings, briefly heard voices let pass', () => {
  const line = (start, end, ids, text = 'la') => ({ start, end, text, performerIds: ids })
  const lines = [
    line(10, 14, ['a']),
    line(14, 14.3, ['b']), // a word thrown in
    line(14.3, 18, ['a']),
    line(18, 22, ['a', 'b']),
    line(30, 34, ['b']), // after a break
    line(34, 38, ['b']),
  ]
  const ids = { a: 1, b: 2 }
  const cues = singing.castTimeline(lines, { cast: [1, 2], characterOf: id => ids[id], maxHold: 100 })
  assert.deepEqual(cues.map(c => [c.time, c.characters]), [
    [0, [1, 2]],
    [10, [1]],
    [18, [1, 2]],
    [30, [2]],
  ])
  assert.equal(singing.cueAt(cues, 5), 0)
  assert.equal(singing.cueAt(cues, 18), 2)
  assert.equal(singing.cueAt(cues, 29.9), 2)
})

test('one voice holding the screen gets new cards; so does the same voice after a break', () => {
  const lines = [
    { start: 5, end: 40, text: 'la', performerIds: ['a'] },
    { start: 45, end: 50, text: 'la', performerIds: ['a'] },
  ]
  const cues = singing.castTimeline(lines, { cast: [1], characterOf: () => 1, maxHold: 14 })
  // The intro already shows the one singer, so the first line changes nothing; the long hold does.
  assert.deepEqual(cues.map(c => c.time), [0, 14, 28, 45])
})
