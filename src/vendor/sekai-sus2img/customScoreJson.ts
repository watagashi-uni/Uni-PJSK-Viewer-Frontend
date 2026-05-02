// @ts-nocheck
import { Fraction } from './fraction'
import {
    Directional,
    DirectionalType,
    Event,
    Score,
    Slide,
    SlideType,
    Tap,
    TapType,
} from './model'

const DEFAULT_TICKS_PER_BEAT = 480
const DEFAULT_BEATS_PER_MEASURE = 4

const toNumber = (value: unknown, fallback = 0): number => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
}

const noteLane = (note: Record<string, unknown>): number => toNumber(note.laneStart) + 2

const noteWidth = (note: Record<string, unknown>): number =>
    Math.max(1, toNumber(note.laneEnd) - toNumber(note.laneStart) + 1)

type TickToBar = (ticks: unknown) => Fraction

const noteBar = (note: Record<string, unknown>, tickToBar: TickToBar): Fraction =>
    tickToBar(note.ticks)

const timeSignatureToBeatLength = (value: unknown): number => {
    if (typeof value === 'string') {
        const match = value.trim().match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
        if (match) {
            const numerator = Number(match[1])
            const denominator = Number(match[2])
            if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
                return (numerator * 4) / denominator
            }
        }
    }

    return toNumber(value, DEFAULT_BEATS_PER_MEASURE)
}

const timeSignatureToTickLength = (value: unknown, ticksPerBeat: number): number =>
    Math.max(1, Math.round(timeSignatureToBeatLength(value) * ticksPerBeat))

const createTickToBarMapper = (
    events: Array<Record<string, unknown>>,
    ticksPerBeat: number,
): TickToBar => {
    const defaultTickLength = ticksPerBeat * DEFAULT_BEATS_PER_MEASURE
    const signatureEvents = events
        .filter((event) => Number(event.eventType) === 3)
        .sort((a, b) => toNumber(a.ticks) - toNumber(b.ticks) || toNumber(a.id) - toNumber(b.id))

    const segments: Array<{ tick: number; bar: Fraction; tickLength: number }> = [
        { tick: 0, bar: new Fraction(0), tickLength: defaultTickLength },
    ]

    let currentTick = 0
    let currentBar = new Fraction(0)
    let currentTickLength = defaultTickLength

    for (const event of signatureEvents) {
        const tick = Math.round(toNumber(event.ticks))
        if (tick < currentTick) continue

        currentBar = currentBar.add(new Fraction(tick - currentTick, currentTickLength))
        currentTick = tick
        currentTickLength = timeSignatureToTickLength(event.changeValue, ticksPerBeat)

        const last = segments[segments.length - 1]
        if (last && last.tick === tick) {
            last.bar = currentBar
            last.tickLength = currentTickLength
        } else {
            segments.push({ tick, bar: currentBar, tickLength: currentTickLength })
        }
    }

    return (ticks: unknown): Fraction => {
        const tick = Math.round(toNumber(ticks))
        let low = 0
        let high = segments.length - 1
        let index = 0
        while (low <= high) {
            const mid = Math.floor((low + high) / 2)
            if (segments[mid].tick <= tick) {
                index = mid
                low = mid + 1
            } else {
                high = mid - 1
            }
        }

        const segment = segments[index]
        return segment.bar.add(new Fraction(tick - segment.tick, segment.tickLength))
    }
}

const noteSlotKey = (note: Record<string, unknown>): string =>
    `${Math.round(toNumber(note.ticks))}:${noteLane(note)}:${noteWidth(note)}`

const tapSlotKey = (note: Record<string, unknown>): string =>
    `${Math.round(toNumber(note.ticks))}:${noteLane(note)}`

const directionToDirectional = (direction: unknown): number => {
    if (Number(direction) === 1) return DirectionalType.UPPER_LEFT
    if (Number(direction) === 2) return DirectionalType.UPPER_RIGHT
    return DirectionalType.UP
}

const lineTypeToDirectional = (lineType: unknown): number => {
    if (Number(lineType) === 1) return DirectionalType.LOWER_LEFT
    if (Number(lineType) === 2) return DirectionalType.DOWN
    return 0
}

