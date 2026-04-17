function findOrThrow(arr, p) {
    const result = arr.find(p);
    if (result === undefined)
        throw new Error('object not found');
    return result;
}
function getOrThrow(map, key) {
    const value = map.get(key);
    if (value === undefined)
        throw new Error('key not found');
    return value;
}
function getOrDefault(map, key, defaultValue) {
    const value = map.get(key);
    if (value === undefined)
        return defaultValue;
    return value;
}
function computeWithDefault(map, key, defaultValue, action) {
    map.set(key, action(getOrDefault(map, key, defaultValue)));
}
function duplicateObj(obj, times) {
    const ret = [];
    for (let i = 0; i < times; ++i)
        ret.push(obj);
    return ret;
}
function containsAny(collection, contains) {
    for (const c of contains) {
        if (collection.includes(c))
            return true;
    }
    return false;
}
function swap(arr, i, j) {
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
}
function mapToString(map) {
    const strings = [];
    for (const key of map.keys()) {
        const value = map.get(key);
        if (value === undefined)
            throw new Error('Map to string failed.');
        strings.push(`${key.toString()}->${value.toString()}`);
    }
    return strings.join(', ');
}

class CachedDataProvider {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    static globalCache = new Map();
    instanceCache = new Map();
    static runningPromise = new Map();
    async getData(cache, cacheKey, promise) {
        if (cache.has(cacheKey))
            return cache.get(cacheKey);
        while (CachedDataProvider.runningPromise.has(cacheKey)) {
            await CachedDataProvider.runningPromise.get(cacheKey);
        }
        if (cache.has(cacheKey))
            return cache.get(cacheKey);
        CachedDataProvider.runningPromise.set(cacheKey, promise());
        const data = await getOrThrow(CachedDataProvider.runningPromise, cacheKey).then(data => {
            cache.set(cacheKey, data);
            return data;
        });
        CachedDataProvider.runningPromise.delete(cacheKey);
        return data;
    }
    async getMasterData(key) {
        return await this.getData(CachedDataProvider.globalCache, key, async () => await this.dataProvider.getMasterData(key));
    }
    async getMusicMeta() {
        return await this.getData(CachedDataProvider.globalCache, 'musicMeta', async () => await this.dataProvider.getMusicMeta());
    }
    async getUserData(key) {
        const allData = await this.getUserDataAll();
        return allData[key];
    }
    async getUserDataAll() {
        return await this.getData(this.instanceCache, 'userData', async () => await this.dataProvider.getUserDataAll());
    }
    async preloadMasterData(keys) {
        return await Promise.all(keys.map(async (it) => await this.getMasterData(it)));
    }
}

class AreaItemService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getAreaItemLevels() {
        const userAreas = await this.dataProvider.getUserData('userAreas');
        return await Promise.all(userAreas.flatMap(it => it.areaItems)
            .map(async (it) => await this.getAreaItemLevel(it.areaItemId, it.level)));
    }
    async getAreaItemLevel(areaItemId, level) {
        const areaItemLevels = await this.dataProvider.getMasterData('areaItemLevels');
        return findOrThrow(areaItemLevels, it => it.areaItemId === areaItemId && it.level === level);
    }
    async getAreaItemNextLevel(areaItem, areaItemLevel) {
        const level = areaItemLevel === undefined ? 1 : (areaItemLevel.level === 15 ? 15 : areaItemLevel.level + 1);
        return await this.getAreaItemLevel(areaItem.id, level);
    }
    async getShopItem(areaItemLevel) {
        const shopItems = await this.dataProvider.getMasterData('shopItems');
        const idOffset = areaItemLevel.level <= 10
            ? (1000 + (areaItemLevel.areaItemId - 1) * 10)
            : (1550 - 10 + (areaItemLevel.areaItemId - 1) * 5);
        const id = idOffset + areaItemLevel.level;
        return findOrThrow(shopItems, it => it.id === id);
    }
}

class CardService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardUnits(card) {
        const gameCharacters = await this.dataProvider.getMasterData('gameCharacters');
        const units = [];
        if (card.supportUnit !== 'none')
            units.push(card.supportUnit);
        units.push(findOrThrow(gameCharacters, it => it.id === card.characterId).unit);
        return units;
    }
    async applyCardConfig(userCard, card, { rankMax = false, episodeRead = false, masterMax = false, skillMax = false } = {}) {
        if (!rankMax && !episodeRead && !masterMax && !skillMax)
            return userCard;
        const cardRarities = await this.dataProvider.getMasterData('cardRarities');
        const cardRarity = findOrThrow(cardRarities, it => it.cardRarityType === card.cardRarityType);
        const ret = JSON.parse(JSON.stringify(userCard));
        if (rankMax) {
            if (cardRarity.trainingMaxLevel !== undefined) {
                ret.level = cardRarity.trainingMaxLevel;
                ret.specialTrainingStatus = 'done';
            }
            else {
                ret.level = cardRarity.maxLevel;
            }
        }
        if (episodeRead && ret.episodes !== undefined) {
            ret.episodes.forEach(it => {
                it.scenarioStatus = 'already_read';
            });
        }
        if (masterMax) {
            ret.masterRank = 5;
        }
        if (skillMax) {
            ret.skillLevel = cardRarity.maxSkillLevel;
        }
        return ret;
    }
}

class DeckService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getUserCard(cardId) {
        const userCards = await this.dataProvider.getUserData('userCards');
        return findOrThrow(userCards, it => it.cardId === cardId);
    }
    async getDeck(deckId) {
        const userDecks = await this.dataProvider.getUserData('userDecks');
        return findOrThrow(userDecks, it => it.deckId === deckId);
    }
    async getDeckCards(userDeck) {
        const cardIds = [userDeck.member1, userDeck.member2, userDeck.member3, userDeck.member4, userDeck.member5];
        return await Promise.all(cardIds.map(async (id) => await this.getUserCard(id)));
    }
    static toUserDeck(userCards, userId = 1145141919810, deckId = 1, name = 'ユニット01') {
        if (userCards.length !== 5)
            throw new Error('deck card should be 5');
        return {
            userId,
            deckId,
            name,
            leader: userCards[0].cardId,
            subLeader: userCards[1].cardId,
            member1: userCards[0].cardId,
            member2: userCards[1].cardId,
            member3: userCards[2].cardId,
            member4: userCards[3].cardId,
            member5: userCards[4].cardId
        };
    }
    async getChallengeLiveSoloDeck(characterId) {
        const userChallengeLiveSoloDecks = await this.dataProvider.getUserData('userChallengeLiveSoloDecks');
        return findOrThrow(userChallengeLiveSoloDecks, it => it.characterId === characterId);
    }
    async getChallengeLiveSoloDeckCards(deck) {
        const cardIds = [deck.leader, deck.support1, deck.support2, deck.support3, deck.support4];
        return await Promise.all(cardIds.filter(it => it !== undefined && it !== null)
            .map(async (id) => await this.getUserCard(id === null ? 0 : id)));
    }
    static toUserChallengeLiveSoloDeck(userCards, characterId) {
        if (userCards.length < 1)
            throw new Error('deck card should >= 1');
        if (userCards.length > 5)
            throw new Error('deck card should <= 5');
        return {
            characterId,
            leader: userCards[0].cardId,
            support1: userCards.length < 2 ? null : userCards[1].cardId,
            support2: userCards.length < 3 ? null : userCards[2].cardId,
            support3: userCards.length < 4 ? null : userCards[3].cardId,
            support4: userCards.length < 5 ? null : userCards[4].cardId
        };
    }
    static toUserWorldBloomSupportDeck(userCards, eventId, gameCharacterId) {
        if (userCards.length > 25)
            throw new Error('deck card should <= 25');
        return {
            gameCharacterId,
            eventId,
            member1: userCards.length < 1 ? 0 : userCards[0].cardId,
            member2: userCards.length < 2 ? 0 : userCards[1].cardId,
            member3: userCards.length < 3 ? 0 : userCards[2].cardId,
            member4: userCards.length < 4 ? 0 : userCards[3].cardId,
            member5: userCards.length < 5 ? 0 : userCards[4].cardId,
            member6: userCards.length < 6 ? 0 : userCards[5].cardId,
            member7: userCards.length < 7 ? 0 : userCards[6].cardId,
            member8: userCards.length < 8 ? 0 : userCards[7].cardId,
            member9: userCards.length < 9 ? 0 : userCards[8].cardId,
            member10: userCards.length < 10 ? 0 : userCards[9].cardId,
            member11: userCards.length < 11 ? 0 : userCards[10].cardId,
            member12: userCards.length < 12 ? 0 : userCards[11].cardId,
            member13: userCards.length < 13 ? 0 : userCards[12].cardId,
            member14: userCards.length < 14 ? 0 : userCards[13].cardId,
            member15: userCards.length < 15 ? 0 : userCards[14].cardId,
            member16: userCards.length < 16 ? 0 : userCards[15].cardId,
            member17: userCards.length < 17 ? 0 : userCards[16].cardId,
            member18: userCards.length < 18 ? 0 : userCards[17].cardId,
            member19: userCards.length < 19 ? 0 : userCards[18].cardId,
            member20: userCards.length < 20 ? 0 : userCards[19].cardId,
            member21: userCards.length < 21 ? 0 : userCards[20].cardId,
            member22: userCards.length < 22 ? 0 : userCards[21].cardId,
            member23: userCards.length < 23 ? 0 : userCards[22].cardId,
            member24: userCards.length < 24 ? 0 : userCards[23].cardId,
            member25: userCards.length < 25 ? 0 : userCards[24].cardId
        };
    }
}

class EventService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getEventType(eventId) {
        const events = await this.dataProvider.getMasterData('events');
        const event = findOrThrow(events, it => it.id === eventId);
        switch (event.eventType) {
            case 'marathon':
                return EventType.MARATHON;
            case 'cheerful_carnival':
                return EventType.CHEERFUL;
            case 'world_bloom':
                return EventType.BLOOM;
            default:
                throw new Error(`Event type ${event.eventType} not found.`);
        }
    }
    async getEventConfig(eventId, specialCharacterId) {
        const eventType = await this.getEventType(eventId);
        const isWorldBloom = eventType === EventType.BLOOM;
        const worldBloomType = isWorldBloom ? await this.getWorldBloomType(eventId) : undefined;
        const isWorldBloomFinale = EventService.isWorldBloomFinale(worldBloomType);
        const worldBloomEventTurn = isWorldBloom
            ? EventService.getWorldBloomEventTurn(eventId)
            : undefined;
        return {
            eventId,
            eventType,
            eventUnit: await this.getEventBonusUnit(eventId),
            specialCharacterId,
            cardBonusCountLimit: isWorldBloomFinale ? await this.getEventCardBonusCountLimit(eventId) : 5,
            skillScoreUpLimit: Number.MAX_SAFE_INTEGER,
            mysekaiFixtureLimit: isWorldBloomFinale ? await this.getMysekaiFixtureLimit(eventId) : Number.MAX_SAFE_INTEGER,
            worldBloomDifferentAttributeBonuses: isWorldBloom ? await this.getWorldBloomDifferentAttributeBonuses() : undefined,
            worldBloomType,
            worldBloomEventTurn,
            worldBloomSupportUnit: isWorldBloom ? await this.getWorldBloomSupportUnit(specialCharacterId) : undefined
        };
    }
    async getEventBonusUnit(eventId) {
        const eventDeckBonuses = await this.dataProvider.getMasterData('eventDeckBonuses');
        const gameCharacterUnits = await this.dataProvider.getMasterData('gameCharacterUnits');
        const gameCharacters = await this.dataProvider.getMasterData('gameCharacters');
        const bonuses = eventDeckBonuses
            .filter(it => it.eventId === eventId && it.gameCharacterUnitId !== undefined)
            .map(it => findOrThrow(gameCharacterUnits, a => a.id === it.gameCharacterUnitId));
        const map = new Map();
        bonuses.forEach(gcu => {
            const gameCharacter = findOrThrow(gameCharacters, it => it.id === gcu.gameCharacterId);
            map.set(gameCharacter.unit, (map.get(gameCharacter.unit) ?? 0) + 1);
            if (gameCharacter.unit !== gcu.unit) {
                map.set(gcu.unit, (map.get(gcu.unit) ?? 0) + 1);
            }
        });
        for (const [key, value] of map) {
            if (value === bonuses.length) {
                return key;
            }
        }
        return undefined;
    }
    async getWorldBloomDifferentAttributeBonuses() {
        return await this.dataProvider
            .getMasterData('worldBloomDifferentAttributeBonuses');
    }
    async getEventCardBonusCountLimit(eventId) {
        const limits = await this.dataProvider
            .getMasterData('eventCardBonusLimits');
        const limit = limits.find(it => it.eventId === eventId);
        return limit?.memberCountLimit ?? 5;
    }
    async getEventSkillScoreUpLimit(eventId) {
        const limits = await this.dataProvider.getMasterData('eventSkillScoreUpLimits');
        const limit = limits.find(it => it.eventId === eventId);
        if (limit === undefined) {
            return Number.MAX_SAFE_INTEGER;
        }
        return limit.scoreUpRateLimit;
    }
    async getMysekaiFixtureLimit(eventId) {
        const limits = await this.dataProvider
            .getMasterData('eventMysekaiFixtureGameCharacterPerformanceBonusLimits');
        const limit = limits.find(it => it.eventId === eventId);
        return limit?.bonusRateLimit ?? Number.MAX_SAFE_INTEGER;
    }
    async getWorldBloomType(eventId) {
        const worldBlooms = await this.dataProvider.getMasterData('worldBlooms');
        const worldBloom = worldBlooms.find(it => it.eventId === eventId);
        return worldBloom?.worldBloomChapterType;
    }
    async getWorldBloomSupportUnit(specialCharacterId) {
        if (specialCharacterId === undefined) {
            return undefined;
        }
        const gameCharacters = await this.dataProvider.getMasterData('gameCharacters');
        const gameCharacter = findOrThrow(gameCharacters, it => it.id === specialCharacterId);
        return gameCharacter.unit;
    }
    static isWorldBloomFinale(worldBloomType) {
        return worldBloomType === 'finale';
    }
    static getWorldBloomEventTurn(eventId) {
        if (eventId > 1000) {
            return (((Math.floor(eventId / 100000)) % 10) + 1);
        }
        if (eventId <= 140)
            return 1;
        if (eventId <= 180)
            return 2;
        return 3;
    }
}
var EventType;
(function (EventType) {
    EventType["NONE"] = "none";
    EventType["MARATHON"] = "marathon";
    EventType["CHEERFUL"] = "cheerful_carnival";
    EventType["BLOOM"] = "world_bloom";
})(EventType || (EventType = {}));

class CardDetailMap {
    min = Number.MAX_SAFE_INTEGER;
    max = Number.MIN_SAFE_INTEGER;
    values = new Map();
    set(unit, unitMember, attrMember, cmpValue, value) {
        this.updateMinMax(cmpValue);
        this.values.set(CardDetailMap.getKey(unit, unitMember, attrMember), value);
    }
    setPublic(unit, unitMember, attrMember, cmpValue, value) {
        this.set(unit, unitMember, attrMember, cmpValue, value);
    }
    updateMinMax(cmpValue) {
        this.min = Math.min(this.min, cmpValue);
        this.max = Math.max(this.max, cmpValue);
    }
    getInternal(unit, unitMember, attrMember) {
        return this.values.get(CardDetailMap.getKey(unit, unitMember, attrMember));
    }
    static getKey(unit, unitMember, attrMember) {
        return `${unit}-${unitMember}-${attrMember}`;
    }
    getMax() {
        return this.max;
    }
    getMin() {
        return this.min;
    }
    isCertainlyLessThen(another) {
        return this.max < another.min;
    }
}

class CardDetailMapPower extends CardDetailMap {
    setPower(unit, sameUnit, sameAttr, value) {
        super.set(unit, sameUnit ? 5 : 1, sameAttr ? 5 : 1, value.total, value);
    }
    getPower(unit, unitMember, attrMember) {
        const unitMember0 = unitMember === 5 ? 5 : 1;
        const attrMember0 = attrMember === 5 ? 5 : 1;
        const best = super.getInternal(unit, unitMember0, attrMember0);
        if (best !== undefined) {
            return best;
        }
        throw new Error('case not found');
    }
}

class CardPowerCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardPower(userCard, card, cardUnits, userAreaItemLevels, hasCanvasBonus, userGateBonuses, mysekaiFixtureLimit = Number.MAX_SAFE_INTEGER) {
        const ret = new CardDetailMapPower();
        const basePower = await this.getCardBasePowers(userCard, card, hasCanvasBonus);
        const characterBonus = await this.getCharacterBonusPower(basePower, card.characterId);
        const fixtureBonus = await this.getFixtureBonusPower(basePower, card.characterId, mysekaiFixtureLimit);
        const gateBonus = await this.getGateBonusPower(basePower, userGateBonuses, cardUnits);
        for (const unit of cardUnits) {
            for (let i = 0; i < 4; ++i) {
                const sameUnit = (i & 1) === 1;
                const sameAttr = (i & 2) === 2;
                const power = await this.getPower(card, basePower, characterBonus, fixtureBonus, gateBonus, userAreaItemLevels, unit, sameUnit, sameAttr);
                ret.setPower(unit, sameUnit, sameAttr, power);
            }
        }
        return ret;
    }
    async getPower(card, basePower, characterBonus, fixtureBonus, gateBonus, userAreaItemLevels, unit, sameUnit, sameAttr) {
        const base = CardPowerCalculator.sumPower(basePower);
        const areaItemBonus = await this.getAreaItemBonusPower(userAreaItemLevels, basePower, card.characterId, unit, sameUnit, card.attr, sameAttr);
        return {
            base,
            areaItemBonus,
            characterBonus,
            fixtureBonus,
            gateBonus,
            total: base + areaItemBonus + characterBonus + fixtureBonus + gateBonus
        };
    }
    async getCardBasePowers(userCard, card, hasMysekaiCanvas) {
        const [cardEpisodes, masterLessons] = await Promise.all([
            await this.dataProvider.getMasterData('cardEpisodes'),
            await this.dataProvider.getMasterData('masterLessons')
        ]);
        const ret = [0, 0, 0];
        const cardParameters = card.cardParameters
            .filter(it => it.cardLevel === userCard.level);
        const params = ['param1', 'param2', 'param3'];
        params.forEach((param, i) => {
            ret[i] = findOrThrow(cardParameters, it => it.cardParameterType === param).power;
        });
        if (userCard.specialTrainingStatus === 'done') {
            ret[0] += card.specialTrainingPower1BonusFixed;
            ret[1] += card.specialTrainingPower2BonusFixed;
            ret[2] += card.specialTrainingPower3BonusFixed;
        }
        const episodes = userCard.episodes === undefined
            ? []
            : userCard.episodes.filter(it => it.scenarioStatus === 'already_read')
                .map(it => findOrThrow(cardEpisodes, e => e.id === it.cardEpisodeId));
        for (const episode of episodes) {
            ret[0] += episode.power1BonusFixed;
            ret[1] += episode.power2BonusFixed;
            ret[2] += episode.power3BonusFixed;
        }
        const usedMasterLessons = masterLessons
            .filter((it) => it.cardRarityType === card.cardRarityType && it.masterRank <= userCard.masterRank);
        for (const masterLesson of usedMasterLessons) {
            ret[0] += masterLesson.power1BonusFixed;
            ret[1] += masterLesson.power2BonusFixed;
            ret[2] += masterLesson.power3BonusFixed;
        }
        if (hasMysekaiCanvas) {
            const cardMysekaiCanvasBonuses = await this.dataProvider.getMasterData('cardMysekaiCanvasBonuses');
            const canvasBonus = findOrThrow(cardMysekaiCanvasBonuses, it => it.cardRarityType === card.cardRarityType);
            ret[0] += canvasBonus.power1BonusFixed;
            ret[1] += canvasBonus.power2BonusFixed;
            ret[2] += canvasBonus.power3BonusFixed;
        }
        return ret;
    }
    async getAreaItemBonusPower(userAreaItemLevels, basePower, characterId, unit, sameUnit, attr, sameAttr) {
        const usedAreaItems = userAreaItemLevels.filter(it => (it.targetUnit === 'any' || it.targetUnit === unit) &&
            (it.targetCardAttr === 'any' || it.targetCardAttr === attr) &&
            (it.targetGameCharacterId === undefined || it.targetGameCharacterId === characterId));
        const areaItemBonus = [0, 0, 0];
        for (const areaItem of usedAreaItems) {
            const allMatch = (areaItem.targetUnit !== 'any' && sameUnit) ||
                (areaItem.targetCardAttr !== 'any' && sameAttr);
            const rates = [
                allMatch ? areaItem.power1AllMatchBonusRate : areaItem.power1BonusRate,
                allMatch ? areaItem.power2AllMatchBonusRate : areaItem.power2BonusRate,
                allMatch ? areaItem.power3AllMatchBonusRate : areaItem.power3BonusRate
            ];
            rates.forEach((rate, i) => {
                areaItemBonus[i] = Math.fround(areaItemBonus[i] +
                    Math.fround(Math.fround(Math.fround(rate) * Math.fround(0.01)) * basePower[i]));
            });
        }
        return areaItemBonus.reduce((v, it) => v + Math.floor(it), 0);
    }
    async getCharacterBonusPower(basePower, characterId) {
        const characterRanks = await this.dataProvider.getMasterData('characterRanks');
        const userCharacters = await this.dataProvider.getUserData('userCharacters');
        const userCharacter = findOrThrow(userCharacters, it => it.characterId === characterId);
        const characterRank = findOrThrow(characterRanks, it => it.characterId === userCharacter.characterId &&
            it.characterRank === userCharacter.characterRank);
        const rates = [
            characterRank.power1BonusRate,
            characterRank.power2BonusRate,
            characterRank.power3BonusRate
        ];
        return rates
            .reduce((v, it, i) => v +
            Math.floor(Math.fround(Math.fround(Math.fround(it) * Math.fround(0.01)) * basePower[i])), 0);
    }
    async getFixtureBonusPower(basePower, characterId, mysekaiFixtureLimit = Number.MAX_SAFE_INTEGER) {
        const userFixtureBonuses = await this.dataProvider.getUserData('userMysekaiFixtureGameCharacterPerformanceBonuses');
        if (userFixtureBonuses === undefined || userFixtureBonuses === null || userFixtureBonuses.length === 0) {
            return 0;
        }
        const fixtureBonus = userFixtureBonuses
            .find(it => it.gameCharacterId === characterId);
        if (fixtureBonus === undefined) {
            return 0;
        }
        const bonus = Math.min(fixtureBonus.totalBonusRate, mysekaiFixtureLimit);
        return Math.floor(Math.fround(CardPowerCalculator.sumPower(basePower) *
            Math.fround(Math.fround(bonus) * Math.fround(0.001))));
    }
    async getGateBonusPower(basePower, userGateBonuses, cardUnits) {
        const isOnlyPiapro = cardUnits.length === 1 && cardUnits[0] === 'piapro';
        let powerBonusRate = 0;
        for (const bonus of userGateBonuses) {
            if (isOnlyPiapro || cardUnits.includes(bonus.unit)) {
                powerBonusRate = Math.max(powerBonusRate, bonus.powerBonusRate);
            }
        }
        return Math.floor(Math.fround(CardPowerCalculator.sumPower(basePower) *
            Math.fround(Math.fround(powerBonusRate) * Math.fround(0.01))));
    }
    static sumPower(power) {
        return power.reduce((v, it) => v + it, 0);
    }
}

class CardDetailMapSkill extends CardDetailMap {
    preTrainingMap = new CardDetailMap();
    _hasPreTraining = false;
    get hasPreTraining() {
        return this._hasPreTraining;
    }
    setSkill(unit, unitMember, attrMember, cmpValue, value) {
        super.set(unit, unitMember, attrMember, cmpValue, value);
    }
    setPreTrainingSkill(unit, unitMember, attrMember, cmpValue, value) {
        this.preTrainingMap.setPublic(unit, unitMember, attrMember, cmpValue, value);
        this._hasPreTraining = true;
    }
    getSkill(unit, unitMember) {
        return CardDetailMapSkill.resolveSkill(this, unit, unitMember);
    }
    getPreTrainingSkill(unit, unitMember) {
        if (!this._hasPreTraining) {
            throw new Error('no pre-training skill');
        }
        return CardDetailMapSkill.resolveSkill(this.preTrainingMap, unit, unitMember);
    }
    static resolveSkill(map, unit, unitMember) {
        if (unit === 'ref') {
            const best = map.getInternal('ref', 1, 1);
            if (best !== undefined)
                return best;
        }
        if (unit === 'diff') {
            const best = map.getInternal('diff', Math.min(2, unitMember), 1);
            if (best !== undefined)
                return best;
        }
        const best = map.getInternal(unit, unitMember, 1);
        if (best !== undefined)
            return best;
        const fallback = map.getInternal('any', 1, 1);
        if (fallback !== undefined)
            return fallback;
        throw new Error('case not found');
    }
}

class CardSkillCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardSkill(userCard, card, scoreUpLimit = Number.MAX_SAFE_INTEGER) {
        const skillMap = new CardDetailMapSkill();
        const detailBefore = await this.getSkillDetail(userCard, card, false);
        const detailAfter = card.specialTrainingSkillId !== undefined
            ? await this.getSkillDetail(userCard, card, true)
            : undefined;
        const fillSkill = (detail, setter) => {
            const scoreUpSelfFixed = detail.scoreUpBasic + detail.scoreUpCharacterRank;
            const deckSkill = {
                skillId: detail.skillId,
                isAfterTraining: detail.isAfterTraining,
                scoreUpFixed: Math.min(scoreUpSelfFixed, scoreUpLimit),
                scoreUpToReference: Math.min(scoreUpSelfFixed, scoreUpLimit),
                lifeRecovery: detail.lifeRecovery
            };
            setter('any', 1, 1, deckSkill.scoreUpFixed, deckSkill);
            if (detail.scoreUpSameUnit !== undefined) {
                for (let i = 1; i <= 5; ++i) {
                    const dd = { ...deckSkill };
                    dd.scoreUpFixed += (i === 5 ? 5 : (i - 1)) * detail.scoreUpSameUnit.value;
                    dd.scoreUpFixed = Math.min(dd.scoreUpFixed, scoreUpLimit);
                    dd.scoreUpToReference = dd.scoreUpFixed;
                    setter(detail.scoreUpSameUnit.unit, i, 1, dd.scoreUpFixed, dd);
                }
            }
            if (detail.scoreUpReference !== undefined) {
                const dd = { ...deckSkill };
                dd.hasScoreUpReference = true;
                dd.scoreUpReferenceRate = detail.scoreUpReference.rate;
                dd.scoreUpReferenceMax = Math.min(detail.scoreUpReference.max, scoreUpLimit - scoreUpSelfFixed);
                setter('ref', 1, 1, dd.scoreUpFixed + detail.scoreUpReference.max, dd);
            }
            if (detail.scoreUpDifferentUnit !== undefined) {
                for (let i = 0; i <= 2; ++i) {
                    const dd = { ...deckSkill };
                    if (i > 0 && detail.scoreUpDifferentUnit.has(i)) {
                        dd.scoreUpFixed += detail.scoreUpDifferentUnit.get(i);
                        dd.scoreUpFixed = Math.min(dd.scoreUpFixed, scoreUpLimit);
                        dd.scoreUpToReference = dd.scoreUpFixed;
                    }
                    setter('diff', i, 1, dd.scoreUpFixed, dd);
                }
            }
        };
        if (detailAfter !== undefined) {
            fillSkill(detailAfter, (u, um, am, cv, v) => skillMap.setSkill(u, um, am, cv, v));
            fillSkill(detailBefore, (u, um, am, cv, v) => skillMap.setPreTrainingSkill(u, um, am, cv, v));
        }
        else {
            fillSkill(detailBefore, (u, um, am, cv, v) => skillMap.setSkill(u, um, am, cv, v));
        }
        return skillMap;
    }
    async getSkillDetail(userCard, card, afterTraining) {
        const skill = await this.getSkill(userCard, card, afterTraining);
        const characterRank = await this.getCharacterRank(card.characterId);
        const ret = {
            skillId: skill.id,
            isAfterTraining: afterTraining,
            scoreUpBasic: 0,
            scoreUpCharacterRank: 0,
            lifeRecovery: 0
        };
        for (const skillEffect of skill.skillEffects) {
            const skillEffectDetail = findOrThrow(skillEffect.skillEffectDetails, it => it.level === userCard.skillLevel);
            if (skillEffect.skillEffectType === 'score_up' ||
                skillEffect.skillEffectType === 'score_up_condition_life' ||
                skillEffect.skillEffectType === 'score_up_keep') {
                const current = skillEffectDetail.activateEffectValue;
                if (skillEffect.skillEnhance !== undefined) {
                    ret.scoreUpSameUnit = {
                        unit: skillEffect.skillEnhance.skillEnhanceCondition.unit,
                        value: skillEffect.skillEnhance.activateEffectValue
                    };
                }
                ret.scoreUpBasic = Math.max(ret.scoreUpBasic, current);
            }
            else if (skillEffect.skillEffectType === 'life_recovery') {
                ret.lifeRecovery += skillEffectDetail.activateEffectValue;
            }
            else if (skillEffect.skillEffectType === 'score_up_character_rank') {
                if (skillEffect.activateCharacterRank !== undefined &&
                    skillEffect.activateCharacterRank <= characterRank) {
                    ret.scoreUpCharacterRank =
                        Math.max(ret.scoreUpCharacterRank, skillEffectDetail.activateEffectValue);
                }
            }
            else if (skillEffect.skillEffectType === 'other_member_score_up_reference_rate') {
                ret.scoreUpReference = {
                    rate: skillEffectDetail.activateEffectValue,
                    max: skillEffectDetail.activateEffectValue2 ?? 0
                };
            }
            else if (skillEffect.skillEffectType === 'score_up_unit_count') {
                if (ret.scoreUpDifferentUnit === undefined) {
                    ret.scoreUpDifferentUnit = new Map();
                }
                if (skillEffect.activateUnitCount !== undefined) {
                    ret.scoreUpDifferentUnit.set(skillEffect.activateUnitCount, skillEffectDetail.activateEffectValue);
                }
            }
        }
        return ret;
    }
    async getSkill(userCard, card, afterTraining) {
        let skillId = card.skillId;
        if (card.specialTrainingSkillId !== undefined && afterTraining) {
            skillId = card.specialTrainingSkillId;
        }
        const skills = await this.dataProvider.getMasterData('skills');
        return findOrThrow(skills, it => it.id === skillId);
    }
    async getCharacterRank(characterId) {
        const userCharacters = await this.dataProvider.getUserData('userCharacters');
        const userCharacter = findOrThrow(userCharacters, it => it.characterId === characterId);
        return userCharacter.characterRank;
    }
}

class CardDetailMapEventBonus extends CardDetailMap {
    bonus = undefined;
    setBonus(value) {
        super.updateMinMax(value.fixedBonus);
        super.updateMinMax(value.fixedBonus + value.cardBonus + value.leaderBonus);
        this.bonus = value;
    }
    getBonus() {
        if (this.bonus !== undefined) {
            return this.bonus;
        }
        throw new Error('bonus not found');
    }
    getBonusForDisplay(leader) {
        return this.getMaxBonus(leader).toString();
    }
    getMaxBonus(leader) {
        const bonus = this.getBonus();
        return bonus.fixedBonus + bonus.cardBonus + (leader ? bonus.leaderBonus : 0);
    }
}

class CardEventCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getEventDeckBonus(eventId, card) {
        const eventDeckBonuses = await this.dataProvider.getMasterData('eventDeckBonuses');
        const gameCharacterUnits = await this.dataProvider.getMasterData('gameCharacterUnits');
        return eventDeckBonuses.filter(it => it.eventId === eventId &&
            (it.cardAttr === undefined || it.cardAttr === card.attr))
            .reduce((v, eventDeckBonus) => {
            if (eventDeckBonus.gameCharacterUnitId === undefined)
                return Math.max(v, eventDeckBonus.bonusRate);
            const gameCharacterUnit = findOrThrow(gameCharacterUnits, unit => unit.id === eventDeckBonus.gameCharacterUnitId);
            if (gameCharacterUnit.gameCharacterId !== card.characterId)
                return v;
            if (card.characterId < 21 || card.supportUnit === gameCharacterUnit.unit || card.supportUnit === 'none') {
                return Math.max(v, eventDeckBonus.bonusRate);
            }
            return v;
        }, 0);
    }
    async getCardEventBonus(userCard, eventId) {
        const cards = await this.dataProvider.getMasterData('cards');
        const eventCards = await this.dataProvider.getMasterData('eventCards');
        const eventRarityBonusRates = await this.dataProvider.getMasterData('eventRarityBonusRates');
        const card = findOrThrow(cards, it => it.id === userCard.cardId);
        let fixedBonus = await this.getEventDeckBonus(eventId, card);
        const masterRankBonus = findOrThrow(eventRarityBonusRates, it => it.cardRarityType === card.cardRarityType && it.masterRank === userCard.masterRank);
        fixedBonus += masterRankBonus.bonusRate;
        const cardBonus0 = eventCards
            .find((it) => it.eventId === eventId && it.cardId === card.id);
        const cardBonus = cardBonus0?.bonusRate ?? 0;
        const leaderBonus = await this.getCardLeaderBonus(eventId, card.characterId, cardBonus0?.leaderBonusRate ?? 0);
        const bonus = new CardDetailMapEventBonus();
        bonus.setBonus({
            fixedBonus,
            cardBonus,
            leaderBonus
        });
        return bonus;
    }
    async getCardLeaderBonus(eventId, characterId, cardLeaderBonus) {
        const eventHonorBonuses = await this.dataProvider.getMasterData('eventHonorBonuses');
        const bonuses = eventHonorBonuses
            .filter(it => it.eventId === eventId && it.leaderGameCharacterId === characterId);
        if (bonuses.length === 0) {
            return cardLeaderBonus;
        }
        const userHonors = await this.dataProvider.getUserData('userHonors');
        return userHonors
            .map(honor => bonuses.find(it => it.honorId === honor.honorId))
            .filter(it => it !== undefined)
            .reduce((p, it) => p + (it?.bonusRate ?? 0), cardLeaderBonus);
    }
}

