import {
  CachedDataProvider as Cached33DataProvider,
  ChallengeLiveDeckRecommend as Challenge33LiveDeckRecommend,
  EventDeckRecommend as Event33DeckRecommend,
  LiveCalculator as Live33Calculator,
} from 'sekai-calculator'
import {
  CachedDataProvider as CachedMoesekaiDataProvider,
  ChallengeLiveDeckRecommend as ChallengeMoesekaiLiveDeckRecommend,
  EventDeckRecommend as EventMoesekaiDeckRecommend,
  LiveCalculator as LiveMoesekaiCalculator,
  LiveType as MoesekaiLiveType,
} from 'moesekai-calculator'
import { WorkerProxyDataProvider } from './dataProvider'

type DeckRecommendEngine = '33' | 'moesekai'

// 全局 DataProvider 实例，用于处理响应
let globalDataProvider: WorkerProxyDataProvider | null = null

addEventListener('message', (event: MessageEvent) => {
  const data = event.data

  if (data.type === 'responseMaster' || data.type === 'responseUserData') {
    if (globalDataProvider) {
      globalDataProvider.handleResponse(data.requestId, data.data, data.error)
    }
    return
  }

  if (data.args) {
    deckRecommendRunner(data.args)
      .then((result) => { postMessage({ type: 'result', result }) })
      .catch((err) => { postMessage({ type: 'error', error: err.message || err.toString() }) })
  }
})

function parseMoesekaiLiveType(liveType?: string, eventType?: string): MoesekaiLiveType {
  if (liveType === 'solo') return MoesekaiLiveType.SOLO
  if (liveType === 'auto') return MoesekaiLiveType.AUTO
  if (liveType === 'multi' && eventType === 'cheerful_carnival') return MoesekaiLiveType.CHEERFUL
  return MoesekaiLiveType.MULTI
}

async function getChallengeHighScore(
  dataProvider: Cached33DataProvider | CachedMoesekaiDataProvider,
  gameCharacterId?: number,
) {
  let challengeHighScore = 0
  if (!gameCharacterId) return challengeHighScore

  try {
    const userData = await dataProvider.getUserData<any[]>('userChallengeLiveSoloResults')
    if (userData) {
      const charResult = userData.find((r: any) => r.characterId === gameCharacterId)
      if (charResult) challengeHighScore = charResult.highScore || 0
    }
  } catch {
    // ignore
  }

  return challengeHighScore
}

async function deckRecommendRunner(args: any) {
  const {
    mode, userId, music, difficulty, gameCharacter,
    cardConfig, event0, liveType, supportCharacter,
    engine = '33',
  }: {
    mode: '1' | '2'
    userId: string
    music: { id: number }
    difficulty: string
    gameCharacter?: { id: number }
    cardConfig: Record<string, unknown>
    event0?: { id: number, eventType?: string }
    liveType?: string
    supportCharacter?: { id: number }
    engine?: DeckRecommendEngine
  } = args

  globalDataProvider = new WorkerProxyDataProvider(
    (msg) => postMessage(msg),
    userId,
  )

  if (engine === 'moesekai') {
    return await runMoesekaiRecommend({
      mode,
      music,
      difficulty,
      gameCharacter,
      cardConfig,
      event0,
      liveType,
      supportCharacter,
    })
  }

  return await run33Recommend({
    mode,
    music,
    difficulty,
    gameCharacter,
    cardConfig,
    event0,
    liveType,
    supportCharacter,
  })
}

