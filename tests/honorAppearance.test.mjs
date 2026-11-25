import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/honorAppearance.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { getHonorLevelAppearance, getHonorStyleOptions, resolveProfileHonorStyle } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`)

test('level dots cycle every ten levels and the medal advances on the next level', () => {
  for (const [level, normalDots, upgradedDots, medalTier] of [
    [0, 0, 0, 0], [5, 5, 0, 0], [6, 5, 1, 0], [10, 5, 5, 0],
    [11, 1, 0, 1], [16, 5, 1, 1], [20, 5, 5, 1], [21, 1, 0, 2], [101, 1, 0, 9],
  ]) {
    assert.deepEqual(getHonorLevelAppearance(level, true), { normalDots, upgradedDots, medalTier })
  }
  assert.deepEqual(getHonorLevelAppearance(11, false), { normalDots: 1, upgradedDots: 0, medalTier: 0 })
})

test('character art stays on the default until the matching level unlocks the alternate', () => {
  const styles = [ { id: 1, description: 'Rank 5' }, { id: 2, description: 'Rank 180' } ]
  const levels = [ { level: 10, description: 'Rank 175' }, { level: 11, description: 'Rank 180' } ]
  assert.deepEqual(getHonorStyleOptions(styles, levels, 10), [styles[0]])
  assert.deepEqual(getHonorStyleOptions(styles, levels, 11), styles)
  assert.deepEqual(getHonorStyleOptions(styles, levels, 16), styles)
  assert.deepEqual(getHonorStyleOptions(styles, [], 16), [styles[0]])
  assert.deepEqual(getHonorStyleOptions([], levels, 11), [])
})

test('profile honor artwork uses the saved selection and falls back to the group default', () => {
  const styles = [
    { id: 12002, seq: 2, honorGroupId: 20, assetbundleName: 'honor_word_20_02' },
    { id: 12102, seq: 2, honorGroupId: 21, assetbundleName: 'honor_word_21_02' },
    { id: 12001, seq: 1, honorGroupId: 20, assetbundleName: 'honor_word_20_01' },
  ]
  assert.equal(resolveProfileHonorStyle(styles, 20, 12002), 'honor_word_20_02')
  assert.equal(resolveProfileHonorStyle(styles, 20, null), 'honor_word_20_01')
  assert.equal(resolveProfileHonorStyle(styles, 20, 12102), 'honor_word_20_01')
  assert.equal(resolveProfileHonorStyle(styles, 99, 12002), undefined)
  assert.equal(resolveProfileHonorStyle(undefined, 20, 12002), undefined)
})