const VIRTUAL_SINGER_MIN_ID = 21;
const VIRTUAL_SINGER_MAX_ID = 26;
class CardBloomEventCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getCardSupportDeckBonus(userCard, card, units, { eventId = 0, worldBloomEventTurn, worldBloomSupportUnit, specialCharacterId = 0 }) {
        if (worldBloomSupportUnit === undefined)
            return undefined;
        const isVirtualSinger = card.characterId >= VIRTUAL_SINGER_MIN_ID && card.characterId <= VIRTUAL_SINGER_MAX_ID;
        if (!isVirtualSinger && !units.includes(worldBloomSupportUnit)) {
            return undefined;
        }
        const worldBloomSupportDeckBonusKey = worldBloomEventTurn === 1
            ? 'worldBloomSupportDeckBonusesWL1'
            : worldBloomEventTurn === 2
                ? 'worldBloomSupportDeckBonusesWL2'
                : 'worldBloomSupportDeckBonusesWL3';
        let worldBloomSupportDeckBonuses = await this.dataProvider.getMasterData(worldBloomSupportDeckBonusKey);
        if (worldBloomSupportDeckBonuses.length === 0) {
            worldBloomSupportDeckBonuses =
                await this.dataProvider.getMasterData('worldBloomSupportDeckBonuses');
        }
        const bonus = findOrThrow(worldBloomSupportDeckBonuses, it => it.cardRarityType === card.cardRarityType);
        let total = 0;
        const type = specialCharacterId > 0 && card.characterId === specialCharacterId ? 'specific' : 'others';
        total += findOrThrow(bonus.worldBloomSupportDeckCharacterBonuses, it => it.worldBloomSupportDeckCharacterType === type).bonusRate;
        total += findOrThrow(bonus.worldBloomSupportDeckMasterRankBonuses, it => it.masterRank === userCard.masterRank).bonusRate;
        total += findOrThrow(bonus.worldBloomSupportDeckSkillLevelBonuses, it => it.skillLevel === userCard.skillLevel).bonusRate;
        const worldBloomSupportDeckUnitEventLimitedBonuses = await this.dataProvider.getMasterData('worldBloomSupportDeckUnitEventLimitedBonuses');
        const cardBonus = worldBloomSupportDeckUnitEventLimitedBonuses
            .find(it => it.eventId === eventId && it.gameCharacterId === specialCharacterId && it.cardId === card.id);
        if (cardBonus !== undefined) {
            total += cardBonus.bonusRate;
        }
        return total;
    }
}

function safeNumber(num) {
    if (num === undefined || isNaN(num))
        return 0;
    return num;
}

class MysekaiService {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async getMysekaiCanvasBonusCards() {
        const userMysekaiCanvas = await this.dataProvider.getUserData('userMysekaiCanvases');
        if (userMysekaiCanvas === undefined || userMysekaiCanvas === null) {
            return new Set();
        }
        return new Set(userMysekaiCanvas.map(it => it.cardId));
    }
    async getMysekaiFixtureBonuses() {
        return await this.dataProvider.getUserData('userMysekaiFixtureGameCharacterPerformanceBonuses');
    }
    async getMysekaiGateBonuses() {
        const userMysekaiGates = await this.dataProvider.getUserData('userMysekaiGates');
        if (userMysekaiGates === undefined || userMysekaiGates === null || userMysekaiGates.length === 0) {
            return [];
        }
        const mysekaiGates = await this.dataProvider.getMasterData('mysekaiGates');
        const mysekaiGateLevels = await this.dataProvider.getMasterData('mysekaiGateLevels');
        return userMysekaiGates.map(it => {
            const gate = findOrThrow(mysekaiGates, g => g.id === it.mysekaiGateId);
            const level = findOrThrow(mysekaiGateLevels, l => l.mysekaiGateId === it.mysekaiGateId && l.level === it.mysekaiGateLevel);
            return {
                unit: gate.unit,
                powerBonusRate: level.powerBonusRate
            };
        });
    }
}

const UNIT_ALIAS_MAP = {
    any: 'any',
    none: 'none',
    leo_need: 'leo_need',
    light_sound: 'leo_need',
    more_more_jump: 'more_more_jump',
    idol: 'more_more_jump',
    vivid_bad_squad: 'vivid_bad_squad',
    street: 'vivid_bad_squad',
    wonderlands_showtime: 'wonderlands_showtime',
    theme_park: 'wonderlands_showtime',
    nightcord_at_25: 'nightcord_at_25',
    school_refusal: 'nightcord_at_25',
    piapro: 'piapro'
};
class CardCustomBonusCalculator {
    static getCustomBonusRate(card, customBonuses) {
        let totalBonus = 0;
        for (const rule of customBonuses.rules) {
            if (CardCustomBonusCalculator.matchRule(card, rule)) {
                totalBonus += rule.bonusRate;
            }
        }
        return totalBonus;
    }
    static normalizeUnitName(unit) {
        return UNIT_ALIAS_MAP[unit] ?? unit;
    }
    static matchRule(card, rule) {
        const normalizedCardSupportUnit = CardCustomBonusCalculator.normalizeUnitName(card.supportUnit);
        if (rule.characterId !== undefined) {
            if (card.characterId !== rule.characterId)
                return false;
            if (rule.attr !== undefined && rule.attr !== 'any' && rule.attr !== card.attr)
                return false;
            if (rule.supportUnit !== undefined && rule.supportUnit !== 'any') {
                const normalizedRuleSupportUnit = CardCustomBonusCalculator.normalizeUnitName(rule.supportUnit);
                if (normalizedRuleSupportUnit !== normalizedCardSupportUnit)
                    return false;
            }
            return true;
        }
        if (rule.attr !== undefined && rule.attr !== 'any' && rule.attr !== card.attr)
            return false;
        const normalizedRuleUnit = CardCustomBonusCalculator.normalizeUnitName(rule.unit);
        if (normalizedRuleUnit !== 'any') {
            const isVirtualSinger = card.characterId >= 21 && card.characterId <= 26;
            if (normalizedRuleUnit === 'piapro') {
                if (!isVirtualSinger)
                    return false;
                if (rule.supportUnit !== undefined && rule.supportUnit !== 'any') {
                    const normalizedRuleSupportUnit = CardCustomBonusCalculator.normalizeUnitName(rule.supportUnit);
                    if (normalizedRuleSupportUnit !== normalizedCardSupportUnit)
                        return false;
                }
            }
            else {
                if (isVirtualSinger) {
                    if (normalizedCardSupportUnit !== normalizedRuleUnit && normalizedCardSupportUnit !== 'none')
                        return false;
                }
                else {
                    const unitForCharacter = CardCustomBonusCalculator.getUnitByCharacterId(card.characterId);
                    const normalizedCharacterUnit = CardCustomBonusCalculator.normalizeUnitName(unitForCharacter);
                    if (normalizedCharacterUnit !== normalizedRuleUnit)
                        return false;
                }
            }
        }
        return true;
    }
    static getUnitByCharacterId(characterId) {
        if (characterId >= 1 && characterId <= 4)
            return 'leo_need';
        if (characterId >= 5 && characterId <= 8)
            return 'more_more_jump';
        if (characterId >= 9 && characterId <= 12)
            return 'vivid_bad_squad';
        if (characterId >= 13 && characterId <= 16)
            return 'wonderlands_showtime';
        if (characterId >= 17 && characterId <= 20)
            return 'nightcord_at_25';
        return 'piapro';
    }
    static applyCustomBonus(existingBonus, card, customBonuses) {
        const customRate = CardCustomBonusCalculator.getCustomBonusRate(card, customBonuses);
        if (customRate === 0 && existingBonus === undefined)
            return undefined;
        if (existingBonus !== undefined) {
            if (customRate === 0)
                return existingBonus;
            const bonus = existingBonus.getBonus();
            const newBonus = new CardDetailMapEventBonus();
            newBonus.setBonus({
                fixedBonus: bonus.fixedBonus + customRate,
                cardBonus: bonus.cardBonus,
                leaderBonus: bonus.leaderBonus
            });
            return newBonus;
        }
        else {
            if (customRate === 0)
                return undefined;
            const newBonus = new CardDetailMapEventBonus();
            newBonus.setBonus({
                fixedBonus: customRate,
                cardBonus: 0,
                leaderBonus: 0
            });
            return newBonus;
        }
    }
}

class CardCalculator {
    dataProvider;
    powerCalculator;
    skillCalculator;
    eventCalculator;
    bloomEventCalculator;
    areaItemService;
    cardService;
    mysekaiService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.powerCalculator = new CardPowerCalculator(dataProvider);
        this.skillCalculator = new CardSkillCalculator(dataProvider);
        this.eventCalculator = new CardEventCalculator(dataProvider);
        this.bloomEventCalculator = new CardBloomEventCalculator(dataProvider);
        this.areaItemService = new AreaItemService(dataProvider);
        this.cardService = new CardService(dataProvider);
        this.mysekaiService = new MysekaiService(dataProvider);
    }
    async getCardDetail(userCard, userAreaItemLevels, config = {}, eventConfig = {}, hasCanvasBonus, userGateBonuses, singleCardConfig = {}) {
        const { eventId = 0 } = eventConfig;
        const cards = await this.dataProvider.getMasterData('cards');
        const card = findOrThrow(cards, it => it.id === userCard.cardId);
        let cfg;
        if (singleCardConfig[card.id] !== undefined) {
            cfg = singleCardConfig[card.id];
        }
        else {
            cfg = config[card.cardRarityType];
        }
        if (cfg !== undefined && cfg.disable === true)
            return undefined;
        if (cfg?.canvas === true)
            hasCanvasBonus = true;
        const userCard0 = await this.cardService.applyCardConfig(userCard, card, cfg);
        const units = await this.cardService.getCardUnits(card);
        const skill = await this.skillCalculator.getCardSkill(userCard0, card, eventConfig.skillScoreUpLimit);
        const power = await this.powerCalculator.getCardPower(userCard0, card, units, userAreaItemLevels, hasCanvasBonus, userGateBonuses, eventConfig.mysekaiFixtureLimit);
        let eventBonus = eventId === 0
            ? undefined
            : await this.eventCalculator.getCardEventBonus(userCard0, eventId);
        if (eventConfig.customBonuses !== undefined) {
            eventBonus = CardCustomBonusCalculator.applyCustomBonus(eventBonus, card, eventConfig.customBonuses);
        }
        const supportDeckBonus = await this.bloomEventCalculator.getCardSupportDeckBonus(userCard0, card, units, eventConfig);
        return {
            cardId: card.id,
            level: userCard0.level,
            skillLevel: userCard0.skillLevel,
            masterRank: userCard0.masterRank,
            cardRarityType: card.cardRarityType,
            characterId: card.characterId,
            units,
            attr: card.attr,
            power,
            skill,
            eventBonus,
            supportDeckBonus,
            hasCanvasBonus,
            defaultImage: userCard0.defaultImage ?? 'original'
        };
    }
    async batchGetCardDetail(userCards, config = {}, eventConfig = {}, areaItemLevels, singleCardConfig = {}) {
        const areaItemLevels0 = areaItemLevels === undefined
            ? await this.areaItemService.getAreaItemLevels()
            : areaItemLevels;
        const userCanvasBonusCards = await this.mysekaiService.getMysekaiCanvasBonusCards();
        const userGateBonuses = await this.mysekaiService.getMysekaiGateBonuses();
        const ret = await Promise.all(userCards.map(async (it) => await this.getCardDetail(it, areaItemLevels0, config, eventConfig, userCanvasBonusCards.has(it.cardId), userGateBonuses, singleCardConfig))).then(it => it.filter(it => it !== undefined));
        if (eventConfig?.specialCharacterId !== undefined && eventConfig.specialCharacterId > 0) {
            return ret.sort((a, b) => safeNumber(b.supportDeckBonus) - safeNumber(a.supportDeckBonus));
        }
        return ret;
    }
    static isCertainlyLessThan(cardDetail0, cardDetail1) {
        return cardDetail0.power.isCertainlyLessThen(cardDetail1.power) &&
            cardDetail0.skill.isCertainlyLessThen(cardDetail1.skill) &&
            (cardDetail0.eventBonus === undefined || cardDetail1.eventBonus === undefined ||
                cardDetail0.eventBonus.isCertainlyLessThen(cardDetail1.eventBonus));
    }
}