const tapTypeFromJson = (note: Record<string, unknown>, fallback = TapType.TAP): number => {
    const base = Number(note.noteBaseType)
    if (base === 11) return note.type ? TapType.CRITICAL_TREND : TapType.TREND
    if (base === 8) return note.type ? TapType.CRITICAL : TapType.TAP
    if (base === 9 || base === 12) return note.type ? TapType.CRITICAL_CANCEL : TapType.CANCEL
    if (base === 4) return note.type ? TapType.CRITICAL_TREND : TapType.TREND
    if (base === 3) return note.type ? TapType.CRITICAL : TapType.TAP
    if (base === 1 || base === 2) return note.type ? TapType.CRITICAL : TapType.TAP
    return fallback
}

const downgradeCriticalTapType = (tapType: number): number => {
    if (tapType === TapType.CRITICAL) return TapType.TAP
    if (tapType === TapType.CRITICAL_TREND) return TapType.TREND
    if (tapType === TapType.CRITICAL_CANCEL) return TapType.CANCEL
    return tapType
}

const upgradeCriticalTapType = (tapType: number): number => {
    if (tapType === TapType.TAP) return TapType.CRITICAL
    if (tapType === TapType.TREND) return TapType.CRITICAL_TREND
    if (tapType === TapType.CANCEL) return TapType.CRITICAL_CANCEL
    return tapType
}

const isVisibleRelaySlideNote = (note: Record<string, unknown>): boolean =>
    Number(note.noteBaseType) === 5 || Number(note.category) === 2

const chainHasCurveLine = (chain: Array<Record<string, unknown>>): boolean =>
    chain.some((note) => Number(note.noteLineType || 0) !== 0)

const shouldVisibleRelayAffectPath = (
    note: Record<string, unknown>,
): boolean => {
    if (!isVisibleRelaySlideNote(note)) return false
    return note.isSkip === false
}

const isVisibleRelayAttachment = (
    note: Record<string, unknown>,
): boolean => isVisibleRelaySlideNote(note) && !shouldVisibleRelayAffectPath(note)

const isDecorationSlideNote = (note: Record<string, unknown>): boolean => {
    const base = Number(note.noteBaseType)
    return Number(note.category) === 9 || base === 10 || base === 13
}

const makeTap = (
    note: Record<string, unknown>,
    tickToBar: TickToBar,
    type: number,
    laneNote: Record<string, unknown> = note,
): Tap =>
    new Tap({
        bar: noteBar(note, tickToBar),
        lane: noteLane(laneNote),
        width: noteWidth(laneNote),
        type,
    })

const makeDirectional = (
    note: Record<string, unknown>,
    tickToBar: TickToBar,
    type: number,
    laneNote: Record<string, unknown> = note,
    tap: Tap | null = null,
): Directional =>
    new Directional({
        bar: noteBar(note, tickToBar),
        lane: noteLane(laneNote),
        width: noteWidth(laneNote),
        type,
        tap,
    })

const getSlideType = (note: Record<string, unknown>, isLast: boolean): number => {
    const base = Number(note.noteBaseType)
    if (isLast) return SlideType.END
    if (base === 2 || base === 8 || base === 9 || base === 10) return SlideType.START
    if (base === 1 || base === 3 || base === 11 || base === 12 || base === 13) return SlideType.END
    if (base === 6 || base === 14 || Number(note.category) === 11) return SlideType.INVISIBLE
    if (base === 5) return SlideType.RELAY
    return SlideType.RELAY
}

const buildChains = (notes: Array<Record<string, unknown>>) => {
    const byId = new Map(notes.map((note) => [note.id, note]))
    const visited = new Set()
    const chains: Array<Array<Record<string, unknown>>> = []

    for (const note of notes) {
        if (visited.has(note.id)) continue
        if (note.nextConnectionId === -1 && note.previousConnectionId === -1) continue
        if (note.previousConnectionId !== -1) continue

        const chain: Array<Record<string, unknown>> = []
        let current = note
        while (current && !visited.has(current.id)) {
            chain.push(current)
            visited.add(current.id)
            current = current.nextConnectionId === -1 ? null : byId.get(current.nextConnectionId)
        }
        if (chain.length) chains.push(chain)
    }

    for (const note of notes) {
        if (!visited.has(note.id) && (note.nextConnectionId !== -1 || note.previousConnectionId !== -1)) {
            chains.push([note])
            visited.add(note.id)
        }
    }

    return { chains, connectedIds: visited }
}

