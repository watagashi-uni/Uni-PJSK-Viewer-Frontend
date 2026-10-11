import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const dir = mkdtempSync(join(tmpdir(), 'sekai-judgment-test-'))
after(() => rmSync(dir, { recursive: true, force: true }))
writeFileSync(join(dir, 'package.json'), '{"type":"commonjs"}')
for (const name of ['fraction', 'model', 'judgmentTiming', 'renderer', 'customScoreJson', 'rebase']) {
  const source = readFileSync(new URL(`../src/vendor/sekai-sus2img/${name}.ts`, import.meta.url), 'utf8')
  writeFileSync(join(dir, `${name}.js`), ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText)
}
const require = createRequire(join(dir, 'test.cjs'))
const { getNoteJudgment, bandsFromThresholds, JUDGMENT_FRAMES } = require('./judgmentTiming.js')
const { Tap, TapType, Directional, Slide, SlideType, Score, Event } = require('./model.js')
const { renderScoreToSvg } = require('./renderer.js')
const { scoreFromCustomScoreJson } = require('./customScoreJson.js')
const { applyRebase } = require('./rebase.js')
const tap = (type = TapType.TAP, extra = {}) => new Tap({ bar: 1, lane: 2, width: 2, type, ...extra })
const slide = (type, extra = {}) => new Slide({ bar: 1, lane: 2, width: 2, type, ...extra })
const flick = (type = TapType.TAP) => new Directional({ bar: 1, lane: 2, width: 2, type: 3, tap: tap(type) })
const range = judgment => [Math.min(...judgment.bands.map(b => b.from)), Math.max(...judgment.bands.map(b => b.to))]

test('tap uses asymmetric-field values rather than legacy perfect=2/great=5.5', () => {
  assert.deepEqual(getNoteJudgment(tap()).bands, [
    { grade: 'perfect', from: -2.5, to: 2.5 },
    { grade: 'great', from: -5, to: -2.5 }, { grade: 'great', from: 2.5, to: 5 },
    { grade: 'good', from: -6.5, to: -5 }, { grade: 'good', from: 5, to: 6.5 },
    { grade: 'bad', from: -7.5, to: -6.5 }, { grade: 'bad', from: 6.5, to: 7.5 },
  ])
  const gold = getNoteJudgment(tap(TapType.CRITICAL)).bands
  assert.ok(Math.abs(gold[0].to - 3.3) < 1e-6)
  assert.equal(gold[2].to, 4.5)
})

test('flick retains the distinct early/late thresholds', () => {
  const bands = getNoteJudgment(flick()).bands
  assert.deepEqual(range({ bands }), [-7.5, 8.5])
  assert.equal(bands.find(b => b.grade === 'great' && b.from > 0).to, 7.5)
  assert.equal(getNoteJudgment(flick(TapType.CRITICAL)).bands[0].to, 3.5)
})

test('trace only paints perfect, and never zero-width duplicate grades', () => {
  for (const type of [TapType.TREND, TapType.CRITICAL_TREND]) {
    const info = getNoteJudgment(tap(type))
    assert.deepEqual(range(info), [-5, 5])
    assert.ok(info.bands.every(b => b.grade === 'perfect' && b.to > b.from))
  }
  assert.equal(bandsFromThresholds(JUDGMENT_FRAMES.friction).length, 1)
  assert.match(getNoteJudgment(flick(TapType.TREND)).explanation, /方向错误.*Great/)
})

test('release tail has no Bad; critical status is inherited from the head', () => {
  const head = slide(SlideType.START, { tap: tap(TapType.CRITICAL) })
  const tail = slide(SlideType.END, { head })
  const info = getNoteJudgment(tail)
  assert.match(info.label, /金色/)
  assert.ok(info.bands.every(b => b.grade !== 'bad'))
  assert.deepEqual(info.bands[0], { grade: 'perfect', from: -3.5, to: 4 })
})

test('tail flick early capture is buffered perfect, not the unreachable early Great/Good bands', () => {
  const info = getNoteJudgment(slide(SlideType.END, { directional: flick() }))
  assert.deepEqual(info.bands[0], { grade: 'perfect', from: -7.5, to: 0, conditional: true })
  assert.ok(info.bands.every(b => b.grade === 'perfect' || b.from >= 0))
  assert.ok(info.bands.every(b => b.grade !== 'bad'))
})

