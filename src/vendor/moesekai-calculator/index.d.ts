interface MusicMeta {
    music_id: number;
    difficulty: string;
    music_time: number;
    event_rate: number;
    base_score: number;
    base_score_auto: number;
    skill_score_solo: number[];
    skill_score_auto: number[];
    skill_score_multi: number[];
    fever_score: number;
    fever_end_time: number;
    tap_count: number;
}

interface DataProvider {
    getMasterData: <T>(key: string) => Promise<T[]>;
    getUserDataAll: () => Promise<Record<string, any>>;
    getUserData: <T>(key: string) => Promise<T>;
    getMusicMeta: () => Promise<MusicMeta[]>;
}

declare class CachedDataProvider implements DataProvider {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    private static readonly globalCache;
    private readonly instanceCache;
    private static readonly runningPromise;
    private getData;
    getMasterData<T>(key: string): Promise<T[]>;
    getMusicMeta(): Promise<MusicMeta[]>;
    getUserData<T>(key: string): Promise<T>;
    getUserDataAll(): Promise<Record<string, any>>;
    preloadMasterData(keys: string[]): Promise<any[]>;
}

interface AreaItemLevel {
    areaItemId: number;
    level: number;
    targetUnit: string;
    targetCardAttr: string;
    targetGameCharacterId?: number;
    power1BonusRate: number;
    power1AllMatchBonusRate: number;
    power2BonusRate: number;
    power2AllMatchBonusRate: number;
    power3BonusRate: number;
    power3AllMatchBonusRate: number;
    sentence: string;
}

interface AreaItem {
    id: number;
    areaId: number;
    name: string;
    flavorText: string;
    spawnPoint: string;
    assetbundleName: string;
}

interface CommonResource {
    resourceId?: number;
    resourceType: string;
    resourceLevel?: number;
    quantity: number;
}

interface ShopItem {
    id: number;
    shopId: number;
    seq: number;
    releaseConditionId: number;
    resourceBoxId: number;
    costs: Array<{
        shopItemId: number;
        seq: number;
        cost: CommonResource;
    }>;
}

declare class AreaItemService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getAreaItemLevels(): Promise<AreaItemLevel[]>;
    getAreaItemLevel(areaItemId: number, level: number): Promise<AreaItemLevel>;
    getAreaItemNextLevel(areaItem: AreaItem, areaItemLevel?: AreaItemLevel): Promise<AreaItemLevel>;
    getShopItem(areaItemLevel: AreaItemLevel): Promise<ShopItem>;
}

interface Card {
    id: number;
    seq: number;
    characterId: number;
    cardRarityType: string;
    specialTrainingPower1BonusFixed: number;
    specialTrainingPower2BonusFixed: number;
    specialTrainingPower3BonusFixed: number;
    attr: string;
    supportUnit: string;
    skillId: number;
    cardSkillName: string;
    specialTrainingSkillId?: number;
    specialTrainingSkillName?: string;
    prefix: string;
    assetbundleName: string;
    gachaPhrase: string;
    flavorText: string;
    releaseAt: number;
    cardParameters: Array<{
        id: number;
        cardId: number;
        cardLevel: number;
        cardParameterType: string;
        power: number;
    }>;
    specialTrainingCosts: Array<{
        cardId: number;
        seq: number;
        cost: CommonResource;
    }>;
    masterLessonAchieveResources: {
        releaseConditionId: number;
        cardId: number;
        masterRank: number;
        resources: CommonResource[];
    };
}

interface UserCard {
    userId: number;
    cardId: number;
    level: number;
    exp?: number;
    totalExp: number;
    skillLevel: number;
    skillExp: number;
    totalSkillExp: number;
    masterRank: number;
    specialTrainingStatus: string;
    defaultImage: string;
    duplicateCount: number;
    createdAt: number;
    episodes?: Array<{
        cardEpisodeId: number;
        scenarioStatus: string;
        scenarioStatusReasons: string[];
        isNotSkipped: boolean;
    }>;
}

interface WorldBloomDifferentAttributeBonus {
    attributeCount: number;
    bonusRate: number;
}

interface CustomBonusRule {
    unit: string;
    supportUnit?: string;
    attr?: string;
    characterId?: number;
    bonusRate: number;
}
interface CustomBonusConfig {
    rules: CustomBonusRule[];
}