class LiveCalculator {
    dataProvider;
    deckCalculator;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.deckCalculator = new DeckCalculator(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async getMusicMeta(musicId, musicDiff) {
        const musicMetas = await this.dataProvider.getMusicMeta();
        return findOrThrow(musicMetas, it => it.music_id === musicId && it.difficulty === musicDiff);
    }
    static getBaseScore(musicMeta, liveType) {
        switch (liveType) {
            case LiveType.SOLO:
            case LiveType.CHALLENGE:
                return musicMeta.base_score;
            case LiveType.MULTI:
            case LiveType.CHEERFUL:
                return musicMeta.base_score + musicMeta.fever_score * 0.5;
            case LiveType.AUTO:
                return musicMeta.base_score_auto;
        }
    }
    static getSkillScore(musicMeta, liveType) {
        switch (liveType) {
            case LiveType.SOLO:
            case LiveType.CHALLENGE:
                return musicMeta.skill_score_solo;
            case LiveType.MULTI:
            case LiveType.CHEERFUL:
                return musicMeta.skill_score_multi;
            case LiveType.AUTO:
                return musicMeta.skill_score_auto;
        }
    }
    static getSortedSkillDetails(deckDetail, liveType, skillDetails = undefined) {
        if (skillDetails !== undefined && skillDetails.length === 6 && skillDetails[5].scoreUp > 0) {
            return {
                details: skillDetails,
                sorted: false
            };
        }
        if (liveType === LiveType.MULTI) {
            return {
                details: duplicateObj(LiveCalculator.getMultiLiveSkill(deckDetail), 6),
                sorted: false
            };
        }
        const sortedSkill = [...deckDetail.cards].map(it => it.skill)
            .sort((a, b) => a.scoreUp - b.scoreUp);
        const emptySkill = duplicateObj({
            scoreUp: 0,
            lifeRecovery: 0
        }, 5 - sortedSkill.length);
        return {
            details: [...sortedSkill, ...emptySkill, deckDetail.cards[0].skill],
            sorted: true
        };
    }
    static getSortedSkillRate(sorted, cardLength, skillScores) {
        if (!sorted) {
            return skillScores;
        }
        return [
            ...skillScores.slice(0, cardLength).sort((a, b) => a - b),
            ...skillScores.slice(cardLength)
        ];
    }
    static getLiveDetailByDeck(deckDetail, musicMeta, liveType, skillDetails = undefined, multiPowerSum = 0) {
        const skills = this.getSortedSkillDetails(deckDetail, liveType, skillDetails);
        const baseRate = LiveCalculator.getBaseScore(musicMeta, liveType);
        const skillScores = [...LiveCalculator.getSkillScore(musicMeta, liveType)];
        const skillRate = LiveCalculator.getSortedSkillRate(skills.sorted, deckDetail.cards.length, skillScores);
        const rate = baseRate + skills.details
            .reduce((v, it, i) => v + it.scoreUp * skillRate[i] / 100, 0);
        const life = skills.details.reduce((v, it) => v + it.lifeRecovery, 0);
        const powerSum = multiPowerSum === 0 ? 5 * deckDetail.power.total : multiPowerSum;
        const activeBonus = liveType === LiveType.MULTI ? 5 * LiveCalculator.getMultiActiveBonus(powerSum) : 0;
        return {
            score: Math.floor(rate * deckDetail.power.total * 4 + activeBonus),
            time: musicMeta.music_time,
            life: Math.min(2000, life + 1000),
            tap: musicMeta.tap_count
        };
    }
    static getMultiActiveBonus(powerSum) {
        return 0.015 * powerSum;
    }
    static getMultiLiveSkill(deckDetail) {
        const scoreUp = deckDetail.cards.reduce((v, it, i) => v + (i === 0 ? it.skill.scoreUp : (it.skill.scoreUp / 5)), 0);
        const lifeRecovery = deckDetail.cards[0].skill.lifeRecovery;
        return {
            scoreUp,
            lifeRecovery
        };
    }
    static getSoloLiveSkill(liveSkills, skillDetails) {
        if (liveSkills === undefined)
            return undefined;
        const skills = liveSkills.map(liveSkill => findOrThrow(skillDetails, it => it.cardId === liveSkill.cardId).skill);
        const ret = [];
        for (let i = 0; i < 6; ++i) {
            ret.push({
                scoreUp: 0,
                lifeRecovery: 0
            });
        }
        for (let i = 0; i < skills.length - 1; ++i) {
            ret[i] = skills[i];
        }
        ret[5] = skills[skills.length - 1];
        return ret;
    }
    async getLiveDetail(deckCards, musicMeta, liveType, liveSkills = undefined, eventId) {
        const eventConfig = eventId === undefined
            ? undefined
            : await this.eventService.getEventConfig(eventId);
        const deckDetail = await this.deckCalculator.getDeckDetail(deckCards, deckCards, eventConfig);
        const skills = liveType === LiveType.MULTI
            ? undefined
            : LiveCalculator.getSoloLiveSkill(liveSkills, deckDetail.cards);
        const ret = LiveCalculator.getLiveDetailByDeck(deckDetail, musicMeta, liveType, skills);
        ret.deck = deckDetail;
        return ret;
    }
    static getLiveScoreByDeck(deckDetail, musicMeta, liveType) {
        return LiveCalculator.getLiveDetailByDeck(deckDetail, musicMeta, liveType).score;
    }
    static getLiveScoreFunction(liveType) {
        return (musicMeta, deckDetail) => LiveCalculator.getLiveScoreByDeck(deckDetail, musicMeta, liveType);
    }
}
var LiveType;
(function (LiveType) {
    LiveType["SOLO"] = "solo";
    LiveType["AUTO"] = "auto";
    LiveType["CHALLENGE"] = "challenge";
    LiveType["MULTI"] = "multi";
    LiveType["CHEERFUL"] = "cheerful";
})(LiveType || (LiveType = {}));

class EventCalculator {
    dataProvider;
    cardEventCalculator;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardEventCalculator = new CardEventCalculator(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async getDeckEventBonus(deckCards, eventId) {
        const masterCards = await this.dataProvider.getMasterData('cards');
        const cardDetails = await Promise.all(deckCards
            .map(async (userCard) => {
            const card = findOrThrow(masterCards, it => it.id === userCard.cardId);
            const eventBonus = await this.cardEventCalculator.getCardEventBonus(userCard, eventId);
            return {
                attr: card.attr,
                eventBonus
            };
        }));
        const event = await this.eventService.getEventConfig(eventId);
        return EventCalculator.getDeckBonus(cardDetails, event.cardBonusCountLimit, event.worldBloomDifferentAttributeBonuses) ?? 0;
    }
    static getEventPoint(liveType, eventType, selfScore, musicRate = 100, deckBonus = 0, boostRate = 1, otherScore = 0, life = 1000) {
        const musicRate0 = musicRate / 100;
        const deckRate = deckBonus / 100 + 1;
        const otherScore0 = otherScore === 0 ? 4 * selfScore : otherScore;
        let baseScore = 0;
        let lifeRate = 0;
        switch (liveType) {
            case LiveType.SOLO:
            case LiveType.AUTO:
                baseScore = 100 + Math.floor(selfScore / 20000);
                return Math.floor(baseScore * musicRate0 * deckRate) * boostRate;
            case LiveType.CHALLENGE:
                baseScore = 100 + Math.floor(selfScore / 20000);
                return baseScore * 120;
            case LiveType.MULTI:
                if (eventType === EventType.CHEERFUL)
                    throw new Error('Multi live is not playable in cheerful event.');
                baseScore = (110 + Math.floor(selfScore / 17000) + Math.min(13, Math.floor(otherScore0 / 340000)));
                return Math.floor(baseScore * musicRate0 * deckRate) * boostRate;
            case LiveType.CHEERFUL:
                if (eventType !== EventType.CHEERFUL)
                    throw new Error('Cheerful live is only playable in cheerful event.');
                baseScore = (110 + Math.floor(selfScore / 17000) + Math.min(13, Math.floor(otherScore0 / 340000)));
                lifeRate = 1.15 + Math.min(Math.max(life / 5000, 0.1), 0.2);
                return Math.floor(Math.floor(baseScore * musicRate0 * deckRate) * lifeRate) * boostRate;
        }
    }
    static getDeckBonus(deckCards, cardBonusCountLimit = 5, worldBloomDifferentAttributeBonuses) {
        let bonus = 0;
        let cardBonusCount = 0;
        for (let i = 0; i < deckCards.length; i++) {
            const card = deckCards[i];
            if (card.eventBonus === undefined)
                return undefined;
            const bonusDetail = card.eventBonus.getBonus();
            bonus += bonusDetail.fixedBonus;
            if (bonusDetail.cardBonus > 0 && cardBonusCount < cardBonusCountLimit) {
                bonus += bonusDetail.cardBonus;
                cardBonusCount++;
            }
            if (i === 0) {
                bonus += bonusDetail.leaderBonus;
            }
        }
        if (worldBloomDifferentAttributeBonuses === undefined)
            return bonus;
        const set = new Set();
        deckCards.forEach(it => set.add(it.attr));
        return bonus + findOrThrow(worldBloomDifferentAttributeBonuses, it => it.attributeCount === set.size).bonusRate;
    }
    static getSupportDeckBonus(deckCards, allCards, supportDeckCount = 20) {
        const deckCardIds = new Set(deckCards.map(it => it.cardId));
        let bonus = 0;
        const cards = [];
        for (const card of allCards) {
            if (card.supportDeckBonus === undefined)
                continue;
            if (deckCardIds.has(card.cardId))
                continue;
            bonus += card.supportDeckBonus;
            cards.push(card);
            if (cards.length >= supportDeckCount)
                break;
        }
        return { bonus, cards };
    }
    static getWorldBloomSupportDeckCount(worldBloomEventTurn) {
        return worldBloomEventTurn === 1 ? 12 : worldBloomEventTurn === 2 ? 20 : 25;
    }
    static getDeckEventPoint(deckDetail, musicMeta, liveType, eventType) {
        const deckBonus = deckDetail.eventBonus;
        if (liveType !== LiveType.CHALLENGE && deckBonus === undefined)
            throw new Error('Deck bonus is undefined');
        const supportDeckBonus = deckDetail.supportDeckBonus;
        if (eventType === EventType.BLOOM && supportDeckBonus === undefined)
            throw new Error('Support deck bonus is undefined');
        const score = LiveCalculator.getLiveScoreByDeck(deckDetail, musicMeta, liveType);
        return EventCalculator.getEventPoint(liveType, eventType, score, musicMeta.event_rate, safeNumber(deckBonus) + safeNumber((supportDeckBonus)));
    }
    static getEventPointFunction(liveType, eventType) {
        return (musicMeta, deckDetail) => EventCalculator.getDeckEventPoint(deckDetail, musicMeta, liveType, eventType);
    }
}

var SkillReferenceChooseStrategy;
(function (SkillReferenceChooseStrategy) {
    SkillReferenceChooseStrategy["Max"] = "max";
    SkillReferenceChooseStrategy["Min"] = "min";
    SkillReferenceChooseStrategy["Average"] = "average";
})(SkillReferenceChooseStrategy || (SkillReferenceChooseStrategy = {}));
class DeckCalculator {
    dataProvider;
    cardCalculator;
    eventCalculator;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardCalculator = new CardCalculator(dataProvider);
        this.eventCalculator = new EventCalculator(dataProvider);
    }
    async getHonorBonusPower() {
        const honors = await this.dataProvider.getMasterData('honors');
        const userHonors = await this.dataProvider.getUserData('userHonors');
        return userHonors
            .map(userHonor => {
            const honor = findOrThrow(honors, it => it.id === userHonor.honorId);
            return findOrThrow(honor.levels, it => it.level === userHonor.level);
        })
            .reduce((v, it) => v + it.bonus, 0);
    }
    static getDeckDetailByCards(cardDetails, allCards, honorBonus, cardBonusCountLimit, worldBloomDifferentAttributeBonuses, skillReferenceChooseStrategy = SkillReferenceChooseStrategy.Average, keepAfterTrainingState = false, bestSkillAsLeader = true, worldBloomEventTurn) {
        const cardNum = cardDetails.length;
        const unitMap = new Map();
        const attrMap = new Map();
        for (const cardDetail of cardDetails) {
            computeWithDefault(attrMap, cardDetail.attr, 0, it => it + 1);
            cardDetail.units.forEach(key => {
                computeWithDefault(unitMap, key, 0, it => it + 1);
            });
        }
        let unitNum = 0;
        for (const [, count] of unitMap) {
            if (count > 0)
                unitNum++;
        }
        const cardPower = new Map();
        cardDetails.forEach(cardDetail => {
            cardPower.set(cardDetail.cardId, cardDetail.units.reduce((vv, unit) => {
                const current = cardDetail.power.getPower(unit, getOrThrow(unitMap, unit), getOrThrow(attrMap, cardDetail.attr));
                return current.total > vv.total ? current : vv;
            }, cardDetail.power.getPower(cardDetail.units[0], getOrThrow(unitMap, cardDetail.units[0]), getOrThrow(attrMap, cardDetail.attr))));
        });
        const base = DeckCalculator.sumPower(cardDetails, cardPower, it => it.base);
        const areaItemBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.areaItemBonus);
        const characterBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.characterBonus);
        const fixtureBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.fixtureBonus);
        const gateBonus = DeckCalculator.sumPower(cardDetails, cardPower, it => it.gateBonus);
        const total = DeckCalculator.sumPower(cardDetails, cardPower, it => it.total) + honorBonus;
        const cappedTotal = worldBloomEventTurn === 3 ? Math.min(total, 336000) : total;
        const power = { base, areaItemBonus, characterBonus, honorBonus, fixtureBonus, gateBonus, total: cappedTotal };
        const prepareSkills = [];
        let doubleSkillMask = 0;
        let needEnumerateStatusMask = 0;
        for (let i = 0; i < cardNum; ++i) {
            const cardDetail = cardDetails[i];
            const hasDouble = cardDetail.skill.hasPreTraining;
            let s2 = { skillId: 0, isAfterTraining: false, scoreUpFixed: 0, scoreUpToReference: 0, lifeRecovery: 0 };
            for (const unit of cardDetail.units) {
                const current = cardDetail.skill.getSkill(unit, getOrThrow(unitMap, unit));
                if (current.scoreUpFixed > s2.scoreUpFixed)
                    s2 = { ...current };
            }
            let s1 = { skillId: 0, isAfterTraining: false, scoreUpFixed: 0, scoreUpToReference: 0, lifeRecovery: 0 };
            let needEnumerate = false;
            if (hasDouble) {
                try {
                    const refSkill = cardDetail.skill.getPreTrainingSkill('ref', 1);
                    const refScoreUp = refSkill.scoreUpFixed + (refSkill.scoreUpReferenceMax ?? 0);
                    if (refSkill.skillId !== s2.skillId && refScoreUp > s1.scoreUpFixed) {
                        s1 = { ...refSkill, scoreUpFixed: refScoreUp, scoreUpToReference: refScoreUp };
                        needEnumerate = true;
                    }
                }
                catch (_) { }
                try {
                    const diffSkill = cardDetail.skill.getPreTrainingSkill('diff', unitNum - 1);
                    if (diffSkill.skillId !== s2.skillId && diffSkill.scoreUpFixed > s1.scoreUpFixed) {
                        s1 = { ...diffSkill };
                        needEnumerate = false;
                    }
                }
                catch (_) { }
                doubleSkillMask |= (1 << i);
            }
            if (keepAfterTrainingState) {
                if (hasDouble && cardDetail.defaultImage !== 'special_training') {
                    s2 = { ...s1 };
                }
            }
            else {
                if (hasDouble) {
                    if (needEnumerate) {
                        needEnumerateStatusMask |= (1 << i);
                    }
                    else {
                        s2 = s2.scoreUpFixed >= s1.scoreUpFixed ? s2 : s1;
                    }
                }
            }
            prepareSkills.push([s1, s2]);
        }
        let bestDeckResult;
        for (let mask = needEnumerateStatusMask; mask >= 0; mask = mask > 0 ? (mask - 1) & needEnumerateStatusMask : -1) {
            const skills = [];
            for (let i = 0; i < cardNum; ++i) {
                const [s1, s2] = prepareSkills[i];
                const s = (mask & (1 << i)) !== 0 ? { ...s1 } : { ...s2 };
                s.scoreUpToReference = s.scoreUpFixed;
                skills.push(s);
            }
            for (let i = 0; i < cardNum; ++i) {
                const s = skills[i];
                if (s.hasScoreUpReference === true && s.scoreUpReferenceRate !== undefined && s.scoreUpReferenceMax !== undefined) {
                    const baseFixed = s.scoreUpFixed - s.scoreUpReferenceMax;
                    s.scoreUpFixed = baseFixed;
                    const memberSkillMaxs = [];
                    for (let j = 0; j < cardNum; ++j) {
                        if (i === j)
                            continue;
                        const m = Math.min(Math.floor(skills[j].scoreUpToReference * s.scoreUpReferenceRate / 100), s.scoreUpReferenceMax);
                        memberSkillMaxs.push(m);
                    }
                    let chosenSkillMax = 0;
                    if (skillReferenceChooseStrategy === SkillReferenceChooseStrategy.Max) {
                        chosenSkillMax = Math.max(...memberSkillMaxs);
                    }
                    else if (skillReferenceChooseStrategy === SkillReferenceChooseStrategy.Min) {
                        chosenSkillMax = Math.min(...memberSkillMaxs);
                    }
                    else {
                        chosenSkillMax = memberSkillMaxs.reduce((a, b) => a + b, 0) / memberSkillMaxs.length;
                    }
                    s.scoreUpFixed += chosenSkillMax;
                }
            }
            const order = Array.from({ length: cardNum }, (_, i) => i);
            if (bestSkillAsLeader) {
                let bestIndex = 0;
                for (let i = 1; i < cardNum; ++i) {
                    if (skills[order[i]].scoreUpFixed > skills[order[bestIndex]].scoreUpFixed) {
                        bestIndex = i;
                    }
                    else if (skills[order[i]].scoreUpFixed === skills[order[bestIndex]].scoreUpFixed &&
                        cardDetails[order[i]].cardId < cardDetails[order[bestIndex]].cardId) {
                        bestIndex = i;
                    }
                }
                if (bestIndex !== 0) {
                    const tmp = order[0];
                    order[0] = order[bestIndex];
                    order[bestIndex] = tmp;
                }
            }
            let leaderScoreUp = 0;
            let otherScoreUpSum = 0;
            for (let k = 0; k < cardNum; ++k) {
                if (k === 0)
                    leaderScoreUp = skills[order[k]].scoreUpFixed;
                else
                    otherScoreUpSum += skills[order[k]].scoreUpFixed;
            }
            const currentScore = leaderScoreUp + otherScoreUpSum;
            if (bestDeckResult !== undefined && currentScore <= bestDeckResult.targetScore) {
                continue;
            }
            const cards = [];
            for (const idx of order) {
                const cardDetail = cardDetails[idx];
                let defaultImage = cardDetail.defaultImage;
                if ((doubleSkillMask & (1 << idx)) !== 0) {
                    defaultImage = skills[idx].isAfterTraining ? 'special_training' : 'original';
                }
                cards.push({
                    cardId: cardDetail.cardId,
                    level: cardDetail.level,
                    skillLevel: cardDetail.skillLevel,
                    masterRank: cardDetail.masterRank,
                    power: getOrThrow(cardPower, cardDetail.cardId),
                    eventBonus: cardDetail.eventBonus?.getBonusForDisplay(idx === order[0]),
                    skill: {
                        scoreUp: skills[idx].scoreUpFixed,
                        lifeRecovery: skills[idx].lifeRecovery,
                        isPreTrainingSkill: !skills[idx].isAfterTraining && (doubleSkillMask & (1 << idx)) !== 0 ? true : undefined
                    },
                    defaultImage
                });
            }
            let multiLiveScoreUp = skills[order[0]].scoreUpFixed;
            for (let i = 1; i < cardNum; ++i) {
                multiLiveScoreUp += skills[order[i]].scoreUpFixed * 0.2;
            }
            bestDeckResult = { cards, multiLiveScoreUp, targetScore: currentScore };
        }
        if (bestDeckResult === undefined) {
            bestDeckResult = DeckCalculator.computeDefaultDeck(cardDetails, cardPower, unitMap, bestSkillAsLeader);
        }
        const eventBonus = EventCalculator.getDeckBonus(cardDetails, cardBonusCountLimit, worldBloomDifferentAttributeBonuses);
        const supportDeckBonus = worldBloomDifferentAttributeBonuses !== undefined
            ? EventCalculator.getSupportDeckBonus(cardDetails, allCards, EventCalculator.getWorldBloomSupportDeckCount(worldBloomEventTurn)).bonus
            : 0;
        return {
            power,
            eventBonus,
            supportDeckBonus,
            cards: bestDeckResult.cards,
            multiLiveScoreUp: bestDeckResult.multiLiveScoreUp
        };
    }
    static computeDefaultDeck(cardDetails, cardPower, unitMap, bestSkillAsLeader) {
        const cardNum = cardDetails.length;
        const cardsPrepare = cardDetails.map(cardDetail => {
            const skillPrepare = cardDetail.units.reduce((vv, unit) => {
                const current = cardDetail.skill.getSkill(unit, getOrThrow(unitMap, unit));
                return current.scoreUpFixed > vv.scoreUpFixed ? current : vv;
            }, cardDetail.skill.getSkill('any', 1));
            return { cardDetail, skillPrepare };
        });
        const order = Array.from({ length: cardNum }, (_, i) => i);
        if (bestSkillAsLeader) {
            let bestIndex = 0;
            for (let i = 1; i < cardNum; ++i) {
                if (cardsPrepare[i].skillPrepare.scoreUpFixed > cardsPrepare[bestIndex].skillPrepare.scoreUpFixed) {
                    bestIndex = i;
                }
            }
            if (bestIndex !== 0) {
                const tmp = order[0];
                order[0] = order[bestIndex];
                order[bestIndex] = tmp;
            }
        }
        const cards = order.map(idx => {
            const { cardDetail, skillPrepare } = cardsPrepare[idx];
            return {
                cardId: cardDetail.cardId,
                level: cardDetail.level,
                skillLevel: cardDetail.skillLevel,
                masterRank: cardDetail.masterRank,
                power: getOrThrow(cardPower, cardDetail.cardId),
                eventBonus: cardDetail.eventBonus?.getBonusForDisplay(idx === order[0]),
                skill: {
                    scoreUp: skillPrepare.scoreUpFixed,
                    lifeRecovery: skillPrepare.lifeRecovery
                },
                defaultImage: cardDetail.defaultImage
            };
        });
        let multiLiveScoreUp = cardsPrepare[order[0]].skillPrepare.scoreUpFixed;
        for (let i = 1; i < cardNum; ++i) {
            multiLiveScoreUp += cardsPrepare[order[i]].skillPrepare.scoreUpFixed * 0.2;
        }
        const targetScore = cardsPrepare.reduce((sum, it) => sum + it.skillPrepare.scoreUpFixed, 0);
        return { cards, multiLiveScoreUp, targetScore };
    }
    static sumPower(cardDetails, cardPower, attr) {
        return cardDetails.reduce((v, cardDetail) => v + attr(getOrThrow(cardPower, cardDetail.cardId)), 0);
    }
    async getDeckDetail(deckCards, allCards, eventConfig, areaItemLevels) {
        const allCards0 = await this.cardCalculator.batchGetCardDetail(allCards, {}, eventConfig, areaItemLevels);
        return DeckCalculator.getDeckDetailByCards(await this.cardCalculator.batchGetCardDetail(deckCards, {}, eventConfig, areaItemLevels), allCards0, await this.getHonorBonusPower(), eventConfig?.cardBonusCountLimit, eventConfig?.worldBloomDifferentAttributeBonuses, SkillReferenceChooseStrategy.Average, false, true, eventConfig?.worldBloomEventTurn);
    }
}