test('trace tail uses reversed gate sign; trace flick tail uses a different capture and grading row', () => {
  assert.deepEqual(range(getNoteJudgment(slide(SlideType.END, { tap: tap(TapType.TREND) }))), [-8, 6.5])
  const end = slide(SlideType.END, { tap: tap(TapType.TREND), directional: flick(TapType.TREND) })
  assert.deepEqual(range(getNoteJudgment(end)), [-7.5, 7.5])
  const head = getNoteJudgment(slide(SlideType.START, { tap: tap(TapType.TREND) }))
  assert.deepEqual(range(head), [-5, 7.5])
  assert.ok(head.bands.every(b => b.conditional))
  assert.match(head.explanation, /下一次更新/)
})

test('relay is a holding check, hidden nodes and guide chains have no judge windows', () => {
  assert.equal(getNoteJudgment(slide(SlideType.RELAY)).checkpoint, true)
  assert.deepEqual(getNoteJudgment(slide(SlideType.RELAY)).bands, [])
  assert.equal(getNoteJudgment(slide(SlideType.INVISIBLE)), null)
  assert.equal(getNoteJudgment(slide(SlideType.START, { decoration: true })), null)
  assert.equal(getNoteJudgment(tap(TapType.CANCEL)), null)
  assert.equal(getNoteJudgment(flick(TapType.CANCEL)), null)
})

test('JSON trace and critical tail mapping survives rebase', () => {
  const base = { laneStart: 0, laneEnd: 1, speedRatio: 1, isSkip: false, type: 0, noteLineType: 0 }
  const score = scoreFromCustomScoreJson({
    MusicScoreEventDataList: [{ ticks: 0, eventType: 0, changeValue: '120' }],
    NoteList: [
      { ...base, id: 1, ticks: 480, noteBaseType: 8, category: 6, type: 1, previousConnectionId: -1, nextConnectionId: 2 },
      { ...base, id: 2, ticks: 1920, noteBaseType: 11, category: 6, previousConnectionId: 1, nextConnectionId: -1 },
    ],
  })
  for (const candidate of [score, applyRebase(score, { offset: 0.1, events: [{ bar: 0, bpm: 180 }] })]) {
    const head = candidate.notes.find(n => n instanceof Slide && n.type === SlideType.START)
    const tail = candidate.notes.find(n => n instanceof Slide && n.type === SlideType.END)
    assert.match(getNoteJudgment(head).label, /金色 Trace 长条起点/)
    assert.match(getNoteJudgment(tail).label, /金色 Trace 长条尾点/)
    assert.deepEqual(range(getNoteJudgment(tail)), [-8, 6.5])
  }
})

test('interactive preview has shared profiles and hit targets but no prebuilt judgment bands; exports stay plain', () => {
  const score = new Score()
  score.events = [new Event({ bar: 0, bpm: 120 }), new Event({ bar: 4, bpm: 240 })]
  score.notes = [tap(TapType.TAP, { bar: 3.99 }), tap(TapType.TAP, { bar: 4.01 }), tap(TapType.TREND, { bar: 7.5 })]
  score.initEvents()
  const clean = renderScoreToSvg(score, { noteHost: '/static/notes_new/custom01', timeHeight: 240 })
  const interactive = renderScoreToSvg(score, { noteHost: '/static/notes_new/custom01', timeHeight: 240, interactiveJudgment: true })
  assert.equal(interactive.width, clean.width)
  assert.equal(interactive.height, clean.height)
  assert.ok(!clean.svg.includes('data-judge-'))
  assert.ok(!interactive.svg.includes('data-grade='))
  assert.ok(!interactive.svg.includes('judgment-band'))
  assert.ok(interactive.svg.includes('data-judge-profiles'))
  assert.ok(interactive.svg.includes('data-judge-preview'))
  assert.ok(interactive.svg.includes('data-pixels-per-frame="4"'))
  assert.ok([...interactive.svg.matchAll(/data-judge-note=/g)].length >= 3)
  assert.ok(!interactive.svg.includes('<script'))
})
