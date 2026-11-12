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
const queue = load('../src/utils/playerQueue.ts')
const tracks = load('../src/utils/playerTracks.ts')

test('play next goes right behind the current track; an empty queue starts at its first entry', () => {
  assert.deepEqual(queue.insertNext({ queue: ['a', 'b', 'c'], index: 1 }, ['x', 'y']), { queue: ['a', 'b', 'x', 'y', 'c'], index: 1 })
  assert.deepEqual(queue.insertNext({ queue: [], index: -1 }, ['x']), { queue: ['x'], index: 0 })
  assert.deepEqual(queue.append({ queue: ['a'], index: 0 }, ['x']), { queue: ['a', 'x'], index: 0 })
  assert.deepEqual(queue.append({ queue: [], index: -1 }, ['x', 'y']), { queue: ['x', 'y'], index: 0 })
  assert.deepEqual(queue.append({ queue: [], index: -1 }, []), { queue: [], index: -1 })
})

test('removing keeps the same track current, or hands over to its successor', () => {
  const state = { queue: ['a', 'b', 'c', 'd'], index: 2 }
  assert.deepEqual(queue.removeAt(state, 0), { queue: ['b', 'c', 'd'], index: 1 })
  assert.deepEqual(queue.removeAt(state, 3), { queue: ['a', 'b', 'c'], index: 2 })
  // the current track itself: the next one takes its slot
  assert.deepEqual(queue.removeAt(state, 2), { queue: ['a', 'b', 'd'], index: 2 })
  // the current track was last: fall back to the new last entry
  assert.deepEqual(queue.removeAt({ queue: ['a', 'b'], index: 1 }, 1), { queue: ['a'], index: 0 })
  assert.deepEqual(queue.removeAt({ queue: ['a'], index: 0 }, 0), { queue: [], index: -1 })
  assert.equal(queue.removeAt(state, 9), state)
})

test('moving entries never changes which track is current', () => {
  const state = { queue: ['a', 'b', 'c', 'd', 'e'], index: 2 }
  const current = result => result.queue[result.index]
  for (let from = 0; from < 5; from++) {
    for (let to = 0; to < 5; to++) {
      const result = queue.moveItem(state, from, to)
      assert.equal(current(result), 'c', `move ${from} -> ${to}`)
      assert.equal(result.queue[to], state.queue[from])
      assert.deepEqual([...result.queue].sort(), state.queue)
    }
  }
  assert.deepEqual(queue.moveItem(state, 0, 99).queue, ['b', 'c', 'd', 'e', 'a'])
  assert.equal(queue.moveItem(state, 7, 0), state)
})

test('clearing and shuffling only touch what comes after the current track', () => {
  const state = { queue: ['a', 'b', 'c', 'd', 'e'], index: 1 }
  assert.deepEqual(queue.clearUpcoming(state), { queue: ['a', 'b'], index: 1 })
  // random() === 0 makes Fisher–Yates rotate the tail by one, which is easy to check by hand
  const shuffled = queue.shuffleUpcoming(state, () => 0)
  assert.deepEqual(shuffled.queue.slice(0, 2), ['a', 'b'])
  assert.deepEqual(shuffled.queue.slice(2), ['d', 'e', 'c'])
  assert.equal(shuffled.index, 1)
  assert.deepEqual(queue.shuffleUpcoming({ queue: ['a'], index: 0 }), { queue: ['a'], index: 0 })
})

test('advancing honours the repeat mode; a manual skip leaves "repeat one"', () => {
  assert.equal(queue.nextIndex(0, 3, 'off', true), 1)
  assert.equal(queue.nextIndex(2, 3, 'off', true), -1)
  assert.equal(queue.nextIndex(2, 3, 'all', true), 0)
  assert.equal(queue.nextIndex(1, 3, 'one', true), 1)
  assert.equal(queue.nextIndex(1, 3, 'one', false), 2)
  assert.equal(queue.nextIndex(2, 3, 'one', false), 0)
  assert.equal(queue.nextIndex(0, 1, 'all', true), 0)
  assert.equal(queue.nextIndex(-1, 0, 'all', true), -1)
  assert.equal(queue.previousIndex(2, 3, 'off'), 1)
  assert.equal(queue.previousIndex(0, 3, 'off'), 0)
  assert.equal(queue.previousIndex(0, 3, 'all'), 2)
  assert.equal(queue.previousIndex(-1, 0, 'all'), -1)
})