class LiveExactCalculator {
    dataProvider;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }
    async calculate(power, skills, liveType, musicScore, multiSumPower = power * 5, feverMusicScore = musicScore) {
        const effects = LiveExactCalculator.getSkillDetails(skills, musicScore.skills);
        if (liveType === LiveType.MULTI || liveType === LiveType.CHEERFUL) {
            const feverDetail = LiveExactCalculator.getFeverDetail(feverMusicScore);
            effects.push(feverDetail);
        }
        const ingameNodes = await this.dataProvider.getMasterData('ingameNodes');
        const noteCoefficients = musicScore.notes
            .map(note => findOrThrow(ingameNodes, it => it.id === note.type).scoreCoefficient);
        const coefficientTotal = noteCoefficients.reduce((total, it) => total + it, 0);
        const ingameCombos = await this.dataProvider.getMasterData('ingameCombos');
        const notes = musicScore.notes.map((note, i) => {
            const noteCoefficient = noteCoefficients[i];
            const combo = i + 1;
            const comboCoefficient = findOrThrow(ingameCombos, it => it.fromCount <= combo && combo <= it.toCount).scoreCoefficient;
            const judgeCoefficient = 1;
            const effectBonuses = effects
                .filter(it => it.startTime <= note.time && note.time <= it.endTime)
                .map(it => it.effect);
            const effectCoefficient = effectBonuses
                .reduce((total, it) => total * (it / 100), 1);
            const score = noteCoefficient * comboCoefficient * judgeCoefficient * effectCoefficient * power * 4 / coefficientTotal;
            return {
                noteCoefficient,
                comboCoefficient,
                judgeCoefficient,
                effectBonuses,
                score
            };
        });
        const noteTotal = notes.reduce((a, b) => a + b.score, 0);
        const activeBonus = liveType === LiveType.MULTI
            ? 5 * LiveCalculator.getMultiActiveBonus(multiSumPower)
            : 0;
        return {
            total: noteTotal + activeBonus,
            activeBonus,
            notes
        };
    }
    static getSkillDetails(skills, musicSkills) {
        return musicSkills.map((it, i) => {
            return {
                startTime: it.time,
                endTime: it.time + 5,
                effect: skills[i]
            };
        });
    }
    static getFeverDetail(musicScore) {
        if (musicScore.fevers === undefined || musicScore.fevers.length === 0) {
            return {
                startTime: 0,
                endTime: 0,
                effect: 0
            };
        }
        const startTime = musicScore.fevers
            .reduce((v, it) => Math.max(v, it.time), 0);
        const notesAfterFever = musicScore.notes
            .filter(note => note.time >= startTime);
        const feverNoteCount = Math.min(notesAfterFever.length, Math.floor(musicScore.notes.length / 10));
        const endTime = notesAfterFever[feverNoteCount - 1].time;
        return {
            startTime,
            endTime,
            effect: 50
        };
    }
}

class AreaItemRecommend {
    dataProvider;
    areaItemService;
    deckCalculator;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.areaItemService = new AreaItemService(dataProvider);
        this.deckCalculator = new DeckCalculator(dataProvider);
    }
    static findCost(shopItem, resourceType, resourceId) {
        const cost = shopItem.costs.map(it => it.cost)
            .find(it => it.resourceType === resourceType && it.resourceId === resourceId);
        return cost === undefined ? 0 : cost.quantity;
    }
    async getRecommendAreaItem(areaItem, areaItemLevel, power) {
        const areas = await this.dataProvider.getMasterData('areas');
        const area = findOrThrow(areas, it => it.id === areaItem.areaId);
        const shopItem = await this.areaItemService.getShopItem(areaItemLevel);
        return {
            area,
            areaItem,
            areaItemLevel,
            shopItem,
            cost: {
                coin: AreaItemRecommend.findCost(shopItem, 'coin', 0),
                seed: AreaItemRecommend.findCost(shopItem, 'material', 17),
                szk: AreaItemRecommend.findCost(shopItem, 'material', 57)
            },
            power
        };
    }
    async recommendAreaItem(userCards) {
        const areaItems = await this.dataProvider.getMasterData('areaItems');
        const currentAreaItemLevels = await this.areaItemService.getAreaItemLevels();
        const { power: currentPower } = await this.deckCalculator.getDeckDetail(userCards, userCards, {}, currentAreaItemLevels);
        const recommend = await Promise.all(areaItems.map(async (areaItem) => {
            const newAreaItemLevel = await this.areaItemService.getAreaItemNextLevel(areaItem, currentAreaItemLevels.find(it => it.areaItemId === areaItem.id));
            const newAreaItemLevels = [
                ...currentAreaItemLevels.filter(it => it.areaItemId !== areaItem.id), newAreaItemLevel
            ];
            const { power: newPower } = await this.deckCalculator.getDeckDetail(userCards, userCards, {}, newAreaItemLevels);
            return await this.getRecommendAreaItem(areaItem, newAreaItemLevel, newPower.total - currentPower.total);
        }));
        return recommend.filter(it => it.power > 0)
            .sort((a, b) => b.power / b.cost.coin - a.power / a.cost.coin);
    }
}

const challengeLiveCardPriorities = [
    {
        eventBonus: 0,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 0
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 10
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 20
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 30
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 40
    }
];

const bloomCardPriorities = [
    {
        eventBonus: 25 + 10 + 20,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 0
    },
    {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 5
    },
    {
        eventBonus: 25 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 10
    }, {
        eventBonus: 25 + 15,
        cardRarityType: 'rarity_birthday',
        masterRank: 5,
        priority: 10
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 20
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_3',
        masterRank: 5,
        priority: 20
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 21
    }, {
        eventBonus: 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 22
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 30
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 40
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 50
    }, {
        eventBonus: 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 90
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 100
    }
];

const marathonCheerfulCardPriorities = [
    {
        eventBonus: 25 + 25 + 20 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 0
    }, {
        eventBonus: 25 + 25 + 20 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 10
    }, {
        eventBonus: 25 + 25 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 10
    }, {
        eventBonus: 25 + 15 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 30
    }, {
        eventBonus: 25 + 25 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 40
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 40
    }, {
        eventBonus: 25 + 25 + 15,
        cardRarityType: 'rarity_birthday',
        masterRank: 5,
        priority: 40
    }, {
        eventBonus: 25 + 15 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 50
    }, {
        eventBonus: 25 + 25 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 50
    }, {
        eventBonus: 25 + 25 + 5,
        cardRarityType: 'rarity_3',
        masterRank: 5,
        priority: 50
    }, {
        eventBonus: 25 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 60
    }, {
        eventBonus: 25 + 15,
        cardRarityType: 'rarity_birthday',
        masterRank: 5,
        priority: 60
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 60
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_4',
        masterRank: 5,
        priority: 60
    }, {
        eventBonus: 15 + 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 25 + 5,
        cardRarityType: 'rarity_3',
        masterRank: 5,
        priority: 70
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 25 + 25,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 70
    }, {
        eventBonus: 15 + 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 25,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 10,
        cardRarityType: 'rarity_4',
        masterRank: 0,
        priority: 80
    }, {
        eventBonus: 5,
        cardRarityType: 'rarity_birthday',
        masterRank: 0,
        priority: 90
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_3',
        masterRank: 0,
        priority: 100
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_2',
        masterRank: 0,
        priority: 100
    }, {
        eventBonus: 0,
        cardRarityType: 'rarity_1',
        masterRank: 0,
        priority: 100
    }
];

function checkAttrForBloomDfs(attrMap, attrs, chars, visit, round, attr) {
    visit.set(attr, round);
    const charForAttr = attrMap.get(attr);
    if (charForAttr === undefined)
        throw new Error(`${attr} not found in map ${mapToString(attrMap)}`);
    for (const char of charForAttr) {
        if (!chars.has(char)) {
            chars.set(char, attr);
            attrs.set(attr, char);
            return true;
        }
    }
    for (const char of charForAttr) {
        const attrForChar = chars.get(char);
        if (attrForChar === undefined)
            throw new Error(`${char} not found in map ${mapToString(chars)}`);
        const attrForCharRound = visit.get(attrForChar);
        if (attrForCharRound === undefined)
            throw new Error(`${attrForChar} not found in map ${mapToString(visit)}`);
        if (attrForCharRound !== round && checkAttrForBloomDfs(attrMap, attrs, chars, visit, round, attrForChar)) {
            chars.set(char, attr);
            attrs.set(attr, char);
            return true;
        }
    }
    return false;
}
function checkAttrForBloom(attrMap) {
    if (attrMap.size < 5)
        return false;
    let min = 114514;
    for (const v of attrMap.values()) {
        min = Math.min(min, v.size);
    }
    if (min >= 5)
        return true;
    const attrs = new Map();
    const chars = new Map();
    const visit = new Map();
    let ans = 0;
    let round = 0;
    while (true) {
        round++;
        let count = 0;
        for (const attr of attrMap.keys()) {
            if (!visit.has(attr) && checkAttrForBloomDfs(attrMap, attrs, chars, visit, round, attr)) {
                count++;
            }
        }
        if (count === 0)
            break;
        ans += count;
    }
    return ans === 5;
}
function canMakeDeck(liveType, eventType, cardDetails, member = 5) {
    const attrMap = new Map();
    const unitMap = new Map();
    for (const cardDetail of cardDetails) {
        computeWithDefault(attrMap, cardDetail.attr, new Set(), it => it.add(liveType === LiveType.CHALLENGE ? cardDetail.cardId : cardDetail.characterId));
        for (const unit of cardDetail.units) {
            computeWithDefault(unitMap, unit, new Set(), it => it.add(cardDetail.characterId));
        }
    }
    if (liveType === LiveType.CHALLENGE) {
        if (member < 5) {
            return cardDetails.length >= member;
        }
        for (const v of attrMap.values()) {
            if (v.size < 5)
                return false;
        }
        return true;
    }
    switch (eventType) {
        case EventType.MARATHON:
        case EventType.CHEERFUL:
            for (const v of attrMap.values()) {
                if (v.size >= 5)
                    return true;
            }
            for (const v of unitMap.values()) {
                if (v.size >= 5)
                    return true;
            }
            return false;
        case EventType.BLOOM:
            return checkAttrForBloom(attrMap);
        default:
            return false;
    }
}
function filterCardPriority(liveType, eventType, cardDetails, preCardDetails, member = 5, leader = 0, fixedCharacters = []) {
    const fixedCharacterSet = new Set(fixedCharacters);
    if (leader > 0)
        fixedCharacterSet.add(leader);
    const cardPriorities = getCardPriorities(liveType, eventType);
    let cards = [];
    let latestPriority = Number.MIN_SAFE_INTEGER;
    const cardIds = new Set();
    for (const cardPriority of cardPriorities) {
        if (cardPriority.priority > latestPriority && cards.length > preCardDetails.length && canMakeDeck(liveType, eventType, cards, member)) {
            return cards;
        }
        latestPriority = cardPriority.priority;
        const filtered = cardDetails
            .filter(it => !cardIds.has(it.cardId) &&
            it.cardRarityType === cardPriority.cardRarityType &&
            it.masterRank >= cardPriority.masterRank &&
            (it.eventBonus === undefined ||
                it.eventBonus.getMaxBonus(fixedCharacterSet.size === 0 || fixedCharacterSet.has(it.characterId)) >= cardPriority.eventBonus));
        filtered.forEach(it => cardIds.add(it.cardId));
        cards = [...cards, ...filtered];
    }
    return cardDetails;
}
function getCardPriorities(liveType, eventType) {
    if (liveType === LiveType.CHALLENGE)
        return challengeLiveCardPriorities;
    if (eventType === EventType.BLOOM)
        return bloomCardPriorities;
    if (eventType === EventType.MARATHON || eventType === EventType.CHEERFUL)
        return marathonCheerfulCardPriorities;
    return [];
}

function compareDeck(deck1, deck2) {
    if (deck1.score !== deck2.score)
        return deck2.score - deck1.score;
    if (deck1.power !== deck2.power)
        return deck2.power.total - deck1.power.total;
    return deck1.cards[0].cardId - deck2.cards[0].cardId;
}
function removeSameDeck(it, i, arr) {
    if (i === 0)
        return true;
    const pre = arr[i - 1];
    if (pre.score !== it.score || pre.power.total !== it.power.total)
        return true;
    return pre.cards[0].cardId !== it.cards[0].cardId;
}
function updateDeck(pre, result, limit) {
    let ans = [...pre, ...result].sort(compareDeck);
    ans = ans.filter(removeSameDeck);
    if (ans.length > limit)
        ans = ans.slice(0, limit);
    return ans;
}
function toRecommendDeck(deckDetail, score) {
    const ret = deckDetail;
    ret.score = score;
    return [ret];
}
function isDeckAttrLessThan3(deckCards, cardDetail) {
    if (deckCards.length <= 2) {
        return false;
    }
    const set = new Set();
    set.add(cardDetail.attr);
    for (const card of deckCards) {
        set.add(card.attr);
    }
    if (deckCards.length === 3) {
        return set.size < 2;
    }
    return set.size < 3;
}

