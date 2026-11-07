import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/api/translations.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText

const BASE = 'https://master.example/translations/zh-Hans'

// IndexedDB stand-in shared across "page loads"
function memoryDB() {
  const stores = { meta: new Map(), tables: new Map(), stories: new Map() }
  const db = {
    stores,
    get: async (store, key) => structuredClone(stores[store].get(key)),
    put: async (store, value, key) => { stores[store].set(key, structuredClone(value)) },
    transaction: (names) => {
      const list = [names].flat()
      const objectStore = name => ({
        clear: async () => stores[name].clear(),
        openCursor: async () => {
          const keys = [...stores[name].keys()]
          const cursorAt = (i) => i >= keys.length ? null : {
            key: keys[i], value: stores[name].get(keys[i]),
            delete: async () => { stores[name].delete(keys[i]) },
            continue: async () => cursorAt(i + 1),
          }
          return cursorAt(0)
        },
      })
      return { store: objectStore(list[0]), objectStore, done: Promise.resolve() }
    },
  }
  return db
}

function load(db, files, requests) {
  globalThis.fetch = async (url) => {
    requests.push(url.replace(`${BASE}/`, ''))
    if (files.offline) throw new TypeError('Failed to fetch')
    const body = files[url.replace(`${BASE}/`, '')]
    return { ok: body !== undefined, status: body === undefined ? 404 : 200, json: async () => structuredClone(body) }
  }
  const module = { exports: {} }
  const deps = { idb: { openDB: async () => db }, './masterClient': { masterApiBaseUrl: 'https://master.example' } }
  new Function('require', 'module', 'exports', compiled)(name => deps[name], module, module.exports)
  return module.exports
}

const table = (zh) => ({ o: { prefix: { '日本語': zh } }, a: {} })

test('tables load once, survive a reload without requests and refresh when the hash changes', async () => {
  const db = memoryDB()
  const files = {
    'version.json': { v: 2, d: { cards: 'h1' }, s: 's1' },
    'd/cards.h1.json': table('中文'),
  }
  let requests = []
  let api = load(db, files, requests)
  const [a, b] = await Promise.all([api.loadZhTable('cards'), api.loadZhTable('cards')])
  assert.equal(a.o.prefix['日本語'], '中文')
  assert.deepEqual(b, a)
  assert.deepEqual(requests, ['version.json', 'd/cards.h1.json'], 'concurrent loads share requests')
  assert.equal(await api.loadZhTable('missing'), null, 'tables without translations do not hit the network')
  assert.equal(requests.length, 2)

  // A reload within ten minutes reuses the stored version.json and table.
  requests = []
  api = load(db, files, requests)
  assert.equal((await api.loadZhTable('cards')).o.prefix['日本語'], '中文')
  assert.deepEqual(requests, [])

  // Later the version is checked again; only the changed table is downloaded.
  const stored = db.stores.meta.get('version')
  db.stores.meta.set('version', { ...stored, fetchedAt: stored.fetchedAt - 11 * 60 * 1000 })
  files['version.json'] = { v: 2, d: { cards: 'h2' }, s: 's1' }
  files['d/cards.h2.json'] = table('新译文')
  requests = []
  api = load(db, files, requests)
  assert.equal((await api.loadZhTable('cards')).o.prefix['日本語'], '新译文')
  assert.deepEqual(requests, ['version.json', 'd/cards.h2.json'])
  assert.equal(db.stores.tables.get('cards').hash, 'h2', 'the old file is replaced')
})

test('offline sessions fall back to the stored copies', async () => {
  const db = memoryDB()
  const files = { 'version.json': { v: 2, d: { cards: 'h1' }, s: 's1' }, 'd/cards.h1.json': table('中文') }
  await load(db, files, []).loadZhTable('cards')
  const stored = db.stores.meta.get('version')
  db.stores.meta.set('version', { ...stored, fetchedAt: 0 })
  const requests = []
  const api = load(db, { ...files, offline: true }, requests)
  assert.equal((await api.loadZhTable('cards')).o.prefix['日本語'], '中文')
  assert.deepEqual(requests, ['version.json'])
})

test('stories use the index on demand and drop replaced files', async () => {
  const db = memoryDB()
  const story = { src: 'official', names: { '杏': '杏' }, lines: ['第一句'], effects: { 0: '教室' } }
  const files = {
    'version.json': { v: 2, d: {}, s: 's1' },
    's/index.s1.json': { event_1_01: 'a1', event_1_02: 'b1' },
    's/event_1_01.a1.json': story,
    's/event_1_02.b1.json': { ...story, lines: ['另一话'] },
  }
  let requests = []
  let api = load(db, files, requests)
  assert.equal(await api.loadZhStory('event_9_99'), null)
  assert.deepEqual((await api.loadZhStory('event_1_01')).lines, ['第一句'])
  await api.loadZhStory('event_1_02')
  assert.deepEqual(requests, ['version.json', 's/index.s1.json', 's/event_1_01.a1.json', 's/event_1_02.b1.json'])

  const stored = db.stores.meta.get('version')
  db.stores.meta.set('version', { ...stored, fetchedAt: 0 })
  files['version.json'] = { v: 2, d: {}, s: 's2' }
  files['s/index.s2.json'] = { event_1_01: 'a2', event_1_02: 'b1' }
  files['s/event_1_01.a2.json'] = { ...story, lines: ['修订'] }
  requests = []
  api = load(db, files, requests)
  assert.deepEqual((await api.loadZhStory('event_1_02')).lines, ['另一话'])
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(db.stores.stories.has('event_1_01'), false, 'a replaced story is evicted')
  assert.deepEqual((await api.loadZhStory('event_1_01')).lines, ['修订'])
  assert.deepEqual(requests, ['version.json', 's/index.s2.json', 's/event_1_01.a2.json'])
})
