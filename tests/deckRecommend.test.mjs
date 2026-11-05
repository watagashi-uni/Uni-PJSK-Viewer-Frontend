import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as calculator33 from 'sekai-calculator'
import * as moesekai from '../src/vendor/moesekai-calculator/index.mjs'

// The app creates a fresh Worker per calculation; isolate engine caches likewise.
beforeEach(() => {
  for (const engine of [calculator33, moesekai]) {
    engine.CachedDataProvider.globalCache.clear()
    engine.CachedDataProvider.runningPromise.clear()
  }
})

const musicMeta = {
  music_id: 1, difficulty: 'expert', event_rate: 100,
  base_score: 3, fever_score: 0.3, base_score_auto: 2,
  skill_score_solo: Array(6).fill(0.2),
  skill_score_multi: Array(6).fill(0.2),
  skill_score_auto: Array(6).fill(0.1),
}

// Memories events are plain marathons in master data (e.g. event 222): all five
// attributes get 25%, and the four unit members get 75% for every attribute.
// Virtual singers have only the attribute bonus; there are no pickup cards.
function fixture() {
  const attrs = ['cute', 'cool', 'pure', 'happy', 'mysterious']
  const characterIds = [5, 6, 7, 8, 21]
  const cards = characterIds.map((characterId, i) => ({
    id: i + 1, characterId, cardRarityType: 'rarity_4',
    attr: attrs[i], supportUnit: characterId === 21 ? 'idol' : 'none', skillId: 1,
    cardParameters: ['param1', 'param2', 'param3'].map(cardParameterType => ({
      cardLevel: 1, cardParameterType, power: 1000,
    })),
  }))
  const master = {
    events: [{ id: 222, eventType: 'marathon' }], cards,
    gameCharacters: characterIds.map(id => ({ id, unit: id === 21 ? 'piapro' : 'idol' })),
    gameCharacterUnits: characterIds.slice(0, 4).map(id => ({ id, gameCharacterId: id, unit: 'idol' })),
    eventDeckBonuses: attrs.flatMap(cardAttr => [
      { eventId: 222, cardAttr, bonusRate: 25 },
      ...characterIds.slice(0, 4).map(gameCharacterUnitId => ({
        eventId: 222, cardAttr, gameCharacterUnitId, bonusRate: 75,
      })),
    ]),
    eventCards: [], eventHonorBonuses: [],
    eventRarityBonusRates: [{ cardRarityType: 'rarity_4', masterRank: 0, bonusRate: 10 }],
    skills: [{ id: 1, skillEffects: [{
      skillEffectType: 'score_up',
      skillEffectDetails: [{ level: 1, activateEffectValue: 100 }],
    }] }],
    characterRanks: characterIds.map(characterId => ({
      characterId, characterRank: 1, power1BonusRate: 0, power2BonusRate: 0, power3BonusRate: 0,
    })),
    cardEpisodes: [], masterLessons: [], honors: [],
  }
  const user = {
    userCards: cards.map(card => ({
      cardId: card.id, level: 1, skillLevel: 1, masterRank: 0,
      specialTrainingStatus: 'not_doing', defaultImage: 'original', episodes: [],
    })),
    userCharacters: characterIds.map(characterId => ({ characterId, characterRank: 1 })),
    userAreas: [], userHonors: [], userMysekaiCanvases: [], userMysekaiGates: [],
    userMysekaiFixtureGameCharacterPerformanceBonuses: [],
  }
  return {
    master,
    getMasterData: async key => {
      assert.ok(key in master, `Unexpected master request: ${key}`)
      return master[key]
    },
    getUserData: async key => user[key],
    getUserDataAll: async () => user,
  }
}