const DEFAULT_GA_CONFIG = {
    seed: -1,
    maxIter: 1000,
    maxIterNoImprove: 10,
    popSize: 8000,
    parentSize: 800,
    eliteSize: 10,
    crossoverRate: 1.0,
    baseMutationRate: 0.1,
    noImproveIterToMutationRate: 0.02,
    timeoutMs: 15000,
    target: 'score'
};
class SimpleRng {
    state;
    constructor(seed) {
        this.state = seed & 0x7fffffff;
        if (this.state === 0)
            this.state = 1;
    }
    next() {
        this.state ^= this.state << 13;
        this.state ^= this.state >>> 17;
        this.state ^= this.state << 5;
        return (this.state >>> 0) / 4294967296;
    }
    nextInt(max) {
        return Math.floor(this.next() * max);
    }
}
function calcDeckHash(deck) {
    if (deck.length === 0)
        return 0;
    const ids = deck.map(c => c.cardId);
    const sorted = ids.slice(1).sort((a, b) => a - b);
    const BASE = 10007;
    let hash = ids[0];
    for (const id of sorted) {
        hash = ((hash * BASE) + id) | 0;
    }
    return hash >>> 0;
}
function calcWeightedPrefixSum(cards, target, excludedCardIds) {
    const weights = new Array(cards.length);
    let sum = 0;
    for (let i = 0; i < cards.length; i++) {
        if (excludedCardIds.has(cards[i].cardId)) {
            weights[i] = 0;
            continue;
        }
        let val;
        if (target === 'skill') {
            val = cards[i].skill.getMax();
        }
        else {
            val = cards[i].power.getMax();
        }
        weights[i] = val * val;
        sum += weights[i];
    }
    if (sum > 0) {
        weights[0] /= sum;
        for (let i = 1; i < weights.length; i++) {
            weights[i] = weights[i] / sum + weights[i - 1];
        }
    }
    return weights;
}
function weightedRandomSelect(rng, prefixSum) {
    if (prefixSum.length === 0)
        return 0;
    const r = rng.next();
    let lo = 0;
    let hi = prefixSum.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (prefixSum[mid] < r)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo;
}
function findBestCardsGA(cardDetails, allCards, scoreFunc, musicMeta, limit = 1, isChallengeLive = false, member = 5, honorBonus = 0, eventConfig = {}, gaConfig = {}, skillReferenceChooseStrategy = SkillReferenceChooseStrategy.Average, keepAfterTrainingState = false, bestSkillAsLeader = true, leaderCharacter = 0, fixedCharacters = [], fixedCards = []) {
    const cfg = { ...DEFAULT_GA_CONFIG, ...gaConfig };
    const fixedSize = fixedCards.length;
    if (isChallengeLive) {
        member = Math.min(member, cardDetails.length);
    }
    if (cardDetails.length < member) {
        return [];
    }
    (fixedCharacters.length > 0 || fixedSize > 0) ? false : bestSkillAsLeader;
    const seed = cfg.seed === -1 ? Date.now() : cfg.seed;
    const rng = new SimpleRng(seed);
    const startTime = Date.now();
    const isTimeout = () => Date.now() - startTime > cfg.timeoutMs;
    const MAX_CID = 27;
    const charaCards = Array.from({ length: MAX_CID }, () => []);
    for (const card of cardDetails) {
        charaCards[card.characterId].push(card);
    }
    const fixedCardIds = new Set(fixedCards.map(c => c.cardId));
    const fixedCardCharacterIds = new Set(fixedCards.map(c => c.characterId));
    const fixedCharacterSet = new Set(fixedCharacters);
    const target = cfg.target;
    const allCardWeights = calcWeightedPrefixSum(cardDetails, target, fixedCardIds);
    const charaCardWeights = Array.from({ length: MAX_CID }, () => []);
    for (let i = 0; i < MAX_CID; i++) {
        if (charaCards[i].length > 0) {
            charaCardWeights[i] = calcWeightedPrefixSum(charaCards[i], target, fixedCardIds);
        }
    }
    const deckScoreCache = new Map();
    let bestDecks = [];
    const updateResult = (deck) => {
        const deckCardIds = new Set(deck.cards.map(c => c.cardId));
        if (deckCardIds.size !== deck.cards.length)
            return;
        const exists = bestDecks.some(d => {
            if (d.cards.length !== deck.cards.length)
                return false;
            return d.cards.every(c => deckCardIds.has(c.cardId));
        });
        if (exists)
            return;
        bestDecks.push(deck);
        bestDecks.sort((a, b) => b.score - a.score);
        if (bestDecks.length > limit) {
            bestDecks = bestDecks.slice(0, limit);
        }
    };
    const evaluateIndividual = (individual) => {
        const hash = calcDeckHash(individual.deck);
        individual.deckHash = hash;
        if (deckScoreCache.has(hash)) {
            individual.fitness = deckScoreCache.get(hash);
            return;
        }
        try {
            if (fixedCharacters.length > 0 || fixedSize > 0) {
                const deckDetail = DeckCalculator.getDeckDetailByCards(individual.deck, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, skillReferenceChooseStrategy, keepAfterTrainingState, false, eventConfig.worldBloomEventTurn);
                const score = scoreFunc(musicMeta, deckDetail);
                individual.fitness = score;
                deckScoreCache.set(hash, score);
                const recDeck = deckDetail;
                recDeck.score = score;
                updateResult(recDeck);
            }
            else {
                const dd1 = DeckCalculator.getDeckDetailByCards(individual.deck, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, skillReferenceChooseStrategy, keepAfterTrainingState, true, eventConfig.worldBloomEventTurn);
                const s1 = scoreFunc(musicMeta, dd1);
                let bestLeaderIdx = 0;
                let bestLeaderBonus = -1;
                for (let i = 0; i < individual.deck.length; i++) {
                    const card = individual.deck[i];
                    const lb = card.eventBonus !== undefined
                        ? card.eventBonus.getMaxBonus(true) - card.eventBonus.getMaxBonus(false)
                        : 0;
                    if (lb > bestLeaderBonus) {
                        bestLeaderBonus = lb;
                        bestLeaderIdx = i;
                    }
                }
                let s2 = -1;
                let dd2 = null;
                if (bestLeaderIdx !== 0 && bestLeaderBonus > 0) {
                    swap(individual.deck, 0, bestLeaderIdx);
                    dd2 = DeckCalculator.getDeckDetailByCards(individual.deck, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, skillReferenceChooseStrategy, keepAfterTrainingState, false, eventConfig.worldBloomEventTurn);
                    s2 = scoreFunc(musicMeta, dd2);
                    swap(individual.deck, 0, bestLeaderIdx);
                }
                const bestScore = s2 > s1 ? s2 : s1;
                const bestDetail = (s2 > s1 && dd2 !== null) ? dd2 : dd1;
                individual.fitness = bestScore;
                deckScoreCache.set(hash, bestScore);
                const recDeck = bestDetail;
                recDeck.score = bestScore;
                updateResult(recDeck);
            }
        }
        catch {
            individual.fitness = -1;
            deckScoreCache.set(hash, -1);
        }
    };
    const unitCharaMap = new Map();
    const attrCharaMap = new Map();
    for (let j = 0; j < MAX_CID; j++) {
        if (charaCards[j].length === 0)
            continue;
        if (fixedCardCharacterIds.has(j) || fixedCharacterSet.has(j))
            continue;
        const unitSet = new Set();
        const attrSet = new Set();
        for (const card of charaCards[j]) {
            card.units.forEach(u => unitSet.add(u));
            attrSet.add(card.attr);
        }
        for (const u of unitSet) {
            if (!unitCharaMap.has(u))
                unitCharaMap.set(u, []);
            unitCharaMap.get(u).push(j);
        }
        for (const a of attrSet) {
            if (!attrCharaMap.has(a))
                attrCharaMap.set(a, []);
            attrCharaMap.get(a).push(j);
        }
    }
    const viableUnitGroups = [...unitCharaMap.entries()].filter(([, v]) => v.length >= member - fixedSize - fixedCharacters.length);
    const viableAttrGroups = [...attrCharaMap.entries()].filter(([, v]) => v.length >= member - fixedSize - fixedCharacters.length);
    const hasViableGroups = viableUnitGroups.length > 0 || viableAttrGroups.length > 0;
    const allowBiasInitialization = eventConfig.eventType !== EventType.BLOOM;
    const generateRandomIndividual = (biased) => {
        const deck = [];
        const usedCharas = new Set();
        const usedCardIds = new Set();
        if (!isChallengeLive) {
            const validCharas = [];
            for (let j = 0; j < MAX_CID; j++) {
                if (charaCards[j].length === 0)
                    continue;
                if (fixedCardCharacterIds.has(j))
                    continue;
                if (fixedCharacterSet.has(j))
                    continue;
                validCharas.push(j);
            }
            const freeSlots = member - fixedSize - fixedCharacters.length;
            if (validCharas.length < freeSlots)
                return null;
            for (const chara of fixedCharacters) {
                const cards = charaCards[chara];
                if (cards.length === 0)
                    return null;
                const idx = weightedRandomSelect(rng, charaCardWeights[chara]);
                const card = cards[idx];
                deck.push(card);
                usedCharas.add(chara);
                usedCardIds.add(card.cardId);
            }
            let selectedCharas;
            if (biased && hasViableGroups) {
                const allGroups = [...viableUnitGroups, ...viableAttrGroups];
                const group = allGroups[rng.nextInt(allGroups.length)][1];
                const shuffled = [...group];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = rng.nextInt(i + 1);
                    const tmp = shuffled[i];
                    shuffled[i] = shuffled[j];
                    shuffled[j] = tmp;
                }
                selectedCharas = shuffled.slice(0, freeSlots);
            }
            else {
                for (let i = validCharas.length - 1; i > 0; i--) {
                    const j = rng.nextInt(i + 1);
                    const tmp = validCharas[i];
                    validCharas[i] = validCharas[j];
                    validCharas[j] = tmp;
                }
                selectedCharas = validCharas.slice(0, freeSlots);
            }
            for (const chara of selectedCharas) {
                const cards = charaCards[chara];
                const idx = weightedRandomSelect(rng, charaCardWeights[chara]);
                deck.push(cards[idx]);
                usedCharas.add(chara);
                usedCardIds.add(cards[idx].cardId);
            }
        }
        else {
            const indices = [];
            let attempts = 0;
            while (indices.length < member - fixedSize && attempts < 100) {
                const idx = weightedRandomSelect(rng, allCardWeights);
                const card = cardDetails[idx];
                if (!usedCardIds.has(card.cardId) && !fixedCardIds.has(card.cardId)) {
                    usedCardIds.add(card.cardId);
                    indices.push(idx);
                }
                attempts++;
            }
            if (indices.length < member - fixedSize)
                return null;
            for (const idx of indices) {
                deck.push(cardDetails[idx]);
            }
        }
        for (const card of fixedCards) {
            deck.push(card);
        }
        return { deck, deckHash: 0, fitness: 0 };
    };
    const crossover = (a, b) => {
        if (rng.next() > cfg.crossoverRate) {
            return a.fitness >= b.fitness ? { ...a, deck: [...a.deck] } : { ...b, deck: [...b.deck] };
        }
        const deck = [];
        const usedCharas = new Set();
        const usedCardIds = new Set();
        const nonFixedLen = a.deck.length - fixedSize;
        const keepFromA = [];
        for (let i = 0; i < nonFixedLen; i++) {
            const card = a.deck[i];
            if (fixedCharacterSet.has(card.characterId)) {
                keepFromA.push(i);
                continue;
            }
            if (rng.next() < 0.5) {
                keepFromA.push(i);
            }
        }
        for (const idx of keepFromA) {
            const card = a.deck[idx];
            deck.push(card);
            usedCharas.add(card.characterId);
            usedCardIds.add(card.cardId);
        }
        const bCandidates = [];
        for (let i = 0; i < nonFixedLen; i++) {
            const card = b.deck[i];
            if (usedCardIds.has(card.cardId))
                continue;
            if (!isChallengeLive && usedCharas.has(card.characterId))
                continue;
            bCandidates.push(i);
        }
        for (let i = bCandidates.length - 1; i > 0; i--) {
            const j = rng.nextInt(i + 1);
            const tmp = bCandidates[i];
            bCandidates[i] = bCandidates[j];
            bCandidates[j] = tmp;
        }
        const needed = nonFixedLen - deck.length;
        for (let i = 0; i < Math.min(needed, bCandidates.length); i++) {
            const card = b.deck[bCandidates[i]];
            deck.push(card);
            usedCharas.add(card.characterId);
            usedCardIds.add(card.cardId);
        }
        if (deck.length < nonFixedLen)
            return null;
        for (const card of fixedCards) {
            deck.push(card);
        }
        if (deck.length !== member)
            return null;
        return { deck, deckHash: 0, fitness: 0 };
    };
    const mutate = (individual, mutationRate) => {
        const nonFixedLen = individual.deck.length - fixedSize;
        for (let pos = 0; pos < nonFixedLen; pos++) {
            if (rng.next() > mutationRate)
                continue;
            const isFixedChara = fixedCharacterSet.has(individual.deck[pos].characterId);
            for (let attempt = 0; attempt < 10; attempt++) {
                let newCard;
                if (isFixedChara) {
                    const chara = individual.deck[pos].characterId;
                    const cards = charaCards[chara];
                    if (cards.length <= 1)
                        break;
                    const idx = weightedRandomSelect(rng, charaCardWeights[chara]);
                    newCard = cards[idx];
                }
                else {
                    const idx = weightedRandomSelect(rng, allCardWeights);
                    newCard = cardDetails[idx];
                }
                let ok = true;
                for (let i = 0; i < individual.deck.length; i++) {
                    if (i === pos)
                        continue;
                    if (individual.deck[i].cardId === newCard.cardId) {
                        ok = false;
                        break;
                    }
                    if (!isChallengeLive && individual.deck[i].characterId === newCard.characterId) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    individual.deck[pos] = newCard;
                    break;
                }
            }
        }
    };
    if (member === fixedSize + fixedCharacters.length) {
        const ind = generateRandomIndividual(false);
        if (ind !== null) {
            evaluateIndividual(ind);
        }
        return bestDecks;
    }
    let population = [];
    for (let i = 0; i < cfg.popSize; i++) {
        if (isTimeout())
            break;
        const useBias = allowBiasInitialization && hasViableGroups && i < cfg.popSize * 0.5;
        const ind = generateRandomIndividual(useBias);
        if (ind === null)
            continue;
        evaluateIndividual(ind);
        if (ind.fitness >= 0) {
            population.push(ind);
        }
    }
    if (population.length === 0) {
        return bestDecks;
    }
    let curMaxFitness = population.reduce((max, ind) => Math.max(max, ind.fitness), 0);
    let lastMaxFitness = 0;
    let noImproveIter = 0;
    for (let iter = 0; iter < cfg.maxIter; iter++) {
        if (isTimeout())
            break;
        population.sort((a, b) => b.fitness - a.fitness);
        lastMaxFitness = curMaxFitness;
        const curMutationRate = cfg.baseMutationRate + cfg.noImproveIterToMutationRate * noImproveIter;
        const newPopulation = [];
        const eliteSize = Math.min(cfg.eliteSize, population.length);
        for (let i = 0; i < eliteSize; i++) {
            newPopulation.push(population[i]);
        }
        const parentSize = Math.min(cfg.parentSize, population.length);
        while (newPopulation.length < cfg.popSize) {
            if (isTimeout())
                break;
            const idx1 = rng.nextInt(parentSize);
            const idx2 = rng.nextInt(parentSize);
            const child = crossover(population[idx1], population[idx2]);
            if (child === null)
                continue;
            mutate(child, curMutationRate);
            evaluateIndividual(child);
            newPopulation.push(child);
            curMaxFitness = Math.max(curMaxFitness, child.fitness);
        }
        const seen = new Set();
        population = [];
        for (const ind of newPopulation) {
            if (!seen.has(ind.deckHash)) {
                population.push(ind);
                seen.add(ind.deckHash);
            }
        }
        if (curMaxFitness <= lastMaxFitness) {
            noImproveIter++;
            if (noImproveIter > cfg.maxIterNoImprove)
                break;
        }
        else {
            noImproveIter = 0;
        }
    }
    return bestDecks;
}

function getMainDeckFilterUnit(eventConfig, filterOtherUnit = false) {
    if (!filterOtherUnit)
        return undefined;
    if (eventConfig.eventType !== EventType.BLOOM)
        return undefined;
    return eventConfig.eventUnit;
}
function shouldApplySameUnitOrAttrPrune(eventConfig) {
    return eventConfig.eventType !== EventType.BLOOM || eventConfig.eventUnit !== undefined;
}
function shouldKeepCardForMainDeckFilter(card, filterUnit, fixedCharacterSet = new Set()) {
    if (filterUnit === undefined)
        return true;
    return fixedCharacterSet.has(card.characterId) ||
        (card.units.length === 1 && card.units[0] === 'piapro') ||
        card.units.includes(filterUnit);
}