declare class EventService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getEventType(eventId: number): Promise<EventType>;
    getEventConfig(eventId: number, specialCharacterId?: number): Promise<EventConfig>;
    getEventBonusUnit(eventId: number): Promise<string | undefined>;
    getWorldBloomDifferentAttributeBonuses(): Promise<WorldBloomDifferentAttributeBonus[]>;
    getEventCardBonusCountLimit(eventId: number): Promise<number>;
    getEventSkillScoreUpLimit(eventId: number): Promise<number>;
    getMysekaiFixtureLimit(eventId: number): Promise<number>;
    getWorldBloomType(eventId: number): Promise<string | undefined>;
    getWorldBloomSupportUnit(specialCharacterId?: number): Promise<string | undefined>;
    static isWorldBloomFinale(worldBloomType?: string): boolean;
    static getWorldBloomEventTurn(eventId: number): 1 | 2 | 3;
}
declare enum EventType {
    NONE = "none",
    MARATHON = "marathon",
    CHEERFUL = "cheerful_carnival",
    BLOOM = "world_bloom"
}
interface EventConfig {
    eventId?: number;
    eventType?: EventType;
    eventUnit?: string;
    specialCharacterId?: number;
    cardBonusCountLimit?: number;
    skillScoreUpLimit?: number;
    mysekaiFixtureLimit?: number;
    worldBloomDifferentAttributeBonuses?: WorldBloomDifferentAttributeBonus[];
    worldBloomType?: string;
    worldBloomEventTurn?: 1 | 2 | 3;
    worldBloomSupportUnit?: string;
    customBonuses?: CustomBonusConfig;
}

interface MysekaiGateBonus {
    unit: string;
    powerBonusRate: number;
}

declare class CardDetailMap<T> {
    private min;
    private max;
    private readonly values;
    protected set(unit: string, unitMember: number, attrMember: number, cmpValue: number, value: T): void;
    setPublic(unit: string, unitMember: number, attrMember: number, cmpValue: number, value: T): void;
    protected updateMinMax(cmpValue: number): void;
    getInternal(unit: string, unitMember: number, attrMember: number): T | undefined;
    protected static getKey(unit: string, unitMember: number, attrMember: number): string;
    getMax(): number;
    getMin(): number;
    isCertainlyLessThen(another: CardDetailMap<T>): boolean;
}

declare enum SkillReferenceChooseStrategy {
    Max = "max",
    Min = "min",
    Average = "average"
}
declare class DeckCalculator {
    private readonly dataProvider;
    private readonly cardCalculator;
    private readonly eventCalculator;
    constructor(dataProvider: DataProvider);
    getHonorBonusPower(): Promise<number>;
    static getDeckDetailByCards(cardDetails: CardDetail[], allCards: CardDetail[], honorBonus: number, cardBonusCountLimit?: number, worldBloomDifferentAttributeBonuses?: WorldBloomDifferentAttributeBonus[], skillReferenceChooseStrategy?: SkillReferenceChooseStrategy, keepAfterTrainingState?: boolean, bestSkillAsLeader?: boolean, worldBloomEventTurn?: 1 | 2 | 3): DeckDetail;
    private static computeDefaultDeck;
    private static sumPower;
    getDeckDetail(deckCards: UserCard[], allCards: UserCard[], eventConfig?: EventConfig, areaItemLevels?: AreaItemLevel[]): Promise<DeckDetail>;
}
interface DeckDetail {
    power: DeckPowerDetail;
    eventBonus?: number;
    supportDeckBonus?: number;
    cards: DeckCardDetail[];
    multiLiveScoreUp: number;
}
interface DeckCardDetail {
    cardId: number;
    level: number;
    skillLevel: number;
    masterRank: number;
    power: DeckCardPowerDetail;
    eventBonus?: string;
    skill: DeckCardSkillDetail;
    defaultImage?: string;
}
interface DeckPowerDetail {
    base: number;
    areaItemBonus: number;
    characterBonus: number;
    honorBonus: number;
    fixtureBonus: number;
    gateBonus: number;
    total: number;
}
interface DeckCardPowerDetail {
    base: number;
    areaItemBonus: number;
    characterBonus: number;
    fixtureBonus: number;
    gateBonus: number;
    total: number;
}
interface DeckCardSkillDetail {
    scoreUp: number;
    lifeRecovery: number;
    isPreTrainingSkill?: boolean;
}

