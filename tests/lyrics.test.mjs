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
  // a timestamp without text ends the line before it instead of showing as a line
  assert.deepEqual(parseLrc('[00:01.0]A\n[00:03.0]B\n[00:05.0]', 80), [{ start: 1, end: 3, text: 'A' }, { start: 3, end: 5, text: 'B' }])
})
test('a translation row shows once, under the line it starts on; rich partial text and roles survive', () => {
  const { normalizeLyrics } = load()
  // one row written for two lines is not repeated under the second
  const song = normalizeLyrics({ format: 'lrc', duration: 20, lrc: '[00:09.0]A\n[00:11.0]B', translationLrc: '[00:09.0]甲乙' })
  assert.deepEqual(song.lines.map(l => l.translation), ['甲乙', undefined])
  // rows on their own lines; an untranslated line in between stays empty instead of inheriting
  const perLine = normalizeLyrics({ format: 'lrc', duration: 20, lrc: '[00:09.0]A\n[00:11.0]B\n[00:13.0]C\n[00:15.0]D', translationLrc: '[00:09.0]甲\n[00:13.0]丙\n[00:15.0]丁' })
  assert.deepEqual(perLine.lines.map(l => l.translation), ['甲', undefined, '丙', '丁'])
  // two rows landing on the same line are both kept; a row with no line under it is dropped
  const odd = normalizeLyrics({ format: 'lrc', duration: 20, lrc: '[00:09.0]A\n[00:15.0]B', translationLrc: '[00:09.0]甲\n[00:09.0]乙\n[00:12.0]无主\n[00:15.0]丙' })
  assert.deepEqual(odd.lines.map(l => l.translation), ['甲 乙', '丙'])
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
  const payload = await api.loadSongLyrics(1)
  // the resource is kept as published; renditions are derived from it
  assert.equal(payload.lrc, '[00:09]test')
  assert.equal(api.normalizeLyrics(payload).lines[0].start, 9)
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
test('untimed text is cut where the singers change, and nothing is lost', () => {
  const { lyricParts, linePerformerIds } = load()
  const line = { text: 'Oh… up　灯火を', performerIds: ['c'], segments: [{ text: 'Oh… up　', performerIds: ['a'] }, { text: '灯火を', performerIds: ['b'] }] }
  const parts = lyricParts(line)
  assert.deepEqual(parts, [{ text: 'Oh… up　', performerIds: ['a'] }, { text: '灯火を', performerIds: ['b'] }])
  assert.deepEqual(linePerformerIds(line), ['c', 'a', 'b'])
  // timed units inside each singer's stretch, punctuation between them stays with its singer
  const timed = lyricParts({ ...line, words: [{ from: 0, to: 2, start: 1, end: 2 }, { from: 7, to: 9, start: 3, end: 4 }] })
  assert.equal(timed.map(p => p.text).join(''), line.text)
  assert.deepEqual(timed.map(p => [p.text, !!p.word, p.performerIds.join()]), [['Oh', true, 'a'], ['… up　', false, 'a'], ['灯火', true, 'b'], ['を', false, 'b']])
  // text beyond the annotated segments has no singer; a line without segments is one piece
  assert.deepEqual(lyricParts({ text: 'AB', segments: [{ text: 'A', performerIds: ['a'] }] }).map(p => p.performerIds), [['a'], []])
  assert.deepEqual(lyricParts({ text: 'AB' }), [{ text: 'AB', performerIds: [] }])
})
test('cast singers map to game characters; guests and junk have no portrait', () => {
  const { performerCharacterId } = load()
  assert.equal(performerCharacterId('歌唱者-21'), 21)
  assert.equal(performerCharacterId('歌唱者-01'), 1)
  assert.equal(performerCharacterId('21'), 21)
  assert.equal(performerCharacterId('外部歌唱者-02'), null)
  assert.equal(performerCharacterId('歌唱者-27'), null)
  assert.equal(performerCharacterId('歌唱者-0'), null)
  assert.equal(performerCharacterId(''), null)
})
test('long silences become waiting markers; overlapping lines do not open a gap early', () => {
  const { lyricGaps } = load()
  const lines = [{ start: 9, end: 12 }, { start: 11, end: 20 }, { start: 13, end: 14 }, { start: 27, end: 30 }, { start: 33, end: 40 }]
  // intro from the trimmed start; the break is measured from the last voice to stop (20), not the last line to start
  assert.deepEqual(lyricGaps(lines, 2), [{ start: 2, end: 9, before: 0 }, { start: 20, end: 27, before: 3 }])
  assert.deepEqual(lyricGaps(lines, 8), [{ start: 20, end: 27, before: 3 }])
  assert.deepEqual(lyricGaps([], 0), [])
})
test('LRC readings match the original cue before word timing moves the line; JSON readings are read per line', () => {
  const { normalizeLyrics } = load()
  const ruby = [{ from: 0, to: 1, reading: 'かたち' }]
  const song = normalizeLyrics({
    format: 'lrc', duration: 30, lrc: '[00:09.0]形の\n[00:12.0]形の\n[00:15.0]別', translationLrc: '[00:09.0]形状',
    wordLines: [{ cueStart: 9, start: 8.7, end: 11, text: '形の', words: [{ from: 0, to: 2, start: 8.7, end: 9.5 }] }],
    // the second entry names a cue that does not exist; the third names the right cue with other text
    rubyLines: [{ cueStart: 9, text: '形の', ruby }, { cueStart: 13, text: '形の', ruby }, { cueStart: 15, text: '他', ruby }],
  })
  assert.deepEqual(song.lines.map(l => [l.start, l.ruby, l.translation]), [[8.7, ruby, '形状'], [12, undefined, undefined], [15, undefined, undefined]])
  // malformed, empty and overlapping readings are dropped; the rest are sorted
  const json = normalizeLyrics({ format: 'bilingual_json', duration: 20, lines: [{ start: 1, end: 2, text: '考える人', ruby: [{ from: 3, to: 4, reading: 'ひと' }, { from: 0, to: 1, reading: 'かんが' }, { from: 0, to: 2, reading: 'x' }, { from: 2, to: 9, reading: 'x' }, { from: 1, to: 2, reading: ' ' }] }] })
  assert.deepEqual(json.lines[0].ruby, [{ from: 0, to: 1, reading: 'かんが' }, { from: 3, to: 4, reading: 'ひと' }])
  // old resources without readings are unchanged
  assert.equal(normalizeLyrics({ format: 'lrc', duration: 20, lrc: '[00:09]A' }).lines[0].ruby, undefined)
})
test('readings group the text they cover; a unit cut by a reading keeps its timing and fills in turn', () => {
  const { lyricRuns, pieceProgress, wordProgress } = load()
  // one unit spanning a reading and kana after it, then a reading over two units
  const a = { from: 0, to: 4, start: 1, end: 3 }
  const b = { from: 4, to: 5, start: 3, end: 4 }
  const c = { from: 5, to: 6, start: 4, end: 5 }
  const line = { text: '人見知り気持', words: [a, b, c], ruby: [{ from: 0, to: 3, reading: 'ひとみし' }, { from: 4, to: 6, reading: 'きも' }] }
  const runs = lyricRuns(line)
  assert.deepEqual(runs.map(r => [r.reading, r.pieces.map(p => p.text).join('')]), [['ひとみし', '人見知'], [undefined, 'り'], ['きも', '気持']])
  assert.equal(runs.flatMap(r => r.pieces).map(p => p.text).join(''), line.text)
  const [head] = runs[0].pieces
  const [tail] = runs[1].pieces
  assert.equal(head.word, a)
  assert.equal(tail.word, a)
  assert.deepEqual([head.share, tail.share], [[0, 0.75], [0.75, 1]])
  // whole units under a reading are not cut
  assert.deepEqual(runs[2].pieces.map(p => [p.word, p.share]), [[b, undefined], [c, undefined]])
  // halfway through the unit: the reading's text is two-thirds filled, the tail has not started
  const p = wordProgress(2, a)
  assert.equal(pieceProgress(p, head.share).toFixed(3), '0.667')
  assert.equal(pieceProgress(p, tail.share), 0)
  assert.equal(pieceProgress(wordProgress(3, a), tail.share), 1)
  // zero-length units still finish at their start
  assert.equal(pieceProgress(wordProgress(1, { start: 1, end: 1 }), [0.5, 1]), 1)
  // untimed lines and lines without readings
  assert.deepEqual(lyricRuns({ text: '考える', ruby: [{ from: 0, to: 1, reading: 'かんが' }] }).map(r => [r.reading, r.pieces.map(p => [p.text, !!p.word])]), [['かんが', [['考', false]]], [undefined, [['える', false]]]])
  assert.deepEqual(lyricRuns({ text: 'AB' }), [{ pieces: [{ text: 'AB', part: 0 }] }])
})
test('untimed text on a word-timed line fills with its neighbours; a long pause does not stretch it', () => {
  const { untimedFill } = load()
  const words = [{ from: 1, to: 2, start: 10, end: 11 }, { from: 3, to: 4, start: 11, end: 12 }, { from: 5, to: 6, start: 15, end: 16 }]
  // 「あ、い…う」: opening bracket with the first unit, comma between touching units, ellipsis over a pause, closing after the last
  assert.deepEqual(untimedFill(words, 0, 1), { start: 10, end: 10 })
  assert.deepEqual(untimedFill(words, 2, 3), { start: 11, end: 11 })
  assert.deepEqual(untimedFill(words, 4, 5), { start: 12, end: 12.25 })
  assert.deepEqual(untimedFill(words, 6, 7), { start: 16, end: 16 })
  // overlapping neighbours never run backwards; lines without units have no fill
  assert.deepEqual(untimedFill([{ from: 0, to: 1, start: 1, end: 3 }, { from: 2, to: 3, start: 2, end: 4 }], 1, 2), { start: 3, end: 3 })
  assert.equal(untimedFill(undefined, 0, 1), undefined)
  assert.equal(untimedFill([], 0, 1), undefined)
})
test('rows of one cue are told apart by their units; a line ends where the next one sung after it begins', () => {
  const { playbackTiming } = load()
  const w = (from, to, start, end) => ({ from, to, start, end })
  const at = lines => playbackTiming(lines).map(l => [l.text, l.start, l.end])
  // one cue split over two word-timed rows: each row is current while it is sung
  assert.deepEqual(at([
    { text: 'AB', start: 10, end: 20, words: [w(0, 2, 10, 13)] },
    { text: 'CD', start: 10, end: 20, words: [w(0, 2, 14, 18)] },
  ]), [['AB', 10, 14], ['CD', 14, 20]])
  // an untimed row after a timed row of its cue, or starting while that row is sung, waits for it
  assert.deepEqual(at([
    { text: 'AB', start: 10, end: 20, words: [w(0, 2, 10, 13)] },
    { text: 'rest', start: 10, end: 20 },
  ]), [['AB', 10, 13], ['rest', 13, 20]])
  assert.deepEqual(at([
    { text: 'AB', start: 10, end: 13, words: [w(0, 2, 10, 13)] },
    { text: 'late', start: 10.06, end: 16 },
  ]), [['AB', 10, 13], ['late', 13, 16]])
  // an untimed row in front of a timed one ends where the units begin
  assert.deepEqual(at([
    { text: 'lead', start: 10, end: 20 },
    { text: 'AB', start: 10, end: 20, words: [w(0, 2, 15, 18)] },
  ]), [['lead', 10, 15], ['AB', 15, 20]])
  // a tail running into the next line is cut there, but not before the line's own units finish
  assert.deepEqual(at([
    { text: 'A', start: 1, end: 3.4 },
    { text: 'B', start: 3, end: 5, words: [w(0, 1, 3, 4)] },
    { text: 'C', start: 3.95, end: 6, words: [w(0, 1, 4.05, 5)] },
  ]), [['A', 1, 3], ['B', 3, 4.05], ['C', 4.05, 6]])
  // rows of one cue without units, bracketed backing vocals and voices that overlap stay together
  assert.deepEqual(at([
    { text: 'X', start: 1, end: 4 }, { text: 'Y', start: 1, end: 4 }, { text: 'Z', start: 3, end: 6 },
  ]), [['X', 1, 3], ['Y', 1, 3], ['Z', 3, 6]])
  assert.deepEqual(at([{ text: 'main', start: 1, end: 5 }, { text: '（ah ah）', start: 2, end: 6 }]), [['main', 1, 5], ['（ah ah）', 2, 6]])
  assert.deepEqual(at([
    { text: 'one', start: 1, end: 5, words: [w(0, 3, 1, 4)] },
    { text: 'two', start: 2, end: 5, words: [w(0, 3, 2, 5)] },
  ]), [['one', 1, 5], ['two', 2, 5]])
})
test('rows timed only as one cue become one line, keeping their rows, readings, singers and translations', () => {
  const { mergeSharedCues, lyricParts } = load()
  const merged = mergeSharedCues([
    { text: '花束', start: 1, end: 4, translation: '花', ruby: [{ from: 0, to: 2, reading: 'はなたば' }], segments: [{ text: '花束', performerIds: ['a'] }] },
    { text: '意味もなく', start: 1, end: 4, translation: '无意义', ruby: [{ from: 0, to: 2, reading: 'いみ' }], segments: [{ text: '意味も', performerIds: ['b'] }] },
    { text: '次', start: 5, end: 6 },
  ])
  assert.deepEqual(merged.map(l => [l.text, l.start, l.end, l.translation]), [['花束\n意味もなく', 1, 4, '花\n无意义'], ['次', 5, 6, undefined]])
  assert.deepEqual(merged[0].ruby, [{ from: 0, to: 2, reading: 'はなたば' }, { from: 3, to: 5, reading: 'いみ' }])
  // each row keeps its singers; text past a row's segments stays without one
  assert.deepEqual(lyricParts(merged[0]).map(p => [p.text, p.performerIds.join()]), [['花束', 'a'], ['\n', ''], ['意味も', 'b'], ['なく', '']])
  // word-timed rows and rows of different cues stay apart
  const timed = [{ text: 'A', start: 1, end: 4, words: [{ from: 0, to: 1, start: 1, end: 2 }] }, { text: 'B', start: 1, end: 4 }]
  assert.equal(mergeSharedCues(timed).length, 2)
})
test('romaji is read per line in JSON songs and by the original cue in LRC songs; merged rows keep a row each', () => {
  const { normalizeLyrics, mergeSharedCues } = load()
  const lrc = normalizeLyrics({
    format: 'lrc', duration: 30, lrc: '[00:09.0]形の\n[00:12.0]形の',
    wordLines: [{ cueStart: 9, start: 8.7, end: 11, text: '形の', words: [{ from: 0, to: 2, start: 8.7, end: 9.5 }] }],
    romajiLines: [{ cueStart: 9, text: '形の', romaji: 'katachi no' }, { cueStart: 12, text: '他', romaji: 'x' }],
  })
  assert.deepEqual(lrc.lines.map(l => l.romaji), ['katachi no', undefined])
  const json = normalizeLyrics({ format: 'bilingual_json', duration: 20, lines: [{ start: 1, end: 2, text: '花', romaji: 'hana' }, { start: 3, end: 4, text: 'B', romaji: ' ' }] })
  assert.deepEqual(json.lines.map(l => l.romaji), ['hana', undefined])
  const merged = mergeSharedCues([{ text: '花', start: 1, end: 4, romaji: 'hana' }, { text: 'Hey', start: 1, end: 4 }, { text: '空', start: 1, end: 4, romaji: 'sora' }])
  assert.equal(merged[0].romaji, 'hana\n\nsora')
})
test('LRC translations belong to the row under the same time tag, never to a neighbour', () => {
  const { normalizeLyrics } = load()
  // a row under a tag no original row has is dropped, not given to the next row; float noise in the tag is tolerated
  const song = normalizeLyrics({ format: 'lrc', duration: 80, lrc: '[00:09.0]A\n[00:11.0]B\n[01:02.25]C', translationLrc: '[00:10.0]无主\n[00:11.0000001]乙\n[1:02.250]丙' })
  assert.deepEqual(song.lines.map(l => l.translation), [undefined, '乙', '丙'])
  // simultaneous rows: the translation goes to the first of them
  const both = normalizeLyrics({ format: 'lrc', duration: 30, lrc: '[00:09.0]A\n[00:09.0]B\n[00:12.0]C', translationLrc: '[00:09.0]甲' })
  assert.deepEqual(both.lines.map(l => [l.text, l.translation]), [['A\nB', '甲'], ['C', undefined]])
})
test('LRC line timings apply by the original cue, keep their own end and overlaps, and yield to word timing', () => {
  const { normalizeLyrics } = load()
  const ruby = [{ from: 0, to: 1, reading: 'はな' }]
  const song = normalizeLyrics({
    format: 'lrc', duration: 60,
    lrc: '[00:10.0]花\n[00:14.0]空\n[00:20.0]\n[00:30.0]海\n[00:40.0]山',
    translationLrc: '[00:10.0]花朵\n[00:14.0]天空',
    rubyLines: [{ cueStart: 10, text: '花', ruby }],
    romajiLines: [{ cueStart: 14, text: '空', romaji: 'sora', source: 'reviewed' }],
    lineTimings: [
      // moves the row and overlaps the next: both kept; extras still matched by the original cue
      { cueStart: 10, text: '花', start: 10.5, end: 15, source: 'x' },
      { cueStart: 30, text: '海', start: 30, end: 35 },
      // word timing has priority over line timing
      { cueStart: 40, text: '山', start: 40, end: 41 },
      // names a cue that does not exist
      { cueStart: 14.5, text: '空', start: 1, end: 2 },
    ],
    wordLines: [{ cueStart: 40, text: '山', start: 40.2, end: 43, words: [{ from: 0, to: 1, start: 40.2, end: 43 }] }],
  })
  assert.deepEqual(song.lines.map(l => [l.text, l.start, l.end]), [['花', 10.5, 15], ['空', 14, 20], ['海', 30, 35], ['山', 40.2, 43]])
  assert.deepEqual(song.lines[0].ruby, ruby)
  assert.equal(song.lines[0].translation, '花朵')
  assert.deepEqual([song.lines[1].romaji, song.lines[1].romajiSource, song.lines[1].translation], ['sora', 'reviewed', '天空'])
  assert.ok(song.lines.every(l => !('cueStart' in l)))
  // an empty tag ends the row before it: nothing is current in the break
  assert.equal(song.lines[1].end, 20)
})
const versioned = () => ({
  musicId: 7, format: 'bilingual_json', duration: 100, vocalId: 1, assetbundle: 'a_01',
  performers: [{ performerId: '歌唱者-21', name: 'ミク', characterId: 21 }],
  credits: { translation: 'default' },
  lines: [
    { start: 10, end: 12, text: '花', translation: '花朵', ruby: [{ from: 0, to: 1, reading: 'はな' }], romaji: 'hana', words: [{ from: 0, to: 1, start: 10, end: 11 }], performerIds: ['歌唱者-21'], segments: [{ text: '花', performerIds: ['歌唱者-21'] }] },
    { start: 12, end: 14, text: '空', performerIds: ['歌唱者-21'] },
    { start: 20, end: 22, text: '花', performerIds: ['歌唱者-21'] },
  ],
  versions: [{
    vocalId: 2, assetbundle: 'a_02', duration: 101, source: 'A',
    performers: [{ performerId: '歌唱者-23', name: 'レン', characterId: 23 }],
    singers: [{ row: 0, segments: [{ text: '花', performerIds: ['歌唱者-23'] }] }, { row: 2, performerIds: ['歌唱者-23'] }, { row: 9, performerIds: ['歌唱者-23'] }],
  }],
})
test('a rendition is picked by vocal id, by audio bundle only without one', () => {
  const { findVersion } = load()
  const data = versioned()
  assert.equal(findVersion(data, { vocalId: 1 }), 'default')
  assert.equal(findVersion(data, { vocalId: 2 }), data.versions[0])
  assert.equal(findVersion(data, { vocalId: 3, assetbundle: 'a_01' }), null)
  assert.equal(findVersion(data, { assetbundle: 'a_02' }), data.versions[0])
  assert.equal(findVersion(data, { assetbundle: 'a_01' }), 'default')
  assert.equal(findVersion(data, {}), null)
  // a default recorded only by its bundle
  assert.equal(findVersion({ ...data, vocalId: undefined }, { vocalId: 9, assetbundle: 'a_01' }), 'default')
  // old resources without versions
  assert.equal(findVersion({ ...data, versions: undefined }, { vocalId: 2 }), null)
})
test('every rendition plays on the default timeline; only the singers change', () => {
  const { lyricsForVocal } = load()
  const data = versioned()
  const base = lyricsForVocal(data, { vocalId: 1 })
  const other = lyricsForVocal(data, { vocalId: 2 })
  const unknown = lyricsForVocal(data, { vocalId: 3 })
  const timing = song => song.lyrics.lines.map(l => [l.text, l.start, l.end, l.words, l.translation, l.ruby, l.romaji])
  assert.deepEqual(timing(other), timing(base))
  assert.deepEqual(timing(unknown), timing(base))
  assert.deepEqual([base.singers, other.singers, unknown.singers], [true, true, false])
  // the rendition's own singers, by default row; rows it does not name have none
  assert.deepEqual(other.lyrics.lines.map(l => [l.segments, l.performerIds]), [[[{ text: '花', performerIds: ['歌唱者-23'] }], undefined], [undefined, undefined], [undefined, ['歌唱者-23']]])
  assert.deepEqual(base.lyrics.lines.map(l => l.performerIds), [['歌唱者-21'], ['歌唱者-21'], ['歌唱者-21']])
  assert.ok(unknown.lyrics.lines.every(l => !l.segments && !l.performerIds))
  assert.deepEqual([other.lyrics.duration, other.lyrics.vocalId, other.lyrics.performers, other.lyrics.credits], [101, 2, data.versions[0].performers, { translation: 'default' }])
  assert.equal(unknown.lyrics.performers, undefined)
  // built once per rendition; the resource is not changed
  assert.equal(lyricsForVocal(data, { vocalId: 2 }).lyrics, other.lyrics)
  assert.deepEqual(data, versioned())
})
test('singer rows count raw LRC rows: every tag expanded in time order, simultaneous rows kept, empty tags skipped', () => {
  const { lyricsForVocal } = load()
  const data = {
    musicId: 8, format: 'lrc', duration: 60, vocalId: 1,
    // rows 0-1 share a cue and merge for display; the empty tag takes no index; [00:30] repeats row 2's text as row 4
    lrc: '[00:05.0]A\n[00:05.0]B\n[00:08.0]\n[00:10.0][00:30.0]C\n[00:20.0]D',
    versions: [{ vocalId: 2, assetbundle: 'b', duration: 60, source: 'C', performers: [], singers: [{ row: 1, performerIds: ['x'] }, { row: 4, performerIds: ['y'] }] }],
  }
  const { lyrics } = lyricsForVocal(data, { vocalId: 2 })
  assert.deepEqual(lyrics.lines.map(l => [l.text, l.start, l.segments?.map(s => s.performerIds.join()).join('|') ?? l.performerIds?.join()]), [
    // merged rows keep a segment each: A (no singer), the line break, B (x)
    ['A\nB', 5, '||x'], ['C', 10, undefined], ['D', 20, undefined], ['C', 30, 'y'],
  ])
})
test('a row a rendition sings with other words shows them, on the default timing', () => {
  const { lyricsForVocal } = load()
  const data = {
    musicId: 9, format: 'lrc', duration: 60, vocalId: 1,
    lrc: '[00:05.0]Jump（みのり）\n[00:10.0]次', translationLrc: '[00:05.0]Jump（实乃理）',
    rubyLines: [{ cueStart: 5, text: 'Jump（みのり）', ruby: [{ from: 0, to: 1, reading: 'x' }] }],
    romajiLines: [{ cueStart: 5, text: 'Jump（みのり）', romaji: 'jump minori' }],
    wordLines: [{ cueStart: 5, text: 'Jump（みのり）', start: 5.2, end: 8, words: [{ from: 0, to: 4, start: 5.2, end: 6 }] }],
    versions: [{ vocalId: 2, assetbundle: 'b', duration: 60, source: 'A', performers: [], singers: [
      { row: 0, text: 'Jump（ミクさん）', translation: 'Jump（MIKU桑）', romaji: 'Jump (Miku-san)', segments: [{ text: 'Jump（ミクさん）', performerIds: ['m'] }] },
      { row: 1, text: '', performerIds: ['m'] },
    ] }],
  }
  const [line, next] = lyricsForVocal(data, { vocalId: 2 }).lyrics.lines
  assert.deepEqual(line, { start: 5.2, end: 8, text: 'Jump（ミクさん）', translation: 'Jump（MIKU桑）', romaji: 'Jump (Miku-san)', segments: [{ text: 'Jump（ミクさん）', performerIds: ['m'] }] })
  // an empty override changes nothing; the default rendition keeps its words
  assert.deepEqual([next.text, next.performerIds], ['次', ['m']])
  const own = lyricsForVocal(data, { vocalId: 1 }).lyrics.lines[0]
  assert.deepEqual([own.text, own.romaji, !!own.words, own.translation], ['Jump（みのり）', 'jump minori', true, 'Jump（实乃理）'])
})