const isHiddenHeadSlideChain = (
    chain: Array<Record<string, unknown>>,
    standaloneTapSlots: Set<string>,
): boolean => {
    const first = chain[0]
    const last = chain[chain.length - 1]
    if (!first || !last) return false

    return (
        Number(first.noteBaseType) === 9 &&
        Number(last.noteBaseType) === 12 &&
        Number(last.category) === 5 &&
        standaloneTapSlots.has(noteSlotKey(first))
    )
}

const isDecorationSlideChain = (
    chain: Array<Record<string, unknown>>,
): boolean => chain.some(isDecorationSlideNote)

const connectedNoteAddsTap = (
    note: Record<string, unknown>,
    slideType: number,
    visibleRelayAsAttachment: boolean,
): boolean => {
    const base = Number(note.noteBaseType)
    return (
        (slideType === SlideType.RELAY && visibleRelayAsAttachment && isVisibleRelaySlideNote(note)) ||
        base === 3 ||
        Number(note.category) === 3 ||
        base === 8 ||
        base === 11 ||
        base === 9 ||
        base === 12 ||
        (note.type && (base === 1 || base === 2))
    )
}

const standaloneTapType = (
    note: Record<string, unknown>,
    connectedSlideSlots: Set<string>,
    _criticalSlideSlots: Set<string>,
    hiddenHeadSlideSlots: Set<string>,
): number => {
    const tapType = tapTypeFromJson(note)
    if (tapType === TapType.TREND || tapType === TapType.CRITICAL_TREND) return tapType
    if (hiddenHeadSlideSlots.has(noteSlotKey(note))) return tapType
    if (connectedSlideSlots.has(noteSlotKey(note))) return downgradeCriticalTapType(tapType)
    return tapType
}

const withVisibleRelayAttachmentSlot = (
    note: Record<string, unknown>,
    occupiedTapSlots: Set<string>,
): Record<string, unknown> => {
    if (!occupiedTapSlots.has(tapSlotKey(note))) {
        occupiedTapSlots.add(tapSlotKey(note))
        return note
    }

    const width = noteWidth(note)
    const maxLaneStart = Math.max(0, 12 - width)
    const candidates = Array.from({ length: maxLaneStart + 1 }, (_, laneStart) => laneStart)
    candidates.sort((a, b) => Math.abs(a - Number(note.laneStart)) - Math.abs(b - Number(note.laneStart)))
    const laneStart = candidates.find((candidate) => !occupiedTapSlots.has(`${Math.round(toNumber(note.ticks))}:${candidate + 2}`))
    if (laneStart === undefined) return note

    const placed = { ...note, laneStart, laneEnd: laneStart + width - 1 }
    occupiedTapSlots.add(tapSlotKey(placed))
    return placed
}

const reserveTapSlot = (occupiedTapSlots: Set<string>, note: Record<string, unknown>) => {
    occupiedTapSlots.add(tapSlotKey(note))
}

const addStandaloneNote = (
    score: Score,
    note: Record<string, unknown>,
    tickToBar: TickToBar,
    connectedSlideSlots: Set<string>,
    criticalSlideSlots: Set<string>,
    hiddenHeadSlideSlots: Set<string>,
) => {
    if (Number(note.noteBaseType) === 3 || Number(note.category) === 3) {
        const tap = makeTap(
            note,
            tickToBar,
            standaloneTapType(note, connectedSlideSlots, criticalSlideSlots, hiddenHeadSlideSlots),
        )
        score.notes.push(makeDirectional(note, tickToBar, directionToDirectional(note.direction), note, tap))
        return
    }

    if (Number(note.noteBaseType) === 4 || Number(note.category) === 8) {
        const tapType = tapTypeFromJson(note)
        const tap = makeTap(note, tickToBar, tapType)
        if (Number(note.direction) === 1 || Number(note.direction) === 2 || tapType === TapType.TREND || tapType === TapType.CRITICAL_TREND) {
            score.notes.push(makeDirectional(note, tickToBar, directionToDirectional(note.direction), note, tap))
        } else {
            score.notes.push(tap)
        }
        return
    }

    score.notes.push(
        makeTap(
            note,
            tickToBar,
            standaloneTapType(note, connectedSlideSlots, criticalSlideSlots, hiddenHeadSlideSlots),
        ),
    )
}

