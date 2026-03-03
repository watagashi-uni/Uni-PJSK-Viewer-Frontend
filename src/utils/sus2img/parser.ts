// @ts-nocheck
import { Fraction } from './fraction'
import {
    Directional,
    Event,
    Meta,
    Score,
    Slide,
    Tap,
} from './model'

type SpeedDefinitionItem = {
    bar: number
    tick: number
    speed: number
}

type ParsedItem =
    | { kind: 'meta'; value: Meta }
    | { kind: 'ticksPerBeat'; value: number }
    | { kind: 'speedControl'; value: number | null }
    | { kind: 'speedDefinition'; id: number; items: SpeedDefinitionItem[] }
    | { kind: 'event'; value: Event }
    | { kind: 'bpmDefinition'; id: number; bpm: Fraction }
    | { kind: 'bpmReference'; bar: Fraction; id: number }
    | { kind: 'note'; value: Tap | Directional | Slide }

type ParsedLine = {
    type: 'meta' | 'score' | 'comment'
    header: string
    data: string
}

const metaKeys = new Set<string>([
    'title',
    'subtitle',
    'artist',
    'genre',
    'designer',
    'difficulty',
    'playlevel',
    'songid',
    'wave',
    'waveoffset',
    'jacket',
    'background',
    'movie',
    'movieoffset',
    'basebpm',
])

const parseLine = (line: string): ParsedLine => {
    const trimmed = line.trim()

    let match = trimmed.match(/^#(\w+)\s+(.*)$/)
    if (match) {
        return {
            type: 'meta',
            header: match[1],
            data: match[2],
        }
    }

    match = trimmed.match(/^#(\w+):\s*(.*)$/)
    if (match) {
        return {
            type: 'score',
            header: match[1],
            data: match[2],
        }
    }

    return {
        type: 'comment',
        header: 'comment',
        data: trimmed,
    }
}

const maybeUnquote = (value: string): string => {
    const trimmed = value.trim()
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1)
    }
    return trimmed
}

const parseMetaValue = (value: string): string | number => {
    const trimmed = value.trim()
    if (!trimmed.length) {
        return ''
    }

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1)
    }

    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
        return Number(trimmed)
    }

    return trimmed
}

const parseScoreData = (data: string): Array<{ beat: Fraction; pair: string }> => {
    const cleaned = data.trim()
    const result: Array<{ beat: Fraction; pair: string }> = []

    for (let i = 0; i + 1 < cleaned.length; i += 2) {
        const pair = cleaned.slice(i, i + 2)
        if (pair !== '00') {
            result.push({
                beat: new Fraction(i, cleaned.length),
                pair,
            })
        }
    }

    return result
}

const parseMetaItems = (header: string, data: string): ParsedItem[] => {
    const items: ParsedItem[] = []

    const meta = new Meta()
    const key = header.toLowerCase()
    if (metaKeys.has(key)) {
        ;(meta as unknown as Record<string, unknown>)[key] = parseMetaValue(data)
        items.push({ kind: 'meta', value: meta })
        return items
    }

    if (header === 'REQUEST') {
        const match = data.match(/^"ticks_per_beat\s+(\d+)"$/)
        if (match) {
            items.push({
                kind: 'ticksPerBeat',
                value: Number(match[1]),
            })
        }
        return items
    }

    if (header === 'HISPEED') {
        const id = Number.parseInt(data, 36)
        if (Number.isFinite(id)) {
            items.push({ kind: 'speedControl', value: id })
        }
        return items
    }

    if (header === 'NOSPEED') {
        items.push({ kind: 'speedControl', value: null })
    }

    return items
}