const sources = {
  musics: [{ id: 50, title: 'Blessing', composer: 'halyosy', assetbundleName: 'jacket_s_050', fillerSec: 7.957 }, { id: 9, title: 'Silent', composer: 'x', assetbundleName: 'jacket_s_009' }],
  vocals: [
    { id: 46, musicId: 50, musicVocalType: 'original_song', caption: 'バーチャル・シンガーver.', assetbundleName: '0050_01', characters: [{ characterType: 'game_character', characterId: 21 }, { characterType: 'outside_character', characterId: 2 }, { characterType: 'game_character', characterId: 99 }] },
    { id: 47, musicId: 50, musicVocalType: 'sekai', caption: 'セカイver.', assetbundleName: '0050_02', characters: [{ characterType: 'game_character', characterId: 1 }] },
  ],
  characters: [{ id: 1, firstName: '星乃', givenName: '一歌' }, { id: 21, givenName: '初音ミク' }],
  outsideCharacters: [{ id: 2, name: 'IA' }],
  characterUnits: [{ id: 21, gameCharacterId: 21, colorCode: '#33ccbb' }, { id: 27, gameCharacterId: 21, colorCode: '#000000' }, { id: 1, gameCharacterId: 1, colorCode: '#33aaee' }],
  assetVariants: [{ musicVocalId: 47, musicAssetType: 'jacket', assetbundleName: 'jacket_s_050_sekai' }, { musicVocalId: 46, musicAssetType: 'other', assetbundleName: 'ignored' }],
}

test('a track carries what playback and display need; unknown singers are dropped', () => {
  const track = tracks.trackFor(sources, 50, 'virtual_singer')
  assert.equal(track.vocalId, 46)
  assert.equal(track.trimStart, 7.957)
  assert.equal(track.jacketAssetbundle, undefined)
  assert.deepEqual(track.singers, [
    { type: 'game', id: 21, firstName: undefined, givenName: '初音ミク', color: '#33ccbb' },
    { type: 'outside', id: 2, name: 'IA' },
  ])
  assert.equal(tracks.trackAudioPath(track), '/ondemand/music/long/0050_01/0050_01.mp3')
  assert.equal(tracks.trackCoverPath(track), '/startapp/music/jacket/jacket_s_050/jacket_s_050.png')
})

test('the preferred rendition wins, an explicit one wins over it, and its own jacket is used', () => {
  const sekai = tracks.trackFor(sources, 50, 'sekai')
  assert.equal(sekai.vocalId, 47)
  assert.equal(tracks.trackCoverPath(sekai), '/startapp/music/jacket/jacket_s_050/jacket_s_050_sekai.png')
  assert.equal(tracks.trackFor(sources, 50, 'sekai', 46).vocalId, 46)
  // an id from another song falls back to the default rendition
  assert.equal(tracks.trackFor(sources, 50, 'sekai', 12345).vocalId, 47)
  assert.equal(tracks.trackFor(sources, 9, 'sekai'), null)
  assert.equal(tracks.trackFor(sources, 404, 'sekai'), null)
})

test('leading silence prefers filterSec and ignores junk', () => {
  assert.equal(tracks.trimStartOf({ filterSec: 3, fillerSec: 9 }), 3)
  assert.equal(tracks.trimStartOf({ filterSec: 0, fillerSec: 9 }), 9)
  assert.equal(tracks.trimStartOf({ fillerSec: 'x' }), 0)
  assert.equal(tracks.trimStartOf({}), 0)
})

test('portraits exist for the 26 game characters only', () => {
  assert.equal(tracks.characterPortrait(21), '/img/chr_ts/chr_ts_21.png')
  assert.equal(tracks.characterPortrait(0), null)
  assert.equal(tracks.characterPortrait(27), null)
  assert.equal(tracks.characterPortrait(1.5), null)
})

test('a restored queue only keeps complete, safe track records', () => {
  const good = { uid: 'u1', ...tracks.trackFor(sources, 50, 'sekai') }
  assert.equal(tracks.isPlayerTrack(good), true)
  assert.equal(tracks.isPlayerTrack(JSON.parse(JSON.stringify(good))), true)
  assert.equal(tracks.isPlayerTrack({ ...good, uid: undefined }), false)
  assert.equal(tracks.isPlayerTrack({ ...good, musicId: '50' }), false)
  assert.equal(tracks.isPlayerTrack({ ...good, trimStart: -1 }), false)
  assert.equal(tracks.isPlayerTrack({ ...good, singers: [{ type: 'robot', id: 1 }] }), false)
  // bundle names end up in URLs: nothing but word characters and dashes
  assert.equal(tracks.isPlayerTrack({ ...good, vocalAssetbundle: '../../evil' }), false)
  assert.equal(tracks.isPlayerTrack({ ...good, jacketAssetbundle: 'a/b' }), false)
  assert.equal(tracks.isPlayerTrack(null), false)
  assert.equal(tracks.isPlayerTrack('track'), false)
})