declare class CardDetailMapPower extends CardDetailMap<DeckCardPowerDetail> {
    setPower(unit: string, sameUnit: boolean, sameAttr: boolean, value: DeckCardPowerDetail): void;
    getPower(unit: string, unitMember: number, attrMember: number): DeckCardPowerDetail;
}

declare class CardSkillCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getCardSkill(userCard: UserCard, card: Card, scoreUpLimit?: number): Promise<CardDetailMapSkill>;
    private getSkillDetail;
    private getSkill;
    private getCharacterRank;
}
interface DeckCardSkillDetailPrepare {
    skillId: number;
    isAfterTraining: boolean;
    scoreUpFixed: number;
    scoreUpToReference: number;
    lifeRecovery: number;
    hasScoreUpReference?: boolean;
    scoreUpReferenceRate?: number;
    scoreUpReferenceMax?: number;
}

declare class CardDetailMapSkill extends CardDetailMap<DeckCardSkillDetailPrepare> {
    private readonly preTrainingMap;
    private _hasPreTraining;
    get hasPreTraining(): boolean;
    setSkill(unit: string, unitMember: number, attrMember: number, cmpValue: number, value: DeckCardSkillDetailPrepare): void;
    setPreTrainingSkill(unit: string, unitMember: number, attrMember: number, cmpValue: number, value: DeckCardSkillDetailPrepare): void;
    getSkill(unit: string, unitMember: number): DeckCardSkillDetailPrepare;
    getPreTrainingSkill(unit: string, unitMember: number): DeckCardSkillDetailPrepare;
    private static resolveSkill;
}

declare class CardEventCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    private getEventDeckBonus;
    getCardEventBonus(userCard: UserCard, eventId: number): Promise<CardDetailMapEventBonus>;
    private getCardLeaderBonus;
}
interface CardEventBonusDetail {
    fixedBonus: number;
    cardBonus: number;
    leaderBonus: number;
}

declare class CardDetailMapEventBonus extends CardDetailMap<CardEventBonusDetail> {
    private bonus?;
    setBonus(value: CardEventBonusDetail): void;
    getBonus(): CardEventBonusDetail;
    getBonusForDisplay(leader: boolean): string;
    getMaxBonus(leader: boolean): number;
}

declare class CardCalculator {
    private readonly dataProvider;
    private readonly powerCalculator;
    private readonly skillCalculator;
    private readonly eventCalculator;
    private readonly bloomEventCalculator;
    private readonly areaItemService;
    private readonly cardService;
    private readonly mysekaiService;
    constructor(dataProvider: DataProvider);
    getCardDetail(userCard: UserCard, userAreaItemLevels: AreaItemLevel[], config: Record<string, CardConfig> | undefined, eventConfig: EventConfig | undefined, hasCanvasBonus: boolean, userGateBonuses: MysekaiGateBonus[], singleCardConfig?: Record<number, CardConfig>): Promise<CardDetail | undefined>;
    batchGetCardDetail(userCards: UserCard[], config?: Record<string, CardConfig>, eventConfig?: EventConfig, areaItemLevels?: AreaItemLevel[], singleCardConfig?: Record<number, CardConfig>): Promise<CardDetail[]>;
    static isCertainlyLessThan(cardDetail0: CardDetail, cardDetail1: CardDetail): boolean;
}
interface CardDetail {
    cardId: number;
    level: number;
    skillLevel: number;
    masterRank: number;
    cardRarityType: string;
    characterId: number;
    units: string[];
    attr: string;
    power: CardDetailMapPower;
    skill: CardDetailMapSkill;
    eventBonus?: CardDetailMapEventBonus;
    supportDeckBonus?: number;
    hasCanvasBonus: boolean;
    defaultImage: string;
}
interface CardConfig {
    disable?: boolean;
    rankMax?: boolean;
    episodeRead?: boolean;
    masterMax?: boolean;
    skillMax?: boolean;
    canvas?: boolean;
}

declare class CardService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getCardUnits(card: Card): Promise<string[]>;
    applyCardConfig(userCard: UserCard, card: Card, { rankMax, episodeRead, masterMax, skillMax }?: CardConfig): Promise<UserCard>;
}

interface UserDeck {
    userId: number;
    deckId: number;
    name: string;
    leader: number;
    subLeader: number;
    member1: number;
    member2: number;
    member3: number;
    member4: number;
    member5: number;
}