var RecommendAlgorithm;
(function (RecommendAlgorithm) {
    RecommendAlgorithm["DFS"] = "dfs";
    RecommendAlgorithm["GA"] = "ga";
})(RecommendAlgorithm || (RecommendAlgorithm = {}));
var RecommendTarget;
(function (RecommendTarget) {
    RecommendTarget["Score"] = "score";
    RecommendTarget["Power"] = "power";
    RecommendTarget["Skill"] = "skill";
    RecommendTarget["Bonus"] = "bonus";
    RecommendTarget["Mysekai"] = "mysekai";
})(RecommendTarget || (RecommendTarget = {}));
class BaseDeckRecommend {
    dataProvider;
    cardCalculator;
    deckCalculator;
    areaItemService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardCalculator = new CardCalculator(dataProvider);
        this.deckCalculator = new DeckCalculator(dataProvider);
        this.areaItemService = new AreaItemService(dataProvider);
    }
    static findBestCardsDFS(cardDetails, allCards, scoreFunc, limit = 1, isChallengeLive = false, member = 5, leaderCharacter = 0, honorBonus = 0, eventConfig = {}, skillReferenceChooseStrategy = SkillReferenceChooseStrategy.Average, keepAfterTrainingState = false, bestSkillAsLeader = true, deckCards = [], dfsState, fixedCharacters = [], fixedCards = []) {
        if (dfsState !== undefined && dfsState.isTimeout()) {
            return dfsState.bestDecks;
        }
        if (isChallengeLive) {
            member = Math.min(member, cardDetails.length);
        }
        const cIndex = fixedCards.length + fixedCharacters.length;
        const applySameUnitOrAttrPrune = shouldApplySameUnitOrAttrPrune(eventConfig);
        if (deckCards.length === 0 && fixedCards.length > 0) {
            deckCards = [...fixedCards];
        }
        if (deckCards.length === member) {
            if (dfsState !== undefined) {
                const hash = BaseDeckRecommend.calcDeckHash(deckCards);
                if (dfsState.deckHashCache.has(hash)) {
                    return dfsState.bestDecks;
                }
                dfsState.deckHashCache.add(hash);
            }
            if (fixedCharacters.length > 0 || fixedCards.length > 0) {
                const deckDetail = DeckCalculator.getDeckDetailByCards(deckCards, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, skillReferenceChooseStrategy, keepAfterTrainingState, false, eventConfig.worldBloomEventTurn);
                const score = scoreFunc(deckDetail);
                return toRecommendDeck(deckDetail, score);
            }
            const dd1 = DeckCalculator.getDeckDetailByCards(deckCards, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, skillReferenceChooseStrategy, keepAfterTrainingState, true, eventConfig.worldBloomEventTurn);
            const s1 = scoreFunc(dd1);
            let bestLeaderIdx = 0;
            let bestLeaderBonus = -1;
            for (let i = 0; i < deckCards.length; i++) {
                const card = deckCards[i];
                const lb = card.eventBonus !== undefined
                    ? card.eventBonus.getMaxBonus(true) - card.eventBonus.getMaxBonus(false)
                    : 0;
                if (lb > bestLeaderBonus) {
                    bestLeaderBonus = lb;
                    bestLeaderIdx = i;
                }
            }
            let s2 = -1;
            let dd2 = null;
            if (bestLeaderIdx !== 0 && bestLeaderBonus > 0) {
                swap(deckCards, 0, bestLeaderIdx);
                dd2 = DeckCalculator.getDeckDetailByCards(deckCards, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, skillReferenceChooseStrategy, keepAfterTrainingState, false, eventConfig.worldBloomEventTurn);
                s2 = scoreFunc(dd2);
                swap(deckCards, 0, bestLeaderIdx);
            }
            const bestScore = s2 > s1 ? s2 : s1;
            const bestDetail = (s2 > s1 && dd2 !== null) ? dd2 : dd1;
            return toRecommendDeck(bestDetail, bestScore);
        }
        let ans = [];
        let preCard = null;
        for (const card of cardDetails) {
            if (dfsState !== undefined && dfsState.isTimeout()) {
                return ans.length > 0 ? ans : dfsState.bestDecks;
            }
            if (deckCards.some(it => it.cardId === card.cardId)) {
                continue;
            }
            if (!isChallengeLive && deckCards.some(it => it.characterId === card.characterId)) {
                continue;
            }
            if (fixedCharacters.length > deckCards.length && fixedCharacters[deckCards.length] !== card.characterId) {
                continue;
            }
            if (deckCards.length >= cIndex + 1 && deckCards[cIndex].skill.isCertainlyLessThen(card.skill)) {
                continue;
            }
            if (applySameUnitOrAttrPrune && deckCards.length >= cIndex + 1 &&
                card.attr !== deckCards[cIndex].attr && !containsAny(deckCards[cIndex].units, card.units)) {
                continue;
            }
            if (eventConfig.worldBloomDifferentAttributeBonuses !== undefined && isDeckAttrLessThan3(deckCards, card)) {
                continue;
            }
            const sortPruneStart = cIndex + 2;
            if (deckCards.length >= sortPruneStart && CardCalculator.isCertainlyLessThan(deckCards[deckCards.length - 1], card)) {
                continue;
            }
            if (deckCards.length >= sortPruneStart && !CardCalculator.isCertainlyLessThan(card, deckCards[deckCards.length - 1]) &&
                card.cardId > deckCards[deckCards.length - 1].cardId) {
                continue;
            }
            if (deckCards.length >= cIndex && preCard !== null && CardCalculator.isCertainlyLessThan(card, preCard)) {
                continue;
            }
            preCard = card;
            const result = BaseDeckRecommend.findBestCardsDFS(cardDetails, allCards, scoreFunc, limit, isChallengeLive, member, leaderCharacter, honorBonus, eventConfig, skillReferenceChooseStrategy, keepAfterTrainingState, bestSkillAsLeader, [...deckCards, card], dfsState, fixedCharacters, fixedCards);
            ans = updateDeck(ans, result, limit);
            if (dfsState !== undefined && ans.length > 0) {
                dfsState.bestDecks = updateDeck(dfsState.bestDecks, ans, limit);
            }
        }
        if (deckCards.length === 0 && ans.length === 0) {
            if (dfsState !== undefined && dfsState.bestDecks.length > 0) {
                return dfsState.bestDecks;
            }
            console.warn(`Cannot find deck in ${cardDetails.length} cards(${cardDetails.map(it => it.cardId).toString()})`);
            return [];
        }
        return ans;
    }
    static calcDeckHash(deckCards) {
        if (deckCards.length === 0)
            return 0;
        const ids = deckCards.map(c => c.cardId);
        const sorted = ids.slice(1).sort((a, b) => a - b);
        const BASE = 10007;
        let hash = ids[0];
        for (const id of sorted) {
            hash = ((hash * BASE) + id) | 0;
        }
        return hash >>> 0;
    }
    async recommendHighScoreDeck(userCards, scoreFunc, { musicMeta, limit = 1, member = 5, leaderCharacter = undefined, fixedCards: configFixedCards = [], fixedCharacters: configFixedCharacters = [], cardConfig = {}, debugLog = (_) => {
    }, algorithm = RecommendAlgorithm.GA, gaConfig = {}, timeoutMs = 30000, target = RecommendTarget.Score, skillReferenceChooseStrategy = SkillReferenceChooseStrategy.Average, keepAfterTrainingState = false, bestSkillAsLeader = true, filterOtherUnit = false }, liveType, eventConfig = {}) {
        const { eventType = EventType.NONE, specialCharacterId, worldBloomType } = eventConfig;
        let fixedCharacters = [...configFixedCharacters];
        if (fixedCharacters.length === 0 && leaderCharacter !== undefined && leaderCharacter > 0) {
            fixedCharacters = [leaderCharacter];
        }
        if (configFixedCards.length > 0 && fixedCharacters.length > 0) {
            throw new Error('Cannot set both fixedCards and fixedCharacters');
        }
        if (liveType === LiveType.CHALLENGE && fixedCharacters.length > 0) {
            throw new Error('Cannot set fixedCharacters in challenge live');
        }
        let effectiveScoreFunc = scoreFunc;
        if (target === RecommendTarget.Power) {
            effectiveScoreFunc = (_musicMeta, deckDetail) => deckDetail.power.total;
        }
        else if (target === RecommendTarget.Skill) {
            effectiveScoreFunc = (_musicMeta, deckDetail) => deckDetail.multiLiveScoreUp * 10000 + deckDetail.power.total;
        }
        const honorBonus = await this.deckCalculator.getHonorBonusPower();
        const areaItemLevels = await this.areaItemService.getAreaItemLevels();
        let cards = await this.cardCalculator.batchGetCardDetail(userCards, cardConfig, eventConfig, areaItemLevels);
        const filterUnit = getMainDeckFilterUnit(eventConfig, filterOtherUnit);
        const fixedCharacterSet = new Set(fixedCharacters);
        if (filterUnit !== undefined) {
            const originCardsLength = cards.length;
            cards = cards.filter(it => shouldKeepCardForMainDeckFilter(it, filterUnit, fixedCharacterSet));
            debugLog(`Cards filtered with unit ${filterUnit}: ${cards.length}/${originCardsLength}`);
            debugLog(cards.map(it => it.cardId).toString());
        }
        const resolvedFixedCards = [];
        for (const cardId of configFixedCards) {
            const existing = cards.find(c => c.cardId === cardId);
            if (existing !== undefined) {
                resolvedFixedCards.push(existing);
            }
            else {
                const virtualUserCard = {
                    userId: 0,
                    cardId,
                    level: 1,
                    exp: 0,
                    totalExp: 0,
                    skillLevel: 1,
                    skillExp: 0,
                    totalSkillExp: 0,
                    masterRank: 0,
                    specialTrainingStatus: 'not_doing',
                    defaultImage: 'original',
                    duplicateCount: 0,
                    createdAt: 0,
                    episodes: []
                };
                const virtualCards = await this.cardCalculator.batchGetCardDetail([virtualUserCard], cardConfig, eventConfig, areaItemLevels);
                if (virtualCards.length > 0) {
                    resolvedFixedCards.push(virtualCards[0]);
                    cards.push(virtualCards[0]);
                    debugLog(`Generated virtual card for fixed cardId=${cardId}`);
                }
                else {
                    debugLog(`Warning: Failed to generate virtual card for fixed cardId=${cardId}, skipping`);
                }
            }
        }
        if (resolvedFixedCards.length > 0) {
            if (resolvedFixedCards.length > member) {
                throw new Error('Fixed cards size is larger than member size');
            }
            const fixedCardIds = new Set(resolvedFixedCards.map(c => c.cardId));
            if (fixedCardIds.size !== resolvedFixedCards.length) {
                throw new Error('Fixed cards have duplicate cards');
            }
            if (liveType !== LiveType.CHALLENGE) {
                const fixedCardCharacterIds = new Set(resolvedFixedCards.map(c => c.characterId));
                if (fixedCardCharacterIds.size !== resolvedFixedCards.length) {
                    throw new Error('Fixed cards have duplicate characters');
                }
            }
        }
        if (worldBloomType === 'finale' && specialCharacterId !== undefined) {
            fixedCharacters = [specialCharacterId];
        }
        const effectiveLeaderCharacter = fixedCharacters.length > 0 ? fixedCharacters[0] : 0;
        const sortCardsByStrength = (cardList) => {
            return [...cardList].sort((a, b) => {
                if (target === RecommendTarget.Skill) {
                    const aMax = a.skill.getMax();
                    const bMax = b.skill.getMax();
                    if (aMax !== bMax)
                        return bMax - aMax;
                    const aMin = a.skill.getMin();
                    const bMin = b.skill.getMin();
                    if (aMin !== bMin)
                        return bMin - aMin;
                    return b.cardId - a.cardId;
                }
                else {
                    const aMax = a.power.getMax();
                    const bMax = b.power.getMax();
                    if (aMax !== bMax)
                        return bMax - aMax;
                    const aMin = a.power.getMin();
                    const bMin = b.power.getMin();
                    if (aMin !== bMin)
                        return bMin - aMin;
                    return b.cardId - a.cardId;
                }
            });
        };
        const startTime = Date.now();
        const isTimeout = () => Date.now() - startTime > timeoutMs;
        if (algorithm === RecommendAlgorithm.GA) {
            debugLog(`Using GA algorithm with ${cards.length} cards`);
            const gaResult = findBestCardsGA(cards, cards, effectiveScoreFunc, musicMeta, limit, liveType === LiveType.CHALLENGE, member, honorBonus, eventConfig, { ...gaConfig, timeoutMs: Math.max(1000, timeoutMs - (Date.now() - startTime)), target }, skillReferenceChooseStrategy, keepAfterTrainingState, bestSkillAsLeader, effectiveLeaderCharacter, fixedCharacters, resolvedFixedCards);
            if (gaResult.length >= limit) {
                debugLog(`GA found ${gaResult.length} deck(s)`);
                return gaResult;
            }
            debugLog(`GA found ${gaResult.length} deck(s), falling back to DFS`);
            if (isTimeout())
                return gaResult;
            let preCardDetails = [];
            while (!isTimeout()) {
                const cardDetails = filterCardPriority(liveType, eventType, cards, preCardDetails, member, effectiveLeaderCharacter, fixedCharacters);
                if (cardDetails.length === preCardDetails.length) {
                    return gaResult.length > 0 ? gaResult : [];
                }
                preCardDetails = cardDetails;
                const cards0 = sortCardsByStrength(cardDetails);
                debugLog(`DFS fallback with ${cards0.length}/${cards.length} cards`);
                const dfsState = new DFSState(Math.max(1000, timeoutMs - (Date.now() - startTime)));
                const recommend = BaseDeckRecommend.findBestCardsDFS(cards0, cards, deckDetail => effectiveScoreFunc(musicMeta, deckDetail), limit, liveType === LiveType.CHALLENGE, member, effectiveLeaderCharacter, honorBonus, eventConfig, skillReferenceChooseStrategy, keepAfterTrainingState, bestSkillAsLeader, [], dfsState, fixedCharacters, resolvedFixedCards);
                const merged = updateDeck(gaResult, recommend, limit);
                if (merged.length >= limit)
                    return merged;
            }
            return gaResult;
        }
        let preCardDetails = [];
        while (!isTimeout()) {
            const cardDetails = filterCardPriority(liveType, eventType, cards, preCardDetails, member, effectiveLeaderCharacter, fixedCharacters);
            if (cardDetails.length === preCardDetails.length) {
                throw new Error(`Cannot recommend any deck in ${cards.length} cards`);
            }
            preCardDetails = cardDetails;
            const cards0 = sortCardsByStrength(cardDetails);
            debugLog(`Recommend deck with ${cards0.length}/${cards.length} cards`);
            debugLog(cards0.map(it => it.cardId).toString());
            const dfsState = new DFSState(Math.max(1000, timeoutMs - (Date.now() - startTime)));
            const recommend = BaseDeckRecommend.findBestCardsDFS(cards0, cards, deckDetail => effectiveScoreFunc(musicMeta, deckDetail), limit, liveType === LiveType.CHALLENGE, member, effectiveLeaderCharacter, honorBonus, eventConfig, skillReferenceChooseStrategy, keepAfterTrainingState, bestSkillAsLeader, [], dfsState, fixedCharacters, resolvedFixedCards);
            if (recommend.length >= limit)
                return recommend;
        }
        throw new Error(`Timeout: Cannot recommend deck in ${timeoutMs}ms`);
    }
}
class DFSState {
    deckHashCache = new Set();
    bestDecks = [];
    startTime;
    timeoutMs;
    constructor(timeoutMs = 30000) {
        this.startTime = Date.now();
        this.timeoutMs = timeoutMs;
    }
    isTimeout() {
        return Date.now() - this.startTime > this.timeoutMs;
    }
}

class BloomSupportDeckRecommend {
    dataProvider;
    cardCalculator;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardCalculator = new CardCalculator(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async recommendBloomSupportDeck(mainDeck, eventId, specialCharacterId) {
        const userCards = await this.dataProvider.getUserData('userCards');
        const eventConfig = await this.eventService.getEventConfig(eventId, specialCharacterId);
        const allCards = await this.cardCalculator.batchGetCardDetail(userCards, {}, eventConfig);
        return EventCalculator.getSupportDeckBonus(mainDeck, allCards).cards;
    }
}

class ChallengeLiveDeckRecommend {
    dataProvider;
    baseRecommend;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.baseRecommend = new BaseDeckRecommend(dataProvider);
    }
    async recommendChallengeLiveDeck(characterId, config) {
        const userCards = await this.dataProvider.getUserData('userCards');
        const cards = await this.dataProvider.getMasterData('cards');
        const characterCards = userCards
            .filter(userCard => findOrThrow(cards, it => it.id === userCard.cardId).characterId === characterId);
        return await this.baseRecommend.recommendHighScoreDeck(characterCards, LiveCalculator.getLiveScoreFunction(LiveType.SOLO), config, LiveType.CHALLENGE);
    }
}

