import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const compiled = ts.transpileModule(readFileSync(new URL('../src/utils/globalSearch.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
const search = {}
new Function('exports', compiled)(search)
const { normalizeSearchText, joinSearchText, searchEntries } = search

function entry(id, title, extra = {}) {
  return {
    kind: 'music', id: String(id), title, sub: '', meta: '', path: `/musics/${id}`, image: '',
    keys: joinSearchText([title, ...(extra.names ?? [])]),
    hay: joinSearchText([title, ...(extra.names ?? []), ...(extra.more ?? [])]),
    order: extra.order ?? id, hiddenUntil: extra.hiddenUntil ?? 0, num: id,
  }
}
const options = { limit: 10, now: 1000, showSpoilers: false }

test('text is folded so width, case and kana type do not matter', () => {
  assert.equal(normalizeSearchText('  ＭＩＫＵ ミク '), 'miku みく')
  assert.equal(joinSearchText(['Tell Your World', null, 'TELL YOUR WORLD', 'てるゆあわーるど']), 'tell your world\nてるゆあわーるど')
})

test('exact names come first, then prefixes, then matches inside a name, then other fields', () => {
  const entries = [
    entry(1, 'アイドル新鋭隊'),
    entry(2, '新世界', { order: 5 }),
    entry(3, '新'),
    entry(4, 'ロキ', { more: ['新人作曲者'] }),
  ]
  assert.deepEqual(searchEntries(entries, '新', options).items.map(e => e.id), ['3', '2', '1', '4'])
})

test('katakana queries match hiragana readings and the other way round', () => {
  const entries = [entry(1, 'Tell Your World', { names: ['てるゆあわーるど'] }), entry(2, 'ロキ')]
  assert.deepEqual(searchEntries(entries, 'テルユア', options).items.map(e => e.id), ['1'])
  assert.deepEqual(searchEntries(entries, 'ろき', options).items.map(e => e.id), ['2'])
})

test('several words must all appear, in any field', () => {
  const entries = [entry(1, 'Happy Birthday', { more: ['東雲彰人'] }), entry(2, 'Happy Anniversary', { more: ['MEIKO'] })]
  assert.deepEqual(searchEntries(entries, 'happy 彰人', options).items.map(e => e.id), ['1'])
})

test('a number or #number finds the entry with that id ahead of names containing the digits', () => {
  const entries = [entry(25, 'ロキ'), entry(7, '25時、ナイトコードで。'), entry(250, 'テオ')]
  assert.deepEqual(searchEntries(entries, '25', options).items.map(e => e.id), ['25', '7'])
  assert.deepEqual(searchEntries(entries, '#25', options).items.map(e => e.id), ['25', '7'])
})

test('unreleased entries stay hidden unless spoilers are on, and the total counts every match', () => {
  const entries = [entry(1, 'Song A'), entry(2, 'Song B', { hiddenUntil: 2000 }), entry(3, 'Song C')]
  assert.deepEqual(searchEntries(entries, 'song', options).items.map(e => e.id), ['3', '1'])
  const all = searchEntries(entries, 'song', { ...options, showSpoilers: true, limit: 2 })
  assert.deepEqual(all.items.map(e => e.id), ['3', '2'])
  assert.equal(all.total, 3)
})