interface UserChallengeLiveSoloDeck {
    characterId: number;
    leader: number | null;
    support1: number | null;
    support2: number | null;
    support3: number | null;
    support4: number | null;
}

interface UserWorldBloomSupportDeck {
    gameCharacterId: number;
    eventId: number;
    member1: number;
    member2: number;
    member3: number;
    member4: number;
    member5: number;
    member6: number;
    member7: number;
    member8: number;
    member9: number;
    member10: number;
    member11: number;
    member12: number;
    member13: number;
    member14: number;
    member15: number;
    member16: number;
    member17: number;
    member18: number;
    member19: number;
    member20: number;
    member21?: number;
    member22?: number;
    member23?: number;
    member24?: number;
    member25?: number;
}

declare class DeckService {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getUserCard(cardId: number): Promise<UserCard>;
    getDeck(deckId: number): Promise<UserDeck>;
    getDeckCards(userDeck: UserDeck): Promise<UserCard[]>;
    static toUserDeck(userCards: DeckCardDetail[], userId?: number, deckId?: number, name?: string): UserDeck;
    getChallengeLiveSoloDeck(characterId: number): Promise<UserChallengeLiveSoloDeck>;
    getChallengeLiveSoloDeckCards(deck: UserChallengeLiveSoloDeck): Promise<UserCard[]>;
    static toUserChallengeLiveSoloDeck(userCards: DeckCardDetail[], characterId: number): UserChallengeLiveSoloDeck;
    static toUserWorldBloomSupportDeck(userCards: CardDetail[], eventId: number, gameCharacterId: number): UserWorldBloomSupportDeck;
}

declare class CardPowerCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    getCardPower(userCard: UserCard, card: Card, cardUnits: string[], userAreaItemLevels: AreaItemLevel[], hasCanvasBonus: boolean, userGateBonuses: MysekaiGateBonus[], mysekaiFixtureLimit?: number): Promise<CardDetailMapPower>;
    private getPower;
    private getCardBasePowers;
    private getAreaItemBonusPower;
    private getCharacterBonusPower;
    private getFixtureBonusPower;
    private getGateBonusPower;
    private static sumPower;
}

declare class CardCustomBonusCalculator {
    static getCustomBonusRate(card: Card, customBonuses: CustomBonusConfig): number;
    private static normalizeUnitName;
    private static matchRule;
    private static getUnitByCharacterId;
    static applyCustomBonus(existingBonus: CardDetailMapEventBonus | undefined, card: Card, customBonuses: CustomBonusConfig): CardDetailMapEventBonus | undefined;
}

interface GAConfig {
    seed?: number;
    maxIter?: number;
    maxIterNoImprove?: number;
    popSize?: number;
    parentSize?: number;
    eliteSize?: number;
    crossoverRate?: number;
    baseMutationRate?: number;
    noImproveIterToMutationRate?: number;
    timeoutMs?: number;
    target?: string;
}
declare function findBestCardsGA(cardDetails: CardDetail[], allCards: CardDetail[], scoreFunc: ScoreFunction, musicMeta: MusicMeta, limit?: number, isChallengeLive?: boolean, member?: number, honorBonus?: number, eventConfig?: EventConfig, gaConfig?: GAConfig, skillReferenceChooseStrategy?: SkillReferenceChooseStrategy, keepAfterTrainingState?: boolean, bestSkillAsLeader?: boolean, leaderCharacter?: number, fixedCharacters?: number[], fixedCards?: CardDetail[]): RecommendDeck[];