for (const [name, engine] of [['3-3', calculator33], ['MoeSekai', moesekai]]) {
  test(`${name}: Memories event runs through real recommendation and keeps its bonuses`, async () => {
    const data = new engine.CachedDataProvider(fixture())
    const eventConfig = await new engine.EventService(data).getEventConfig(222)
    assert.equal(eventConfig.eventType, 'marathon')
    assert.equal(eventConfig.worldBloomDifferentAttributeBonuses, undefined)

    const recommend = new engine.EventDeckRecommend(data)
    const result = await recommend.recommendEventDeck(222, engine.LiveType.MULTI, {
      musicMeta, limit: 1, algorithm: 'dfs', timeoutMs: 1000,
    })
    assert.equal(result.length, 1)
    assert.equal(result[0].cards.length, 5)
    assert.equal(result[0].eventBonus, 375) // 4 * (75 + 10) + (25 + 10)
    assert.ok(Number.isFinite(result[0].score) && result[0].score > 0)
  })
}

test('3-3: Memories bonuses are detected as attribute-independent', async () => {
  const data = new calculator33.CachedDataProvider(fixture())
  const eventConfig = await new calculator33.EventService(data).getEventConfig(222)
  assert.equal(eventConfig.attrIndependentBonus, true)
})

test('3-3: returns the available decks when fewer than the limit exist', async () => {
  const engine = new calculator33.EventDeckRecommend(new calculator33.CachedDataProvider(fixture()))
  const result = await engine.recommendEventDeck(222, calculator33.LiveType.MULTI, { musicMeta, limit: 10 })
  // Only one member set exists; identical skills make every leader order tie.
  assert.ok(result.length >= 1 && result.length < 10)
  for (const deck of result) {
    assert.deepEqual(deck.cards.map(it => it.cardId).sort(), [1, 2, 3, 4, 5])
    assert.equal(deck.eventBonus, 375)
  }
})

test('3-3: still reports failure when no valid deck exists', async () => {
  const data = new calculator33.CachedDataProvider(fixture())
  const user = await data.getUserDataAll()
  user.userCards = user.userCards.slice(0, 4)
  const engine = new calculator33.EventDeckRecommend(data)
  await assert.rejects(
    engine.recommendEventDeck(222, calculator33.LiveType.MULTI, { musicMeta, limit: 10 }),
    /Cannot recommend any deck in 4 cards/,
  )
})

for (const [name, corrupt, expected] of [
  ['card', provider => { provider.master.cards = [] }, /卡牌数据（cardId=1）/],
  ['skill', provider => { provider.master.skills = [] }, /技能数据（cardId=1, skillId=1）/],
  ['skill level', provider => { provider.master.skills[0].skillEffects[0].skillEffectDetails = [] }, /技能等级数据（cardId=1, skillId=1, level=1）/],
  ['character rank', provider => { provider.master.characterRanks = [] }, /角色等级加成数据（characterId=5, rank=1）/],
  ['honor', async provider => { (await provider.getUserDataAll()).userHonors = [{ honorId: 123, level: 2 }] }, /称号数据（honorId=123）/],
  ['honor level', async provider => {
    (await provider.getUserDataAll()).userHonors = [{ honorId: 123, level: 2 }]
    provider.master.honors = [{ id: 123, levels: [{ level: 1, bonus: 0 }] }]
  }, /称号等级数据（honorId=123, level=2）/],
]) {
  test(`MoeSekai: missing ${name} identifies the failed lookup instead of object not found`, async () => {
    const provider = fixture()
    await corrupt(provider)
    const engine = new moesekai.EventDeckRecommend(new moesekai.CachedDataProvider(provider))
    await assert.rejects(engine.recommendEventDeck(222, moesekai.LiveType.MULTI, { musicMeta, limit: 1 }), expected)
  })
}

test('MoeSekai: missing song analysis identifies the music and difficulty', async () => {
  const provider = { ...fixture(), getMusicMeta: async () => [] }
  const engine = new moesekai.LiveCalculator(new moesekai.CachedDataProvider(provider))
  await assert.rejects(engine.getMusicMeta(74, 'append'), /歌曲计算数据（musicId=74, difficulty=append）/)
})