const attachConnectedNote = (
    slide: Slide,
    note: Record<string, unknown>,
    outputNote: Record<string, unknown>,
    chain: Array<Record<string, unknown>>,
    tickToBar: TickToBar,
    isHiddenHeadStart: boolean,
    deferredCriticalTaps: Array<Record<string, unknown>>,
    criticalSlideSlots: Set<string>,
) => {
    const base = Number(note.noteBaseType)

    if (slide.decoration && note.type && (base === 10 || base === 13)) {
        slide.tap = makeTap(note, tickToBar, TapType.CRITICAL_CANCEL, outputNote)
        deferredCriticalTaps.push(outputNote)
        criticalSlideSlots.add(noteSlotKey(outputNote))
    } else if (isHiddenHeadStart && (base === 9 || base === 12)) {
        slide.tap = makeTap(note, tickToBar, note.type ? TapType.CRITICAL_CANCEL : TapType.CANCEL, outputNote)
    } else if (slide.type === SlideType.RELAY && isVisibleRelayAttachment(note)) {
        slide.tap = makeTap(note, tickToBar, TapType.FLICK, outputNote)
    } else if (base === 3 || Number(note.category) === 3) {
        const tap = note.type ? makeTap(note, tickToBar, TapType.CRITICAL, outputNote) : null
        slide.directional = makeDirectional(note, tickToBar, directionToDirectional(note.direction), outputNote, tap)
        if (tap) slide.tap = tap
    } else if (base === 8 || base === 11 || base === 9 || base === 12) {
        slide.tap = makeTap(note, tickToBar, tapTypeFromJson(note), outputNote)
    } else if (note.type && (base === 1 || base === 2)) {
        slide.tap = makeTap(note, tickToBar, TapType.CRITICAL, outputNote)
    }

    const directionalType = lineTypeToDirectional(note.noteLineType)
    if (directionalType) {
        slide.directional = makeDirectional(note, tickToBar, directionalType, outputNote, slide.tap)
    }
}