declare enum RecommendAlgorithm {
    DFS = "dfs",
    GA = "ga"
}
declare enum RecommendTarget {
    Score = "score",
    Power = "power",
    Skill = "skill",
    Bonus = "bonus",
    Mysekai = "mysekai"
}
declare class BaseDeckRecommend {
    private readonly dataProvider;
    private readonly cardCalculator;
    private readonly deckCalculator;
    private readonly areaItemService;
    constructor(dataProvider: DataProvider);
    private static findBestCardsDFS;
    private static calcDeckHash;
    recommendHighScoreDeck(userCards: UserCard[], scoreFunc: ScoreFunction, { musicMeta, limit, member, leaderCharacter, fixedCards: configFixedCards, fixedCharacters: configFixedCharacters, cardConfig, debugLog, algorithm, gaConfig, timeoutMs, target, skillReferenceChooseStrategy, keepAfterTrainingState, bestSkillAsLeader, filterOtherUnit }: DeckRecommendConfig, liveType: LiveType, eventConfig?: EventConfig): Promise<RecommendDeck[]>;
}
type ScoreFunction = (musicMeta: MusicMeta, deckDetail: DeckDetail) => number;
interface RecommendDeck extends DeckDetail {
    score: number;
}
interface DeckRecommendConfig {
    musicMeta: MusicMeta;
    limit?: number;
    member?: number;
    leaderCharacter?: number;
    fixedCards?: number[];
    fixedCharacters?: number[];
    cardConfig?: Record<string, CardConfig>;
    debugLog?: (str: string) => void;
    algorithm?: RecommendAlgorithm;
    gaConfig?: GAConfig;
    timeoutMs?: number;
    target?: RecommendTarget;
    skillReferenceChooseStrategy?: SkillReferenceChooseStrategy;
    keepAfterTrainingState?: boolean;
    bestSkillAsLeader?: boolean;
    filterOtherUnit?: boolean;
}

declare class LiveCalculator {
    private readonly dataProvider;
    private readonly deckCalculator;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    getMusicMeta(musicId: number, musicDiff: string): Promise<MusicMeta>;
    private static getBaseScore;
    private static getSkillScore;
    private static getSortedSkillDetails;
    private static getSortedSkillRate;
    static getLiveDetailByDeck(deckDetail: DeckDetail, musicMeta: MusicMeta, liveType: LiveType, skillDetails?: DeckCardSkillDetail[] | undefined, multiPowerSum?: number): LiveDetail;
    static getMultiActiveBonus(powerSum: number): number;
    private static getMultiLiveSkill;
    private static getSoloLiveSkill;
    getLiveDetail(deckCards: UserCard[], musicMeta: MusicMeta, liveType: LiveType, liveSkills?: LiveSkill[] | undefined, eventId?: number): Promise<LiveDetail>;
    static getLiveScoreByDeck(deckDetail: DeckDetail, musicMeta: MusicMeta, liveType: LiveType): number;
    static getLiveScoreFunction(liveType: LiveType): ScoreFunction;
}
interface LiveDetail {
    score: number;
    time: number;
    life: number;
    tap: number;
    deck?: DeckDetail;
}
interface LiveSkill {
    seq?: number;
    cardId: number;
}
declare enum LiveType {
    SOLO = "solo",
    AUTO = "auto",
    CHALLENGE = "challenge",
    MULTI = "multi",
    CHEERFUL = "cheerful"
}

declare class EventCalculator {
    private readonly dataProvider;
    private readonly cardEventCalculator;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    getDeckEventBonus(deckCards: UserCard[], eventId: number): Promise<number>;
    static getEventPoint(liveType: LiveType, eventType: EventType, selfScore: number, musicRate?: number, deckBonus?: number, boostRate?: number, otherScore?: number, life?: number): number;
    static getDeckBonus(deckCards: Array<{
        attr: string;
        eventBonus?: CardDetailMapEventBonus;
    }>, cardBonusCountLimit?: number, worldBloomDifferentAttributeBonuses?: WorldBloomDifferentAttributeBonus[]): number | undefined;
    static getSupportDeckBonus(deckCards: Array<{
        cardId: number;
    }>, allCards: CardDetail[], supportDeckCount?: number): {
        bonus: number;
        cards: CardDetail[];
    };
    static getWorldBloomSupportDeckCount(worldBloomEventTurn?: 1 | 2 | 3): number;
    static getDeckEventPoint(deckDetail: DeckDetail, musicMeta: MusicMeta, liveType: LiveType, eventType: EventType): number;
    static getEventPointFunction(liveType: LiveType, eventType: EventType): ScoreFunction;
}

interface MusicScore {
    notes: MusicNote[];
    skills: MusicNoteBase[];
    fevers: MusicNoteBase[];
}
interface MusicNoteBase {
    time: number;
}
interface MusicNote extends MusicNoteBase {
    type: number;
    longId?: number;
}

