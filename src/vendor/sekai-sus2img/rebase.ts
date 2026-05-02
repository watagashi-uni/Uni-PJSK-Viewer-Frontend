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

export type RebaseEventInput = {
    bar?: number | string
    bpm?: number | string
    barLength?: number | string
    sentenceLength?: number
    section?: string
    text?: string
}

export type RebaseInput = {
    offset?: number
    events?: RebaseEventInput[]
    meta?: Partial<Meta>
}

export type LoadedRebase = {
    offset: number
    events: Event[]
    meta: Meta
}

const loadMeta = (value: Partial<Meta> | undefined): Meta => {
    if (!value) {
        return new Meta()
    }
    return new Meta(value)
}

export const loadRebase = (value: RebaseInput | null | undefined): LoadedRebase => ({
    offset: value?.offset ?? 0,
    events: (value?.events ?? []).map(
        (event) =>
            new Event({
                bar: event.bar ?? 0,
                bpm: event.bpm,
                barLength: event.barLength,
                sentenceLength: event.sentenceLength,
                section: event.section,
                text: event.text,
            }),
    ),
    meta: loadMeta(value?.meta),
})

const rebaseBar = (source: Score, target: Score, bar: Fraction, offset: number): Fraction =>
    target.getBarByTime(source.getTime(bar) - offset)

const rebaseTap = (source: Score, target: Score, note: Tap, offset: number): Tap =>
    note.cloneWithBar(rebaseBar(source, target, note.bar, offset))

const rebaseDirectional = (
    source: Score,
    target: Score,
    note: Directional,
    offset: number,
): Directional => note.cloneWithBar(rebaseBar(source, target, note.bar, offset))

const rebaseSlide = (source: Score, target: Score, note: Slide, offset: number): Slide =>
    note.cloneWithBar(rebaseBar(source, target, note.bar, offset))

export const applyRebase = (source: Score, input: RebaseInput): Score => {
    const rebase = loadRebase(input)

    const score = new Score()
    score.meta = source.meta.merge(rebase.meta)
    score.events = rebase.events.map((event) => event.clone())

    for (const note of source.notes) {
        if (note instanceof Tap) {
            score.notes.push(rebaseTap(source, score, note, rebase.offset))
            continue
        }

        if (note instanceof Directional) {
            score.notes.push(rebaseDirectional(source, score, note, rebase.offset))
            if (note.tap) {
                score.notes.push(rebaseTap(source, score, note.tap, rebase.offset))
            }
            continue
        }

        if (note instanceof Slide) {
            score.notes.push(rebaseSlide(source, score, note, rebase.offset))
            if (note.tap) {
                score.notes.push(rebaseTap(source, score, note.tap, rebase.offset))
            }
            if (note.directional) {
                score.notes.push(rebaseDirectional(source, score, note.directional, rebase.offset))
                if (note.directional.tap && note.directional.tap !== note.tap) {
                    score.notes.push(rebaseTap(source, score, note.directional.tap, rebase.offset))
                }
            }
        }
    }

    score.events = score.events.concat(
        source.events
            .filter((event) => Boolean(event.speed || event.text))
            .map(
                (event) =>
                    new Event({
                        bar: rebaseBar(source, score, event.bar, rebase.offset),
                        bpm: event.bpm,
                        barLength: event.barLength,
                        sentenceLength: event.sentenceLength,
                        speed: event.speed,
                        section: event.section,
                        text: event.text,
                    }),
            ),
    )

    score.notes.sort((a, b) => a.bar.compare(b.bar))
    score.initNotes()
    score.initEvents()

    return score
}