async function run33Recommend(args: {
  mode: '1' | '2'
  music: { id: number }
  difficulty: string
  gameCharacter?: { id: number }
  cardConfig: Record<string, unknown>
  event0?: { id: number }
  liveType?: string
  supportCharacter?: { id: number }
}) {
  const { mode, music, difficulty, gameCharacter, cardConfig, event0, liveType, supportCharacter } = args

  const dataProvider = new Cached33DataProvider(globalDataProvider!)
  const startTime = performance.now()

  if (mode === '1') {
    const recommend = new Challenge33LiveDeckRecommend(dataProvider)
    const liveCalc = new Live33Calculator(dataProvider)

    const meta = await liveCalc.getMusicMeta(music.id, difficulty)
    const config = {
      musicMeta: meta,
      cardConfig: cardConfig as any,
      limit: 10,
      debugLog: (str: string) => console.log(str),
    }

    const result = await recommend.recommendChallengeLiveDeck(gameCharacter!.id, config)
    const challengeHighScore = await getChallengeHighScore(dataProvider, gameCharacter?.id)

    const endTime = performance.now()
    const totalDuration = endTime - startTime
    const dataFetchDuration = globalDataProvider!.getDataFetchDuration()
    const computeDuration = Math.max(0, totalDuration - dataFetchDuration)

    return { result, challengeHighScore, duration: computeDuration, dataFetchDuration, totalDuration }
  }

  const recommend = new Event33DeckRecommend(dataProvider)
  const liveCalc = new Live33Calculator(dataProvider)

  const meta = await liveCalc.getMusicMeta(music.id, difficulty)
  const config = {
    musicMeta: meta,
    cardConfig: cardConfig as any,
    limit: 10,
    debugLog: (str: string) => console.log(str),
  }

  const specialCharacterId = supportCharacter?.id
  const result = await recommend.recommendEventDeck(event0!.id, liveType as any, config, specialCharacterId)
  const endTime = performance.now()
  const totalDuration = endTime - startTime
  const dataFetchDuration = globalDataProvider!.getDataFetchDuration()
  const computeDuration = Math.max(0, totalDuration - dataFetchDuration)

  return { result, duration: computeDuration, dataFetchDuration, totalDuration }
}

async function runMoesekaiRecommend(args: {
  mode: '1' | '2'
  music: { id: number }
  difficulty: string
  gameCharacter?: { id: number }
  cardConfig: Record<string, unknown>
  event0?: { id: number, eventType?: string }
  liveType?: string
  supportCharacter?: { id: number }
}) {
  const { mode, music, difficulty, gameCharacter, cardConfig, event0, liveType, supportCharacter } = args

  const dataProvider = new CachedMoesekaiDataProvider(globalDataProvider!)
  const startTime = performance.now()

  if (mode === '1') {
    const recommend = new ChallengeMoesekaiLiveDeckRecommend(dataProvider)
    const liveCalc = new LiveMoesekaiCalculator(dataProvider)

    const meta = await liveCalc.getMusicMeta(music.id, difficulty)
    const config = {
      musicMeta: meta,
      cardConfig: cardConfig as any,
      limit: 10,
      debugLog: (str: string) => console.log(str),
    }

    const result = await recommend.recommendChallengeLiveDeck(gameCharacter!.id, config)
    const challengeHighScore = await getChallengeHighScore(dataProvider, gameCharacter?.id)

    const endTime = performance.now()
    const totalDuration = endTime - startTime
    const dataFetchDuration = globalDataProvider!.getDataFetchDuration()
    const computeDuration = Math.max(0, totalDuration - dataFetchDuration)

    return { result, challengeHighScore, duration: computeDuration, dataFetchDuration, totalDuration }
  }

  const recommend = new EventMoesekaiDeckRecommend(dataProvider)
  const liveCalc = new LiveMoesekaiCalculator(dataProvider)

  const meta = await liveCalc.getMusicMeta(music.id, difficulty)
  const config = {
    musicMeta: meta,
    cardConfig: cardConfig as any,
    limit: 10,
    debugLog: (str: string) => console.log(str),
  }

  const specialCharacterId = supportCharacter?.id ?? 0
  const resolvedLiveType = parseMoesekaiLiveType(liveType, event0?.eventType)
  const result = await recommend.recommendEventDeck(event0!.id, resolvedLiveType, config, specialCharacterId)

  const endTime = performance.now()
  const totalDuration = endTime - startTime
  const dataFetchDuration = globalDataProvider!.getDataFetchDuration()
  const computeDuration = Math.max(0, totalDuration - dataFetchDuration)

  return { result, duration: computeDuration, dataFetchDuration, totalDuration }
}