class EventDeckRecommend {
    dataProvider;
    baseRecommend;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.baseRecommend = new BaseDeckRecommend(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async recommendEventDeck(eventId, liveType, config, specialCharacterId = 0) {
        const eventConfig = await this.eventService.getEventConfig(eventId, specialCharacterId);
        if (eventConfig.eventType === undefined)
            throw new Error(`Event type not found for ${eventId}`);
        const userCards = await this.dataProvider.getUserData('userCards');
        return await this.baseRecommend.recommendHighScoreDeck(userCards, EventCalculator.getEventPointFunction(liveType, eventConfig.eventType), config, liveType, eventConfig);
    }
}

function getCharaBonusKey(chara, bonus) {
    return bonus * 100 + chara;
}
function getBonusFromKey(key) {
    return Math.floor(key / 100);
}
function getCharaFromKey(key) {
    return key % 100;
}
function getCharaAttrBonusKey(chara, attr, bonus) {
    return bonus * 1000 + chara * 10 + attr;
}
function getBonusFromWLKey(key) {
    return Math.floor(key / 1000);
}
function getCharaFromWLKey(key) {
    return Math.floor(key / 10) % 100;
}
function getAttrFromWLKey(key) {
    return key % 10;
}
const ATTR_MAP = {
    cool: 1,
    cute: 2,
    happy: 3,
    mysterious: 4,
    pure: 5
};
function attrToNum(attr) {
    return ATTR_MAP[attr] ?? 0;
}
const BONUS_FILTERS = [
    (key, getChara) => { const c = getChara(key); return (Math.floor((c - 1) / 4) === 0) || c > 20; },
    (key, getChara) => { const c = getChara(key); return (Math.floor((c - 1) / 4) === 1) || c > 20; },
    (key, getChara) => { const c = getChara(key); return (Math.floor((c - 1) / 4) === 2) || c > 20; },
    (key, getChara) => { const c = getChara(key); return (Math.floor((c - 1) / 4) === 3) || c > 20; },
    (key, getChara) => { const c = getChara(key); return (Math.floor((c - 1) / 4) === 4) || c > 20; },
    (_key, _getChara) => true
];
function applyFilter(filter, hasBonusCharaCards, getChara) {
    const ret = new Map();
    for (const [key, hasCard] of hasBonusCharaCards) {
        if (filter(key, getChara)) {
            ret.set(key, hasCard);
        }
    }
    return ret;
}
class TimeoutControl {
    startTime;
    timeoutMs;
    constructor(timeoutMs = 30000) {
        this.startTime = Date.now();
        this.timeoutMs = timeoutMs;
    }
    isTimeout() {
        return Date.now() - this.startTime > this.timeoutMs;
    }
}
function dfsBonusNonWL(member, timer, targets, currentBonus, current, result, hasBonusCharaCards, charaVis, sortedKeys, limit) {
    if (current.length === member) {
        if (targets.has(currentBonus)) {
            if (!result.has(currentBonus))
                result.set(currentBonus, []);
            result.get(currentBonus).push([...current]);
            if (result.get(currentBonus).length >= limit) {
                targets.delete(currentBonus);
            }
        }
        return targets.size > 0;
    }
    if (timer.isTimeout())
        return false;
    const maxTarget = Math.max(...targets);
    if (currentBonus > maxTarget)
        return true;
    let startIdx = 0;
    if (current.length > 0) {
        const lastKey = current[current.length - 1];
        startIdx = sortedKeys.indexOf(lastKey) + 1;
        for (let i = startIdx; i < sortedKeys.length; i++) {
            if (sortedKeys[i] > lastKey) {
                startIdx = i;
                break;
            }
            if (i === sortedKeys.length - 1) {
                startIdx = sortedKeys.length;
                break;
            }
        }
    }
    const remaining = member - current.length;
    let lowestBonus = 0;
    let highestBonus = 0;
    let countLow = 0;
    let countHigh = 0;
    for (let i = startIdx; i < sortedKeys.length && countLow < remaining; i++) {
        const k = sortedKeys[i];
        const chara = getCharaFromKey(k);
        if (charaVis.has(chara))
            continue;
        if (!hasBonusCharaCards.get(k))
            continue;
        lowestBonus += getBonusFromKey(k);
        countLow++;
    }
    for (let i = sortedKeys.length - 1; i >= startIdx && countHigh < remaining; i--) {
        const k = sortedKeys[i];
        const chara = getCharaFromKey(k);
        if (charaVis.has(chara))
            continue;
        if (!hasBonusCharaCards.get(k))
            continue;
        highestBonus += getBonusFromKey(k);
        countHigh++;
    }
    const minTarget = Math.min(...targets);
    if (currentBonus + lowestBonus > maxTarget || currentBonus + highestBonus < minTarget) {
        return true;
    }
    for (let i = startIdx; i < sortedKeys.length; i++) {
        const k = sortedKeys[i];
        const chara = getCharaFromKey(k);
        if (charaVis.has(chara))
            continue;
        if (!hasBonusCharaCards.get(k))
            continue;
        hasBonusCharaCards.set(k, false);
        charaVis.add(chara);
        current.push(k);
        const cont = dfsBonusNonWL(member, timer, targets, currentBonus + getBonusFromKey(k), current, result, hasBonusCharaCards, charaVis, sortedKeys, limit);
        if (!cont)
            return false;
        current.pop();
        charaVis.delete(chara);
        hasBonusCharaCards.set(k, true);
    }
    return true;
}
function dfsBonusWL(member, timer, targets, currentBonus, current, result, hasBonusCharaCards, charaVis, attrVis, diffAttrBonus, maxAttrBonus, sortedKeys, limit) {
    let diffAttrCount = 0;
    for (let i = 0; i < attrVis.length; i++) {
        if (attrVis[i] > 0)
            diffAttrCount++;
    }
    const currentDiffAttrBonus = diffAttrBonus.get(diffAttrCount) ?? 0;
    if (current.length === member) {
        const realCurrentBonus = currentBonus + currentDiffAttrBonus;
        if (targets.has(realCurrentBonus)) {
            if (!result.has(realCurrentBonus))
                result.set(realCurrentBonus, []);
            result.get(realCurrentBonus).push([...current]);
            if (result.get(realCurrentBonus).length >= limit) {
                targets.delete(realCurrentBonus);
            }
        }
        return targets.size > 0;
    }
    if (timer.isTimeout())
        return false;
    const maxTarget = Math.max(...targets);
    if (currentBonus + currentDiffAttrBonus > maxTarget)
        return true;
    let startIdx = 0;
    if (current.length > 0) {
        const lastKey = current[current.length - 1];
        for (let i = 0; i < sortedKeys.length; i++) {
            if (sortedKeys[i] > lastKey) {
                startIdx = i;
                break;
            }
            if (i === sortedKeys.length - 1) {
                startIdx = sortedKeys.length;
                break;
            }
        }
    }
    const remaining = member - current.length;
    let lowestBonus = 0;
    let highestBonus = 0;
    let countLow = 0;
    let countHigh = 0;
    for (let i = startIdx; i < sortedKeys.length && countLow < remaining; i++) {
        const k = sortedKeys[i];
        const chara = getCharaFromWLKey(k);
        if (charaVis.has(chara))
            continue;
        if (!hasBonusCharaCards.get(k))
            continue;
        lowestBonus += getBonusFromWLKey(k);
        countLow++;
    }
    for (let i = sortedKeys.length - 1; i >= startIdx && countHigh < remaining; i--) {
        const k = sortedKeys[i];
        const chara = getCharaFromWLKey(k);
        if (charaVis.has(chara))
            continue;
        if (!hasBonusCharaCards.get(k))
            continue;
        highestBonus += getBonusFromWLKey(k);
        countHigh++;
    }
    const minTarget = Math.min(...targets);
    if (currentBonus + currentDiffAttrBonus + lowestBonus > maxTarget ||
        currentBonus + maxAttrBonus + highestBonus < minTarget) {
        return true;
    }
    for (let i = startIdx; i < sortedKeys.length; i++) {
        const k = sortedKeys[i];
        const chara = getCharaFromWLKey(k);
        const attr = getAttrFromWLKey(k);
        if (charaVis.has(chara))
            continue;
        if (!hasBonusCharaCards.get(k))
            continue;
        hasBonusCharaCards.set(k, false);
        charaVis.add(chara);
        attrVis[attr]++;
        current.push(k);
        const cont = dfsBonusWL(member, timer, targets, currentBonus + getBonusFromWLKey(k), current, result, hasBonusCharaCards, charaVis, attrVis, diffAttrBonus, maxAttrBonus, sortedKeys, limit);
        if (!cont)
            return false;
        current.pop();
        attrVis[attr]--;
        charaVis.delete(chara);
        hasBonusCharaCards.set(k, true);
    }
    return true;
}
class EventBonusDeckRecommend {
    dataProvider;
    cardCalculator;
    deckCalculator;
    areaItemService;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.cardCalculator = new CardCalculator(dataProvider);
        this.deckCalculator = new DeckCalculator(dataProvider);
        this.areaItemService = new AreaItemService(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async recommendEventBonusDeck(eventId, targetBonus, liveType, config, specialCharacterId = 0, maxBonus) {
        const eventConfig = await this.eventService.getEventConfig(eventId, specialCharacterId);
        if (eventConfig.eventType === undefined)
            throw new Error(`Event type not found for ${eventId}`);
        const userCards = await this.dataProvider.getUserData('userCards');
        const { musicMeta, member = 5, cardConfig = {}, specificBonuses, debugLog = (_) => { }, timeoutMs = 30000, filterOtherUnit = false } = config;
        const minB = maxBonus !== undefined ? targetBonus : targetBonus;
        const maxB = maxBonus !== undefined ? maxBonus : targetBonus;
        const honorBonus = await this.deckCalculator.getHonorBonusPower();
        const areaItemLevels = await this.areaItemService.getAreaItemLevels();
        let cards = await this.cardCalculator.batchGetCardDetail(userCards, cardConfig, eventConfig, areaItemLevels);
        const filterUnit = getMainDeckFilterUnit(eventConfig, filterOtherUnit);
        if (filterUnit !== undefined) {
            const originCardsLength = cards.length;
            cards = cards.filter(it => shouldKeepCardForMainDeckFilter(it, filterUnit));
            debugLog(`Cards filtered with unit ${filterUnit}: ${cards.length}/${originCardsLength}`);
        }
        const isWorldBloom = eventConfig.eventType === EventType.BLOOM;
        let bonusList;
        if (specificBonuses !== undefined && specificBonuses.length > 0) {
            bonusList = specificBonuses
                .filter(b => b >= minB && b <= maxB)
                .map(b => Math.round(b * 2));
            debugLog(`Searching for specific bonuses: ${specificBonuses.join(', ')} in [${minB}, ${maxB}]`);
        }
        else {
            bonusList = [];
            for (let b2 = Math.ceil(minB * 2); b2 <= Math.floor(maxB * 2); b2++) {
                bonusList.push(b2);
            }
            debugLog(`Searching for bonus in [${minB}, ${maxB}] (${bonusList.length} targets) in ${cards.length} cards`);
        }
        if (bonusList.length === 0) {
            debugLog('No target bonuses to search');
            return [];
        }
        bonusList.sort((a, b) => a - b);
        const timer = new TimeoutControl(timeoutMs);
        let results;
        if (isWorldBloom) {
            results = this.findBonusDeckWL(cards, bonusList, honorBonus, member, eventConfig, timer, debugLog);
        }
        else {
            results = this.findBonusDeckNonWL(cards, bonusList, honorBonus, member, eventConfig, timer, debugLog);
        }
        results.sort((a, b) => a.score - b.score);
        debugLog(`Found ${results.length} deck(s)`);
        return results;
    }
    findBonusDeckNonWL(cards, bonusList, honorBonus, member, eventConfig, timer, debugLog) {
        const allCards = cards;
        const bonusCharaCards = new Map();
        const hasBonusCharaCards = new Map();
        for (const card of cards) {
            if (card.eventBonus === undefined)
                continue;
            const maxBonus = card.eventBonus.getMaxBonus(true);
            if (maxBonus <= 0)
                continue;
            const bonus2 = Math.round(maxBonus * 2);
            if (Math.abs(bonus2 - maxBonus * 2) > 1e-6)
                continue;
            const key = getCharaBonusKey(card.characterId, bonus2);
            if (!bonusCharaCards.has(key))
                bonusCharaCards.set(key, []);
            bonusCharaCards.get(key).push(card);
            hasBonusCharaCards.set(key, true);
        }
        const targets = new Set(bonusList);
        const results = [];
        for (const filter of BONUS_FILTERS) {
            if (targets.size === 0)
                break;
            if (timer.isTimeout())
                break;
            const filtered = applyFilter(filter, hasBonusCharaCards, getCharaFromKey);
            const sortedKeys = Array.from(filtered.keys()).sort((a, b) => a - b);
            const current = [];
            const dfsResult = new Map();
            const charaVis = new Set();
            dfsBonusNonWL(member, timer, targets, 0, current, dfsResult, filtered, charaVis, sortedKeys, 1);
            for (const [bonus2, bonusResults] of dfsResult) {
                for (const resultKeys of bonusResults) {
                    const deckCards = [];
                    for (const key of resultKeys) {
                        const cardList = bonusCharaCards.get(key);
                        if (cardList !== undefined && cardList.length > 0) {
                            deckCards.push(cardList[0]);
                        }
                    }
                    if (deckCards.length !== member)
                        continue;
                    const deckDetail = DeckCalculator.getDeckDetailByCards(deckCards, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, SkillReferenceChooseStrategy.Average, false, true, eventConfig.worldBloomEventTurn);
                    const actualBonus = safeNumber(deckDetail.eventBonus) + safeNumber(deckDetail.supportDeckBonus);
                    if (Math.abs(actualBonus * 2 - bonus2) < 1e-3) {
                        const ret = deckDetail;
                        ret.score = actualBonus;
                        results.push(ret);
                    }
                    else {
                        debugLog(`Warning: bonus mismatch, expected ${bonus2 / 2}, got ${actualBonus}`);
                    }
                }
            }
        }
        return results;
    }
    findBonusDeckWL(cards, bonusList, honorBonus, member, eventConfig, timer, debugLog) {
        const allCards = cards;
        const bonusCharaCards = new Map();
        const hasBonusCharaCards = new Map();
        for (const card of cards) {
            if (card.eventBonus === undefined)
                continue;
            const maxBonus = card.eventBonus.getMaxBonus(true);
            if (maxBonus <= 0)
                continue;
            const bonus2 = Math.round(maxBonus * 2);
            if (Math.abs(bonus2 - maxBonus * 2) > 1e-6)
                continue;
            const attrNum = attrToNum(card.attr);
            const key = getCharaAttrBonusKey(card.characterId, attrNum, bonus2);
            if (!bonusCharaCards.has(key))
                bonusCharaCards.set(key, []);
            bonusCharaCards.get(key).push(card);
            hasBonusCharaCards.set(key, true);
        }
        const diffAttrBonus = new Map();
        let maxAttrBonus = 0;
        if (eventConfig.worldBloomDifferentAttributeBonuses !== undefined) {
            for (const bonus of eventConfig.worldBloomDifferentAttributeBonuses) {
                const val = Math.round(bonus.bonusRate * 2);
                diffAttrBonus.set(bonus.attributeCount, val);
                maxAttrBonus = Math.max(maxAttrBonus, val);
            }
        }
        for (let i = 0; i <= 5; i++) {
            if (!diffAttrBonus.has(i))
                diffAttrBonus.set(i, 0);
        }
        const targets = new Set(bonusList);
        const results = [];
        for (const filter of BONUS_FILTERS) {
            if (targets.size === 0)
                break;
            if (timer.isTimeout())
                break;
            const filtered = applyFilter(filter, hasBonusCharaCards, getCharaFromWLKey);
            const sortedKeys = Array.from(filtered.keys()).sort((a, b) => a - b);
            const current = [];
            const dfsResult = new Map();
            const charaVis = new Set();
            const attrVis = new Array(10).fill(0);
            dfsBonusWL(member, timer, targets, 0, current, dfsResult, filtered, charaVis, attrVis, diffAttrBonus, maxAttrBonus, sortedKeys, 1);
            for (const [bonus2, bonusResults] of dfsResult) {
                for (const resultKeys of bonusResults) {
                    const deckCards = [];
                    for (const key of resultKeys) {
                        const cardList = bonusCharaCards.get(key);
                        if (cardList !== undefined && cardList.length > 0) {
                            deckCards.push(cardList[0]);
                        }
                    }
                    if (deckCards.length !== member)
                        continue;
                    const deckDetail = DeckCalculator.getDeckDetailByCards(deckCards, allCards, honorBonus, eventConfig.cardBonusCountLimit, eventConfig.worldBloomDifferentAttributeBonuses, SkillReferenceChooseStrategy.Average, false, true, eventConfig.worldBloomEventTurn);
                    const actualBonus = safeNumber(deckDetail.eventBonus) + safeNumber(deckDetail.supportDeckBonus);
                    if (Math.abs(actualBonus * 2 - bonus2) < 1e-3) {
                        const ret = deckDetail;
                        ret.score = actualBonus;
                        results.push(ret);
                    }
                    else {
                        debugLog(`Warning: WL bonus mismatch, expected ${bonus2 / 2}, got ${actualBonus}`);
                    }
                }
            }
        }
        return results;
    }
}

class MysekaiEventCalculator {
    static getDeckMysekaiEventPoint(deckDetail) {
        const power = deckDetail.power.total;
        const eventBonus = safeNumber(deckDetail.eventBonus) + safeNumber(deckDetail.supportDeckBonus);
        let powerBonus = 1 + (power / 450000);
        powerBonus = Math.floor(powerBonus * 10 + 1e-6) / 10.0;
        const eventBonusRate = Math.floor(eventBonus + 1e-6) / 100.0;
        return {
            mysekaiEventPoint: Math.floor(powerBonus * (1 + eventBonusRate) + 1e-6) * 500,
            mysekaiInternalPoint: powerBonus * (1 + eventBonusRate) * 500
        };
    }
    static getMysekaiEventPointFunction() {
        return (_musicMeta, deckDetail) => {
            const result = MysekaiEventCalculator.getDeckMysekaiEventPoint(deckDetail);
            return result.mysekaiInternalPoint;
        };
    }
}

class MysekaiDeckRecommend {
    dataProvider;
    baseRecommend;
    eventService;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.baseRecommend = new BaseDeckRecommend(dataProvider);
        this.eventService = new EventService(dataProvider);
    }
    async recommendMysekaiDeck(eventId, config, specialCharacterId = 0) {
        const eventConfig = await this.eventService.getEventConfig(eventId, specialCharacterId);
        if (eventConfig.eventType === undefined) {
            throw new Error(`Event type not found for ${eventId}`);
        }
        const userCards = await this.dataProvider.getUserData('userCards');
        return await this.baseRecommend.recommendHighScoreDeck(userCards, MysekaiEventCalculator.getMysekaiEventPointFunction(), {
            ...config,
            keepAfterTrainingState: true
        }, LiveType.MULTI, eventConfig);
    }
}

class MusicRecommend {
    dataProvider;
    deckCalculator;
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.deckCalculator = new DeckCalculator(dataProvider);
    }
    getRecommendMusic(deck, musicMeta, liveType, eventType) {
        const liveScore = new Map();
        const eventPoint = new Map();
        const deckBonus = deck.eventBonus;
        const score = LiveCalculator.getLiveDetailByDeck(deck, musicMeta, liveType).score;
        liveScore.set(liveType, score);
        if (deck.eventBonus !== undefined || liveType === LiveType.CHALLENGE) {
            const point = EventCalculator.getEventPoint(liveType, eventType, score, musicMeta.event_rate, deckBonus);
            eventPoint.set(liveType, point);
        }
        return {
            musicId: musicMeta.music_id,
            difficulty: musicMeta.difficulty,
            liveScore,
            eventPoint
        };
    }
    async recommendMusic(deck, liveType, eventType = EventType.NONE) {
        const musicMetas = await this.dataProvider.getMusicMeta();
        return musicMetas.map(it => this.getRecommendMusic(deck, it, liveType, eventType));
    }
}

export { AreaItemRecommend, AreaItemService, BaseDeckRecommend, BloomSupportDeckRecommend, CachedDataProvider, CardCalculator, CardCustomBonusCalculator, CardEventCalculator, CardPowerCalculator, CardService, CardSkillCalculator, ChallengeLiveDeckRecommend, DeckCalculator, DeckService, EventBonusDeckRecommend, EventCalculator, EventDeckRecommend, EventService, EventType, LiveCalculator, LiveExactCalculator, LiveType, MusicRecommend, MysekaiDeckRecommend, MysekaiEventCalculator, RecommendAlgorithm, RecommendTarget, SkillReferenceChooseStrategy, findBestCardsGA };