declare class LiveExactCalculator {
    private readonly dataProvider;
    constructor(dataProvider: DataProvider);
    calculate(power: number, skills: number[], liveType: LiveType, musicScore: MusicScore, multiSumPower?: number, feverMusicScore?: MusicScore): Promise<LiveExactDetail>;
    private static getSkillDetails;
    private static getFeverDetail;
}
interface LiveExactDetail {
    total: number;
    activeBonus: number;
    notes: LiveNoteDetail[];
}
interface LiveNoteDetail {
    noteCoefficient: number;
    comboCoefficient: number;
    judgeCoefficient: number;
    effectBonuses: number[];
    score: number;
}

interface Area {
    id: number;
    assetbundleName: string;
    areaType: string;
    viewType: string;
    name: string;
    releaseConditionId: number;
}

declare class AreaItemRecommend {
    private readonly dataProvider;
    private readonly areaItemService;
    private readonly deckCalculator;
    constructor(dataProvider: DataProvider);
    private static findCost;
    private getRecommendAreaItem;
    recommendAreaItem(userCards: UserCard[]): Promise<RecommendAreaItem[]>;
}
interface RecommendAreaItem {
    area: Area;
    areaItem: AreaItem;
    areaItemLevel: AreaItemLevel;
    shopItem: ShopItem;
    cost: {
        coin: number;
        seed: number;
        szk: number;
    };
    power: number;
}

declare class BloomSupportDeckRecommend {
    private readonly dataProvider;
    private readonly cardCalculator;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    recommendBloomSupportDeck(mainDeck: Array<{
        cardId: number;
    }>, eventId: number, specialCharacterId: number): Promise<CardDetail[]>;
}

declare class ChallengeLiveDeckRecommend {
    private readonly dataProvider;
    private readonly baseRecommend;
    constructor(dataProvider: DataProvider);
    recommendChallengeLiveDeck(characterId: number, config: DeckRecommendConfig): Promise<RecommendDeck[]>;
}

declare class EventDeckRecommend {
    private readonly dataProvider;
    private readonly baseRecommend;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    recommendEventDeck(eventId: number, liveType: LiveType, config: DeckRecommendConfig, specialCharacterId?: number): Promise<RecommendDeck[]>;
}

declare class EventBonusDeckRecommend {
    private readonly dataProvider;
    private readonly cardCalculator;
    private readonly deckCalculator;
    private readonly areaItemService;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    recommendEventBonusDeck(eventId: number, targetBonus: number, liveType: LiveType, config: EventBonusDeckRecommendConfig, specialCharacterId?: number, maxBonus?: number): Promise<RecommendDeck[]>;
    private findBonusDeckNonWL;
    private findBonusDeckWL;
}
interface EventBonusDeckRecommendConfig {
    musicMeta: MusicMeta;
    member?: number;
    cardConfig?: Record<string, CardConfig>;
    specificBonuses?: number[];
    debugLog?: (str: string) => void;
    timeoutMs?: number;
    filterOtherUnit?: boolean;
}

declare class MysekaiDeckRecommend {
    private readonly dataProvider;
    private readonly baseRecommend;
    private readonly eventService;
    constructor(dataProvider: DataProvider);
    recommendMysekaiDeck(eventId: number, config: DeckRecommendConfig, specialCharacterId?: number): Promise<RecommendDeck[]>;
}

declare class MusicRecommend {
    private readonly dataProvider;
    private readonly deckCalculator;
    constructor(dataProvider: DataProvider);
    private getRecommendMusic;
    recommendMusic(deck: DeckDetail, liveType: LiveType, eventType?: EventType): Promise<RecommendMusic[]>;
}
interface RecommendMusic {
    musicId: number;
    difficulty: string;
    liveScore: Map<LiveType, number>;
    eventPoint: Map<LiveType, number>;
}

interface MysekaiScore {
    mysekaiEventPoint: number;
    mysekaiInternalPoint: number;
}
declare class MysekaiEventCalculator {
    static getDeckMysekaiEventPoint(deckDetail: DeckDetail): MysekaiScore;
    static getMysekaiEventPointFunction(): ScoreFunction;
}

interface CardEpisode {
    id: number;
    seq: number;
    cardId: number;
    title: string;
    scenarioId: string;
    assetbundleName: string;
    releaseConditionId: number;
    power1BonusFixed: number;
    power2BonusFixed: number;
    power3BonusFixed: number;
    rewardResourceBoxIds: number[];
    costs: CommonResource[];
    cardEpisodePartType: string;
}

interface CardRarity {
    cardRarityType: string;
    seq: number;
    maxLevel: number;
    trainingMaxLevel?: number;
    maxSkillLevel: number;
}

