import { Directional, DirectionalType, Slide, SlideType, Tap, TapType, type AnyNote } from './model'

/** iOS 6.7.0, ingameJudgeFrames; see docs/sekai-6.7.0-judgment.md. */
export const JUDGMENT_FPS = 60
export const JUDGMENT_COLORS = {
    perfect: '#b453ff',
    great: '#f59e0b',
    good: '#22c55e',
    bad: '#38bdf8',
} as const
export type JudgmentGrade = keyof typeof JUDGMENT_COLORS
type Thresholds = readonly [number, number, number, number, number, number, number, number]

// P before/after, Great before/after, Good before/after, Bad before/after.
// The old unsuffixed perfect/great/good/bad fields are not read by this client.
export const JUDGMENT_FRAMES = {
    normal: [2.5, 2.5, 5, 5, 6.5, 6.5, 7.5, 7.5],
    normal_critical: [3.299999952316284, 3.299999952316284, 4.5, 4.5, 6.5, 6.5, 7.5, 7.5],
    flick: [2.5, 2.5, 6.5, 7.5, 7, 8, 7.5, 8.5],
    flick_critical: [3.5, 3.5, 6.5, 7.5, 7, 8, 7.5, 8.5],
    long_end: [3.5, 4, 6.5, 8, 7.5, 8.5, 7.5, 8.5],
    friction: [5, 5, 5, 5, 5, 5, 5, 5],
    friction_long_end: [6.5, 8, 6.5, 8, 6.5, 8, 6.5, 8],
    friction_flick: [6.5, 7.5, 6.5, 7.5, 6.5, 7.5, 6.5, 7.5],
} as const satisfies Record<string, Thresholds>

export interface JudgmentBand {
    grade: JudgmentGrade
    /** Input time minus note time, in 1/60 s units. Negative = early. */
    from: number
    to: number
    conditional?: boolean
}

export interface NoteJudgment {
    label: string
    bands: JudgmentBand[]
    explanation: string
    /** Checkpoints test holding at their own time, not a +/- masterdata window. */
    checkpoint?: boolean
}

export function bandsFromThresholds(thresholds: Thresholds): JudgmentBand[] {
    const grades: JudgmentGrade[] = ['perfect', 'great', 'good', 'bad']
    const bands: JudgmentBand[] = []
    let before = 0
    let after = 0
    grades.forEach((grade, i) => {
        const nextBefore = thresholds[i * 2]!
        const nextAfter = thresholds[i * 2 + 1]!
        if (grade === 'perfect') {
            bands.push({ grade, from: -nextBefore, to: nextAfter })
        } else {
            if (nextBefore > before) bands.push({ grade, from: -nextBefore, to: -before })
            if (nextAfter > after) bands.push({ grade, from: after, to: nextAfter })
        }
        before = nextBefore
        after = nextAfter
    })
    return bands
}

const bufferedPerfect = (before: number, after: number): JudgmentBand[] => [
    { grade: 'perfect', from: -before, to: 0, conditional: true },
    { grade: 'perfect', from: 0, to: after },
]

export function getNoteJudgment(note: AnyNote): NoteJudgment | null {
    if (note.isNone() || (note instanceof Directional && note.tap?.isNone()) || (note instanceof Slide && note.decoration)) return null
    if (note instanceof Tap && note.type === TapType.DAMAGE) return null
    const critical = note.isCritical()
    const gold = critical ? '金色 ' : ''
    const trace = note.isTrend()
    const flick = note instanceof Directional || (note instanceof Slide && note.type === SlideType.END && Boolean(note.directional))

    if (note instanceof Slide) {
        if (note.type === SlideType.INVISIBLE) return null
        if (note.type === SlideType.RELAY) {
            return {
                label: `${gold}长条中继点`, bands: [], checkpoint: true,
                explanation: '到点检查持有状态；成功直接 Perfect，失败 Miss。没有独立的四档时间窗。细线只标记检查时刻。',
            }
        }
        if (note.type === SlideType.START && trace) {
            return {
                label: `${gold}Trace 长条起点`,
                bands: [
                    { grade: 'perfect', from: -5, to: 0, conditional: true },
                    { grade: 'perfect', from: 0, to: 7.5, conditional: true },
                ],
                explanation: '提前 5f 内可记录触摸；到点后由下一次更新结算 Perfect。+7.5f 是状态机截止线，不是保证可命中的触摸时刻：下一次更新必须尚未超时，短条还受尾部限制。表中 after=5f 不是起点结算上限。',
            }
        }
        if (note.type === SlideType.END && !flick && trace) {
            return {
                label: `${gold}Trace 长条尾点`, bands: bufferedPerfect(8, 6.5),
                explanation: '直接 Perfect；提前触摸会记录到正拍。该分支把“当前时间 − 音符时间”传入共用门限，实际早侧 8f、晚侧 6.5f（与字段 Before/After 名称相反）。',
            }
        }
        if (note.type === SlideType.END && flick) {
            if (trace) {
                return {
                    label: `${gold}Trace 尾滑`, bands: bufferedPerfect(7.5, 7.5),
                    explanation: '尾滑的输入门限使用 long_end_flick，提前最多 7.5f 可缓存；结算仍使用 friction_flick，晚侧 7.5f。方向正确且滑动距离达标时 Perfect；错向可能 Great，没有独立 Good/Bad 时间带。',
                }
            }
            const late = bandsFromThresholds(JUDGMENT_FRAMES.long_end)
                .filter(band => band.to > 0)
                .map(band => ({ ...band, from: Math.max(0, band.from) }))
            return {
                label: `${gold}长条尾滑`,
                bands: [{ grade: 'perfect', from: -7.5, to: 0, conditional: true }, ...late],
                explanation: '早侧先缓存滑动，到正拍后结算，方向正确时不产生表中的早侧 Great/Good。晚侧按结算时间分档；Good 与 Bad 门限重合，没有 Bad 时间带。错向可降为 Great。',
            }
        }
        if (note.type === SlideType.END) {
            return {
                label: `${gold}长条尾点`, bands: bandsFromThresholds(JUDGMENT_FRAMES.long_end),
                explanation: '按松手时间评分；Good 与 Bad 门限重合，没有独立 Bad 时间带。金色与普通尾点相同。',
            }
        }
    }
    if (flick && trace) {
        return {
            label: `${gold}Trace 滑键`, bands: bufferedPerfect(6.5, 7.5),
            explanation: '早侧缓存滑动，到正拍后结算。方向正确且滑动距离达标时只有 Perfect/Miss；方向错误可得 Great，但没有额外的 Great/Good/Bad 时间带。',
        }
    }
    if (trace) {
        return {
            label: `${gold}Trace`, bands: bufferedPerfect(5, 5),
            explanation: '±5f 内触摸可记录，提前触摸等待正拍；直接结算 Perfect，不运行四档评分。',
        }
    }
    const directional = note instanceof Directional ? note : note instanceof Slide ? note.directional : null
    const directed = directional && directional.type !== DirectionalType.UP
    return {
        label: `${gold}${flick ? '滑键' : note instanceof Slide ? '长条起点' : 'Tap'}`,
        bands: bandsFromThresholds(flick
            ? critical ? JUDGMENT_FRAMES.flick_critical : JUDGMENT_FRAMES.flick
            : critical ? JUDGMENT_FRAMES.normal_critical : JUDGMENT_FRAMES.normal),
        explanation: flick
            ? `按滑动完成时间评分，需要达到滑动距离。${directed ? '方向错误时 Perfect 降为 Great。' : ''}`
            : '按按下时间评分；金色使用独立门限。',
    }
}

