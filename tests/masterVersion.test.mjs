import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { createPinia } = require('pinia')
const source = readFileSync(new URL('../src/stores/master.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText

test('awaited master synchronization finishes a pending background update before deck data is read', async () => {
  let storedVersion = 'old'
  const cached = new Map([['cards', [{ id: 1 }]]])
  let resolveVersion
  const pendingVersion = new Promise(resolve => { resolveVersion = resolve })
  let versionRequests = 0
  const fetchedVersions = []
  const module = { exports: {} }
  const deps = {
    '@/api/version': { getVersion: async () => { versionRequests++; return pendingVersion } },
    '@/api/master': {
      getMasterData: async (_name, version) => {
        fetchedVersions.push(version)
        return [{ id: 1 }, { id: 2 }]
      },
    },
    '@/utils/masterDB': {
      getStoredVersion: async () => storedVersion,
      setStoredVersion: async value => { storedVersion = value },
      getCachedData: async name => cached.get(name),
      setCachedData: async (name, value) => { cached.set(name, value) },
      clearAllCache: async () => { cached.clear() },
    },
  }
  new Function('require', 'module', 'exports', compiled)(name => deps[name] ?? require(name), module, module.exports)
  const store = module.exports.useMasterStore(createPinia())
  await store.initialize()
  assert.equal(store.version, 'old')
  const synchronized = store.syncVersion()
  resolveVersion({ dataVersion: 'new' })
  await synchronized
  assert.equal(versionRequests, 1, 'the ongoing version request is shared')
  assert.equal(store.version, 'new')
  assert.deepEqual(await store.getMaster('cards'), [{ id: 1 }, { id: 2 }])
  assert.deepEqual(fetchedVersions, ['new'])
})