interface CharacterRank {
    id: number;
    characterId: number;
    characterRank: number;
    power1BonusRate: number;
    power2BonusRate: number;
    power3BonusRate: number;
    rewardResourceBoxIds: number[];
    characterRankAchieveResources: Array<{
        releaseConditionId: number;
        characterId: number;
        characterRank: number;
        resources: CommonResource[];
    }>;
}

interface Event {
    id: number;
    eventType: string;
    name: string;
    assetbundleName: string;
    bgmAssetbundleName: string;
    startAt: any;
    aggregateAt: any;
    rankingAnnounceAt: any;
    distributionStartAt: any;
    closedAt: any;
    distributionEndAt: any;
    virtualLiveId: number;
    eventRankingRewardRanges: Array<{
        id: number;
        eventId: number;
        fromRank: number;
        toRank: number;
        eventRankingRewards: Array<{
            id: number;
            eventRankingRewardRangeId: number;
            resourceBoxId: number;
        }>;
    }>;
}

interface EventCard {
    id: number;
    cardId: number;
    eventId: number;
    bonusRate: number;
    leaderBonusRate: number;
    isDisplayCardStory: boolean;
}

interface EventDeckBonus {
    id: number;
    eventId: number;
    gameCharacterUnitId?: number;
    cardAttr?: string;
    bonusRate: number;
}

interface EventExchange {
    id: number;
    resourceBoxId: number;
    exchangeLimit: number;
    eventExchangeCost: {
        id: number;
        eventExchangeId: number;
        resourceType: string;
        resourceId: number;
        resourceQuantity: number;
    };
}

interface EventItem {
    id: number;
    eventId: number;
    gameCharacterId?: number;
    name: string;
    flavorText: string;
    assetbundleName?: string;
}

interface EventRarityBonusRate {
    id: number;
    cardRarityType: string;
    masterRank: number;
    bonusRate: number;
}

interface GameCharacter {
    id: number;
    seq: number;
    resourceId: number;
    firstName?: string;
    givenName: string;
    firstNameRuby?: string;
    givenNameRuby: string;
    gender: string;
    height: number;
    live2dHeightAdjustment: number;
    figure: string;
    breastSize: string;
    modelName: string;
    unit: string;
    supportUnitType: string;
}

interface GameCharacterUnit {
    id: number;
    gameCharacterId: number;
    unit: string;
    colorCode: string;
    skinColorCode: string;
    skinShadowColorCode1: string;
    skinShadowColorCode2: string;
}

interface Honor {
    id: number;
    seq: number;
    groupId: number;
    honorRarity: string;
    name: string;
    assetbundleName: string;
    levels: Array<{
        honorId: number;
        level: number;
        bonus: number;
        description: string;
    }>;
}

interface MasterLesson {
    cardRarityType: string;
    masterRank: number;
    power1BonusFixed: number;
    power2BonusFixed: number;
    power3BonusFixed: number;
    characterRankExp: number;
    costs: CommonResource[];
    rewards: CommonResource[];
}

interface Music {
    id: number;
    seq: number;
    releaseConditionId: number;
    categories: string[];
    title: string;
    pronunciation: string;
    creator: string;
    lyricist: string;
    composer: string;
    arranger: string;
    dancerCount: number;
    selfDancerPosition: number;
    assetbundleName: string;
    liveTalkBackgroundAssetbundleName: string;
    publishedAt: number;
    liveStageId: number;
    fillerSec: number;
}

interface MusicDifficulty {
    id: number;
    musicId: number;
    musicDifficulty: string;
    playLevel: number;
    releaseConditionId: number;
    totalNoteCount: number;
}

interface MusicVocal {
    id: number;
    musicId: number;
    musicVocalType: string;
    seq: number;
    releaseConditionId: number;
    caption: string;
    characters: Array<{
        id: number;
        musicId: number;
        musicVocalId: number;
        characterType: string;
        characterId: number;
        seq: number;
    }>;
    assetbundleName: string;
    archivePublishedAt: number;
}

