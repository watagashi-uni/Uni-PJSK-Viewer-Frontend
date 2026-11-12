import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
const compiled = ts.transpileModule(readFileSync(new URL('../src/api/lyrics.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
function load(fetcher) {
  const exports = {}
  new Function('exports', 'require', 'fetch', compiled)(exports, () => ({ masterApiBaseUrl: 'https://example.test' }), fetcher)
  return exports
}
test('LRC supports repeated timestamps, simultaneous cues and final duration', () => {
  const { parseLrc } = load()
  assert.deepEqual(parseLrc('[ar:test]\n[00:09.500][01:02.25]歌詞\n[00:09.500]合唱\n[00:15.00]次の句', 80), [
    { start: 9.5, end: 15, text: '歌詞' }, { start: 9.5, end: 15, text: '合唱' },
    { start: 15, end: 62.25, text: '次の句' }, { start: 62.25, end: 80, text: '歌詞' },
  ])
})
test('translation groups span original lines; rich partial text and roles survive', () => {
  const { normalizeLyrics } = load()
  const song = normalizeLyrics({ format: 'lrc', duration: 20, lrc: '[00:09.0]A\n[00:11.0]B', translationLrc: '[00:09.0]甲乙' })
  assert.deepEqual(song.lines.map(l => l.translation), ['甲乙', '甲乙'])
  const line = { start: 9, end: 10, text: 'ヘイ', segments: [{ text: 'ヘイ', performerIds: ['singer'] }] }
  assert.deepEqual(normalizeLyrics({ format: 'bilingual_json', duration: 20, lines: [line] }).lines, [line])
})
test('requests deduplicate, absent songs skip payload, and failed payload retries', async () => {
  const calls = []
  let fail = true
  const api = load(async url => {
    calls.push(url)
    if (url.endsWith('version.json')) return { ok: true, json: async () => ({ v: 1, songs: { 1: '0123456789abcdef' } }) }
    if (fail) throw new Error('offline')
    return { ok: true, json: async () => ({ musicId: 1, format: 'lrc', duration: 20, lrc: '[00:09]test' }) }
  })
  assert.equal(api.loadSongLyrics(1), api.loadSongLyrics(1))
  await assert.rejects(api.loadSongLyrics(1))
  fail = false
  assert.equal((await api.loadSongLyrics(1)).lines[0].start, 9)
  assert.equal(await api.loadSongLyrics(2), null)
  assert.equal(calls.length, 3)
})
test('word fill clamps, preserves timing gaps, seeks backwards and supports zero-duration units', () => {
  const { wordProgress } = load()
  const word = { start: 10, end: 12 }
  assert.equal(wordProgress(9, word), 0)
  assert.equal(wordProgress(11, word), .5)
  assert.equal(wordProgress(13, word), 1)
  assert.equal(wordProgress(10.5, word), .25)
  assert.equal(wordProgress(10, { start: 10, end: 10 }), 1)
})
test('word rendering preserves punctuation, spaces, Unicode and singer assignments', () => {
  const { lyricParts } = load()
  const line = { text: '「あ😀 B」', segments: [{ text: '「あ😀 ', performerIds: ['a'] }, { text: 'B」', performerIds: ['b'] }], words: [{ from: 1, to: 2, start: 1, end: 2 }, { from: 5, to: 6, start: 3, end: 4 }] }
  const parts = lyricParts(line)
  assert.equal(parts.map(p => p.text).join(''), line.text)
  assert.deepEqual(parts.filter(p => p.word).map(p => p.performerIds), [['a'], ['b']])
})
test('LRC gains words from its original cue; malformed ranges fall back to line highlighting', () => {
  const { normalizeLyrics } = load()
  const words = [{ from: 0, to: 1, start: 8.9, end: 9.5 }]
  const data = normalizeLyrics({ format: 'lrc', duration: 20, lrc: '[00:09]A', wordLines: [{ cueStart: 9, start: 8.9, end: 20, text: 'A', words }] })
  assert.deepEqual(data.lines[0].words, words)
  assert.equal(data.lines[0].start, 8.9)
  const bad = normalizeLyrics({ format: 'bilingual_json', duration: 20, lines: [{ start: 1, end: 2, text: 'A', words: [{ from: 0, to: 2, start: 1, end: 2 }] }] })
  assert.equal(bad.lines[0].words, undefined)
})
