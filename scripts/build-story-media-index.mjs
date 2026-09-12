// Paths only, no game media is copied into the frontend build.
// node scripts/build-story-media-index.mjs ../runtime/r2-story-expansion-paths-20260912.tsv
import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
const input = process.argv[2]
if (!input) throw new Error('Pass the audited R2 path TSV')
const index = { backgrounds: {}, bgm: {}, comics: [], specialScenarios: [] }
const backgroundBundles = {}
for (const line of readFileSync(input, 'utf8').split('\n').slice(1)) {
  const path = line.split('\t')[0]
  if (!path) continue
  const name = basename(path).replace(/\.[^.]+$/, '')
  if (/^ondemand\/scenario\/background\/.+\.png$/.test(path)) {
    const bundle = path.split('/').at(-2)
    if (/^bg[\w-]+$/.test(name) && !index.backgrounds[name]) index.backgrounds[name] = path
    // Some native bundles export scenariobgdata.png or an older background name.
    // The script refers to the bundle ID; never resolve every such file to the
    // last generic basename encountered in the inventory.
    if (/^bg[\w-]+$/.test(bundle) && (!backgroundBundles[bundle] || name === bundle || name === 'scenariobgdata')) backgroundBundles[bundle] = path
  }
  if (/^(ondemand\/sound\/scenario\/bgm|ondemand\/unit_story)\/.+\.mp3$/.test(path)) index.bgm[name] = path
  if (/^startapp\/comic\/one_frame\/comic_\d+\.png$/.test(path)) index.comics.push(path)
  if (/^startapp\/scenario\/special\/.+\.json$/.test(path) && !path.includes('dummy')) index.specialScenarios.push(path)
}
Object.assign(index.backgrounds, backgroundBundles)
writeFileSync(new URL('../public/data/story-media-index.json', import.meta.url), JSON.stringify(index))
console.log(Object.fromEntries(Object.entries(index).map(([key, value]) => [key, Object.keys(value).length])))