const parseScoreItems = (header: string, data: string): ParsedItem[] => {
    const items: ParsedItem[] = []

    let match = header.match(/^(\d\d\d)02$/)
    if (match) {
        items.push({
            kind: 'event',
            value: new Event({
                bar: Number(match[1]),
                barLength: Number(data.trim()),
            }),
        })
        return items
    }

    match = header.match(/^BPM(..)$/)
    if (match) {
        items.push({
            kind: 'bpmDefinition',
            id: Number.parseInt(match[1], 36),
            bpm: new Fraction(data.trim()),
        })
        return items
    }

    match = header.match(/^(\d\d\d)08$/)
    if (match) {
        const bar = Number(match[1])
        for (const { beat, pair } of parseScoreData(data)) {
            items.push({
                kind: 'bpmReference',
                bar: new Fraction(bar).add(beat),
                id: Number.parseInt(pair, 36),
            })
        }
        return items
    }

    match = header.match(/^TIL(..)$/)
    if (match) {
        const id = Number.parseInt(match[1], 36)
        const text = maybeUnquote(data)
        const list: SpeedDefinitionItem[] = []

        if (text.length) {
            for (const rawSegment of text.split(',')) {
                const segment = rawSegment.trim()
                if (!segment.length) {
                    continue
                }

                const m = segment.match(/(\d+)'(\d+):(\S+)/)
                if (!m) {
                    continue
                }

                list.push({
                    bar: Number(m[1]),
                    tick: Number(m[2]),
                    speed: Number(m[3]),
                })
            }
        }

        list.sort((a, b) => (a.bar === b.bar ? a.tick - b.tick : a.bar - b.bar))

        items.push({
            kind: 'speedDefinition',
            id,
            items: list,
        })
        return items
    }

    match = header.match(/^(\d\d\d)1(.)$/)
    if (match) {
        const bar = Number(match[1])
        const lane = Number.parseInt(match[2], 36)
        for (const { beat, pair } of parseScoreData(data)) {
            items.push({
                kind: 'note',
                value: new Tap({
                    bar: new Fraction(bar).add(beat),
                    lane,
                    width: Number.parseInt(pair[1], 36),
                    type: Number.parseInt(pair[0], 36),
                }),
            })
        }
        return items
    }

    match = header.match(/^(\d\d\d)3(.)(.)$/)
    if (match) {
        const bar = Number(match[1])
        const lane = Number.parseInt(match[2], 36)
        const channel = Number.parseInt(match[3], 36)
        for (const { beat, pair } of parseScoreData(data)) {
            items.push({
                kind: 'note',
                value: new Slide({
                    bar: new Fraction(bar).add(beat),
                    lane,
                    width: Number.parseInt(pair[1], 36),
                    type: Number.parseInt(pair[0], 36),
                    channel,
                    decoration: false,
                }),
            })
        }
        return items
    }

    match = header.match(/^(\d\d\d)5(.)$/)
    if (match) {
        const bar = Number(match[1])
        const lane = Number.parseInt(match[2], 36)
        for (const { beat, pair } of parseScoreData(data)) {
            items.push({
                kind: 'note',
                value: new Directional({
                    bar: new Fraction(bar).add(beat),
                    lane,
                    width: Number.parseInt(pair[1], 36),
                    type: Number.parseInt(pair[0], 36),
                }),
            })
        }
        return items
    }

    match = header.match(/^(\d\d\d)9(.)(.)$/)
    if (match) {
        const bar = Number(match[1])
        const lane = Number.parseInt(match[2], 36)
        const channel = Number.parseInt(match[3], 36)
        for (const { beat, pair } of parseScoreData(data)) {
            items.push({
                kind: 'note',
                value: new Slide({
                    bar: new Fraction(bar).add(beat),
                    lane,
                    width: Number.parseInt(pair[1], 36),
                    type: Number.parseInt(pair[0], 36),
                    channel,
                    decoration: true,
                }),
            })
        }
        return items
    }

    return items
}

export const parseSusText = (content: string): Score => {
    const score = new Score()

    const bpmDefinitions = new Map<number, Fraction>()
    let speedControl: number | null = null

    const lines = content.split(/\r?\n/u).map(parseLine)

    for (const line of lines) {
        const parsedItems =
            line.type === 'meta'
                ? parseMetaItems(line.header, line.data)
                : line.type === 'score'
                  ? parseScoreItems(line.header, line.data)
                  : []

        for (const parsedItem of parsedItems) {
            switch (parsedItem.kind) {
                case 'meta':
                    score.meta = score.meta.merge(parsedItem.value)
                    break

                case 'ticksPerBeat':
                    score.ticksPerBeat = parsedItem.value
                    break

                case 'speedControl':
                    speedControl = parsedItem.value
                    break

                case 'speedDefinition':
                    if (speedControl === null || speedControl === parsedItem.id) {
                        for (const item of parsedItem.items) {
                            const bar = new Fraction(item.bar).add(
                                new Fraction(item.tick, score.ticksPerBeat * 4),
                            )
                            score.events.push(
                                new Event({
                                    bar,
                                    speed: item.speed,
                                }),
                            )
                        }
                    }
                    break

                case 'event':
                    score.events.push(parsedItem.value)
                    break

                case 'bpmDefinition':
                    bpmDefinitions.set(parsedItem.id, parsedItem.bpm)
                    break

                case 'bpmReference': {
                    const bpm = bpmDefinitions.get(parsedItem.id)
                    if (bpm) {
                        score.events.push(
                            new Event({
                                bar: parsedItem.bar,
                                bpm,
                            }),
                        )
                    }
                    break
                }

                case 'note':
                    score.notes.push(parsedItem.value)
                    break
            }
        }
    }

    score.initNotes()
    score.initEvents()

    return score
}
