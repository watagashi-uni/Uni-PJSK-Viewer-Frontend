import { CachedDataProvider, EventDeckRecommend, ChallengeLiveDeckRecommend, LiveCalculator } from 'sekai-calculator'
import { WorkerProxyDataProvider } from './dataProvider'

// 全局 DataProvider 实例，用于处理响应
let globalDataProvider: WorkerProxyDataProvider | null = null

/**
 * Web Worker: 接收主线程指令
 */
addEventListener('message', (event: MessageEvent) => {
    const data = event.data

    // 1. 处理主线程返回的数据响应
    if (data.type === 'responseMaster' || data.type === 'responseUserData') {
        if (globalDataProvider) {
            globalDataProvider.handleResponse(data.requestId, data.data, data.error)
        }
        return
    }

    // 2. 开始计算任务
    if (data.args) {
        deckRecommendRunner(data.args)
            .then((result) => { postMessage({ type: 'result', result }) })
            .catch((err) => { postMessage({ type: 'error', error: err.message || err.toString() }) })
    }
})

async function deckRecommendRunner(args: any) {
    const {
        mode, userId, music, difficulty, gameCharacter,
        cardConfig, event0, liveType, supportCharacter
    } = args

    // 创建 DataProvider，传入 postMessage 函数
    globalDataProvider = new WorkerProxyDataProvider(
        (msg) => postMessage(msg),
        userId
    )

    // 使用 CachedDataProvider 包装（提供内存缓存，避免重复请求）
    const dataProvider = new CachedDataProvider(globalDataProvider)

    const startTime = performance.now()

    if (mode === '1') {
        // 挑战模式
        const recommend = new ChallengeLiveDeckRecommend(dataProvider)
        const liveCalc = new LiveCalculator(dataProvider)

        const meta = await liveCalc.getMusicMeta(music.id, difficulty)
        const config = {
            musicMeta: meta,
            cardConfig,
            limit: 10,
            debugLog: (str: string) => console.log(str)
        }

        const result = await recommend.recommendChallengeLiveDeck(gameCharacter.id, config)
        const endTime = performance.now()

        // 获取挑战最高分
        let challengeHighScore = 0
        try {
            const userData = await dataProvider.getUserData<any[]>('userChallengeLiveSoloResults')
            if (userData) {
                const charResult = userData.find((r: any) => r.characterId === gameCharacter.id)
                if (charResult) challengeHighScore = charResult.highScore || 0
            }
        } catch { /* ignore */ }

        return { result, challengeHighScore, duration: endTime - startTime }
    } else {
        // 活动模式
        const recommend = new EventDeckRecommend(dataProvider)
        const liveCalc = new LiveCalculator(dataProvider)

        const meta = await liveCalc.getMusicMeta(music.id, difficulty)
        const config = {
            musicMeta: meta,
            cardConfig,
            limit: 10,
            debugLog: (str: string) => console.log(str)
        }

        const specialCharacterId = supportCharacter?.id
        const result = await recommend.recommendEventDeck(event0.id, liveType, config, specialCharacterId)
        const endTime = performance.now()

        return { result, duration: endTime - startTime }
    }
}