interface Skill {
    id: number;
    shortDescription: string;
    description: string;
    descriptionSpriteName: string;
    skillFilterId: number;
    skillEffects: Array<{
        id: number;
        skillEffectType: string;
        activateNotesJudgmentType: string;
        activateCharacterRank?: number;
        activateUnitCount?: number;
        conditionType?: string;
        skillEffectDetails: Array<{
            id: number;
            level: number;
            activateEffectDuration: number;
            activateEffectValueType: string;
            activateEffectValue: number;
            activateEffectValue2?: number;
        }>;
        skillEnhance?: {
            id: number;
            skillEnhanceType: string;
            activateEffectValueType: string;
            activateEffectValue: number;
            skillEnhanceCondition: {
                id: number;
                seq: number;
                unit: string;
            };
        };
    }>;
}

interface WorldBloom {
    id: number;
    eventId: number;
    gameCharacterId: number;
    worldBloomChapterType: string;
    chapterNo: number;
    chapterStartAt: number;
    aggregateAt: number;
    chapterEndAt: number;
    isSupplemental: boolean;
}

interface WorldBloomSupportDeckBonus {
    cardRarityType: string;
    worldBloomSupportDeckCharacterBonuses: Array<{
        id: number;
        worldBloomSupportDeckCharacterType: string;
        bonusRate: number;
    }>;
    worldBloomSupportDeckMasterRankBonuses: Array<{
        id: number;
        masterRank: number;
        bonusRate: number;
    }>;
    worldBloomSupportDeckSkillLevelBonuses: Array<{
        id: number;
        skillLevel: number;
        bonusRate: number;
    }>;
}

interface User {
    userRegistration: {
        userId: number;
        signature: string;
        platform: string;
        deviceModel: string;
        operatingSystem: string;
        yearOfBirth: number;
        monthOfBirth: number;
        dayOfBirth: number;
        age: number;
        billableLimitAgeType: string;
        registeredAt: number;
    };
    userGamedata: {
        userId: number;
        name: string;
        deck: number;
        customProfileId: number;
        rank: number;
        exp: number;
        totalExp: number;
        coin: number;
        virtualCoin: number;
        lastLoginAt: number;
        chargedCurrency: {
            paid: number;
            free: number;
            paidUnitPrices: Array<{
                remaining: number;
                unitPrice: number;
            }>;
        };
        boost: {
            current: number;
            recoveryAt: number;
        };
    };
}

interface UserArea {
    areaId: number;
    actionSets: Array<{
        id: number;
        status: string;
    }>;
    areaItems: Array<{
        areaItemId: number;
        level: number;
    }>;
    userAreaStatus: {
        areaId: number;
        status: string;
    };
}

interface UserCharacter {
    characterId: number;
    characterRank: number;
}

interface UserHonor {
    honorId: number;
    level: number;
}

export { Area, AreaItem, AreaItemLevel, AreaItemRecommend, AreaItemService, BaseDeckRecommend, BloomSupportDeckRecommend, CachedDataProvider, Card, CardCalculator, CardConfig, CardCustomBonusCalculator, CardDetail, CardEpisode, CardEventBonusDetail, CardEventCalculator, CardPowerCalculator, CardRarity, CardService, CardSkillCalculator, ChallengeLiveDeckRecommend, CharacterRank, CustomBonusConfig, CustomBonusRule, DataProvider, DeckCalculator, DeckCardDetail, DeckCardPowerDetail, DeckCardSkillDetail, DeckCardSkillDetailPrepare, DeckDetail, DeckPowerDetail, DeckRecommendConfig, DeckService, Event, EventBonusDeckRecommend, EventBonusDeckRecommendConfig, EventCalculator, EventCard, EventConfig, EventDeckBonus, EventDeckRecommend, EventExchange, EventItem, EventRarityBonusRate, EventService, EventType, GAConfig, GameCharacter, GameCharacterUnit, Honor, LiveCalculator, LiveDetail, LiveExactCalculator, LiveExactDetail, LiveNoteDetail, LiveSkill, LiveType, MasterLesson, Music, MusicDifficulty, MusicMeta, MusicRecommend, MusicVocal, MysekaiDeckRecommend, MysekaiEventCalculator, MysekaiScore, RecommendAlgorithm, RecommendAreaItem, RecommendDeck, RecommendTarget, ScoreFunction, ShopItem, Skill, SkillReferenceChooseStrategy, User, UserArea, UserCard, UserChallengeLiveSoloDeck, UserCharacter, UserDeck, UserHonor, UserWorldBloomSupportDeck, WorldBloom, WorldBloomDifferentAttributeBonus, WorldBloomSupportDeckBonus, findBestCardsGA };