const removeAdjacentVisibleRelayDuplicates = (
    chain: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> => {
    const filtered: Array<Record<string, unknown>> = []
    for (let index = 0; index < chain.length; index += 1) {
        const note = chain[index]
        const next = chain[index + 1]
        if (
            next &&
            isVisibleRelaySlideNote(note) &&
            isVisibleRelaySlideNote(next) &&
            Math.abs(toNumber(next.ticks) - toNumber(note.ticks)) <= 1
        ) {
            continue
        }
        filtered.push(note)
    }
    return filtered
}

export interface CustomScoreJsonRenderInputMeta {
    title?: string
    artist?: string
    author?: string
    difficulty?: string
    playlevel?: string
    songId?: string | number
    ticksPerBeat?: number
}

export const scoreFromCustomScoreJson = (
    scoreJson: unknown,
    meta: CustomScoreJsonRenderInputMeta = {},
): Score => {
    const rawScore = typeof scoreJson === 'string' ? JSON.parse(scoreJson) : scoreJson
    const ticksPerBeat = Number(meta.ticksPerBeat ?? DEFAULT_TICKS_PER_BEAT)
    const score = new Score()
    score.ticksPerBeat = ticksPerBeat

    score.meta.title = meta.title ?? ''
    score.meta.artist = meta.artist ?? ''
    score.meta.designer = meta.author ?? ''
    score.meta.difficulty = meta.difficulty ?? ''
    score.meta.playlevel = meta.playlevel ?? ''
    score.meta.songid = String(meta.songId ?? rawScore?.MusicId ?? '')

    const events = [...(rawScore?.MusicScoreEventDataList || [])].sort(
        (a, b) => toNumber(a.ticks) - toNumber(b.ticks) || toNumber(a.eventType) - toNumber(b.eventType),
    )
    const tickToBar = createTickToBarMapper(events, ticksPerBeat)
    for (const event of events) {
        const bar = tickToBar(event.ticks)
        if (Number(event.eventType) === 0) {
            score.events.push(new Event({ bar, bpm: toNumber(event.changeValue, 120) }))
        } else if (Number(event.eventType) === 3) {
            score.events.push(new Event({ bar, barLength: timeSignatureToBeatLength(event.changeValue) }))
        }
    }

    const notes = [...(rawScore?.NoteList || [])].sort(
        (a, b) => toNumber(a.ticks) - toNumber(b.ticks) || toNumber(a.laneStart) - toNumber(b.laneStart) || toNumber(a.id) - toNumber(b.id),
    )
    const { chains, connectedIds } = buildChains(notes)
    const connectedSlideSlots = new Set<string>()
    const criticalSlideSlots = new Set<string>()
    const hiddenHeadSlideSlots = new Set<string>()
    const standaloneTapSlots = new Set<string>()
    const occupiedTapSlots = new Set<string>()

    for (const chain of chains) {
        for (const note of chain) connectedSlideSlots.add(noteSlotKey(note))
    }

    for (const rawChain of chains) {
        const chain = removeAdjacentVisibleRelayDuplicates(rawChain)
        const visibleRelayAsAttachment = chainHasCurveLine(chain)
        for (let index = 0; index < chain.length; index += 1) {
            const note = chain[index]
            const slideType = getSlideType(note, index === chain.length - 1)
            if (
                !isVisibleRelayAttachment(note) &&
                connectedNoteAddsTap(note, slideType, visibleRelayAsAttachment)
            ) {
                reserveTapSlot(occupiedTapSlots, note)
            }
        }
    }

    for (const note of notes) {
        if (!connectedIds.has(note.id)) {
            reserveTapSlot(occupiedTapSlots, note)
            standaloneTapSlots.add(noteSlotKey(note))
        }
    }

    for (const chain of chains) {
        if (isHiddenHeadSlideChain(chain, standaloneTapSlots)) {
            hiddenHeadSlideSlots.add(noteSlotKey(chain[0]))
        }
    }

    const channelAvailableAt = new Array(36).fill(Number.NEGATIVE_INFINITY)
    for (const rawChain of chains) {
        const chain = removeAdjacentVisibleRelayDuplicates(rawChain)
        const startTick = toNumber(chain[0]?.ticks)
        const endTick = toNumber(chain[chain.length - 1]?.ticks, startTick)
        let channel = channelAvailableAt.findIndex((availableAt) => availableAt < startTick)
        if (channel === -1) {
            channel = channelAvailableAt.reduce(
                (best, availableAt, index) => (availableAt < channelAvailableAt[best] ? index : best),
                0,
            )
        }
        channelAvailableAt[channel] = Math.max(channelAvailableAt[channel], endTick)

        const chainDecoration = isDecorationSlideChain(chain)
        const visibleRelayAsAttachment = chainHasCurveLine(chain)
        const isHiddenHead = isHiddenHeadSlideChain(chain, standaloneTapSlots)
        let previousSlide: Slide | null = null
        let headSlide: Slide | null = null
        const deferredCriticalTaps: Array<Record<string, unknown>> = []

        for (let index = 0; index < chain.length; index += 1) {
            const note = chain[index]
            const base = Number(note.noteBaseType)
            const decoration = chainDecoration || isDecorationSlideNote(note)
            const slideType = getSlideType(note, index === chain.length - 1)
            const outputNote =
                slideType === SlideType.RELAY && isVisibleRelayAttachment(note)
                    ? withVisibleRelayAttachmentSlot(note, occupiedTapSlots)
                    : note
            const slide = new Slide({
                bar: noteBar(note, tickToBar),
                lane: noteLane(outputNote),
                width: noteWidth(outputNote),
                type: slideType,
                channel,
                decoration,
            })

            if (!headSlide) headSlide = slide
            slide.head = headSlide
            if (previousSlide) {
                previousSlide.next = slide
            }

            attachConnectedNote(
                slide,
                note,
                outputNote,
                chain,
                tickToBar,
                isHiddenHead && index === 0 && (base === 9 || base === 12),
                deferredCriticalTaps,
                criticalSlideSlots,
            )

            score.notes.push(slide)
            previousSlide = slide
        }

        for (const note of deferredCriticalTaps) {
            if (!standaloneTapSlots.has(noteSlotKey(note))) {
                score.notes.push(makeTap(note, tickToBar, TapType.CRITICAL_CANCEL))
            }
        }
    }

    for (const note of notes) {
        if (!connectedIds.has(note.id)) {
            addStandaloneNote(
                score,
                note,
                tickToBar,
                connectedSlideSlots,
                criticalSlideSlots,
                hiddenHeadSlideSlots,
            )
        }
    }

    score.sortNotes()
    score.initEvents()
    return score
}
