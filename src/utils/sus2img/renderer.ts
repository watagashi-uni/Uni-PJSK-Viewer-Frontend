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
} from './model'

const DEFAULT_STYLE = `.bar-line {
    stroke: #e2e2e2;
    stroke-width: 4;
}

.bar-count-flag {
    stroke: #ffffff;
    stroke-width: 4;
}

.bar-count-text {
    font-size: 12px;
    font-weight: 900;
    font-family: Avenir;
    fill: #ffffff;
    text-anchor: start;
}

.beat-line {
    stroke: #e2e2e2;
    stroke-width: 1;
}

.lane-line {
    stroke: #e2e2e2;
    stroke-width: 1;
}

.event-flag {
    stroke: #fee300;
    stroke-width: 4;
}

.event-text {
    font-size: 12px;
    font-weight: 900;
    font-family: Avenir;
    fill: #fee300;
    text-anchor: start;
}

.speed-line {
    stroke: #ff33ff;
    stroke-width: 1;
}

.speed-text {
    font-size: 12px;
    font-family: Avenir;
    fill: #ff33ff;
    text-anchor: end;
}

.lyric-text {
    font-size: 12px;
    font-family: \"Hiragino Kaku Gothic Pro\", sans-serif;
    fill: #ffffff;
    text-anchor: start;
}

.slide {
    fill: #c9fce2cc
}

.slide-critical {
    fill: #fcf1c3cc
}

.decoration {
    fill: url(#decoration-gradient);
}

#decoration-gradient {
    --color-start: #c9fce299;
    --color-stop: #c9fce233;
}

.decoration-critical {
    fill: url(#decoration-critical-gradient);
}

#decoration-critical-gradient {
    --color-start: #fcf1c399;
    --color-stop: #fcf1c333;
}

.tick-text {
    font-size: 12px;
    font-family: Avenir;
    fill: #e2e2e2;
    text-anchor: end;
}

.tick-line {
    stroke: #e2e2e2;
    stroke-width: 1;
}

.meta-line {
    stroke: #e2e2e2;
    stroke-width: 2;
}

.title {
    font-size: 96px;
    font-weight: 900;
    font-family: \"Hiragino Kaku Gothic Pro\", sans-serif;
    fill: #ffffff;
    text-anchor: start;
}

.subtitle {
    font-size: 48px;
    font-weight: 700;
    font-family: \"Hiragino Kaku Gothic Pro\", sans-serif;
    fill: #ffffff;
    text-anchor: start;
}

.lane {
    fill: #d5bdef;
}

.background {
    fill: #ab7ed3;
}

.meta {
    fill: #ab7ed3;
}
`

const WHITE_STYLE = `.bar-line {
    stroke: #eeeeee;
    stroke-width: 2;
}

.bar-count-flag {
    stroke: #606060;
    stroke-width: 4;
}

.bar-count-text {
    font-size: 12px;
    font-weight: 900;
    font-family: Avenir;
    fill: #606060;
    text-anchor: start;
}

.beat-line {
    stroke: #eeeeee;
    stroke-width: 1;
}

.lane-line {
    stroke: #ffffff;
    stroke-width: 1;
}

.event-flag {
    stroke: #7f0000;
    stroke-width: 4;
}

.event-text {
    font-size: 12px;
    font-weight: 900;
    font-family: Avenir;
    fill: #808080;
    text-anchor: start;
}

.speed-line {
    stroke: #ff33ff;
    stroke-width: 1;
}

.speed-text {
    font-size: 12px;
    font-family: Avenir;
    fill: #ff33ff;
    text-anchor: end;
}

.lyric-text {
    font-size: 12px;
    font-family: Avenir;
    fill: #606060;
    text-anchor: start;
}

.slide {
    fill: #d9fbeecc
}

.slide-critical {
    fill: #fcfacdcc
}

.decoration {
    fill: url(#decoration-gradient);
}

#decoration-gradient {
    --color-start: #c9fce299;
    --color-stop: #c9fce233;
}

.decoration-critical {
    fill: url(#decoration-critical-gradient);
}

#decoration-critical-gradient {
    --color-start: #fcf1c399;
    --color-stop: #fcf1c333;
}

.tick-text {
    font-size: 12px;
    font-family: Avenir;
    fill: #000000;
    text-anchor: end;
}

.tick-line {
    stroke: #808080;
    stroke-width: 1;
}

.meta-line {
    stroke: #e2e2e2;
    stroke-width: 2;
}

.title {
    font-size: 96px;
    font-weight: 900;
    font-family: Avenir;
    fill: #000000;
    text-anchor: start;
}

.subtitle {
    font-size: 48px;
    font-weight: 700;
    font-family: Avenir;
    fill: #000000;
    text-anchor: start;
}

.lane {
    fill: #cfd8db;
}

.background {
    fill: #FFFFFF;
}

.meta {
    fill: #FFFFFF;
}
`

export interface RenderOptions {
    noteHost: string
    styleSheet?: string
    laneWidth?: number
    lanePadding?: number
    timePadding?: number
    noteSize?: number
    timeHeight?: number
    flickHeight?: number
    slidePathPadding?: number
    metaSize?: number
    tickLength?: number
    tick2Length?: number
    nLanes?: number
}

export interface RenderedSvg {
    svg: string
    width: number
    height: number
}

type Point = [number, number]
type Bezier = [Point, Point, Point, Point]

const escapeXml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

const r = (value: number): number => Math.round(value)

const fmt = (value: number): string => {
    if (Math.abs(value - Math.round(value)) < 1e-6) {
        return `${Math.round(value)}`
    }
    return `${Number(value.toFixed(3))}`
}

const formatBar = (bar: Fraction): string => {
    const n = bar.toNumber()
    if (Math.abs(n - Math.round(n)) < 1e-9) {
        return `${Math.round(n)}`
    }
    return `${Number(n.toFixed(4))}`
}

const fraction = (value: Fraction | number): Fraction => (value instanceof Fraction ? value : new Fraction(value))

const cloneEvent = (event: Event): Event =>
    new Event({
        bar: event.bar,
        bpm: event.bpm,
        barLength: event.barLength,
        sentenceLength: event.sentenceLength,
        speed: event.speed,
        section: event.section,
        text: event.text,
    })

class SentenceRenderer {
    private readonly drawing: DrawingRenderer
    private readonly barStart: number
    private readonly barStop: number

    private slidePaths: string[] = []
    private amongImages: string[] = []
    private noteImages: string[] = []
    private flickImages: string[] = []
    private tickTexts: string[] = []

    constructor(drawing: DrawingRenderer, barStart: number, barStop: number) {
        this.drawing = drawing
        this.barStart = barStart
        this.barStop = barStop
    }

    private get yBaseTop(): number {
        return this.drawing.timePadding
    }

    private getRelativeY(bar: Fraction): number {
        return this.drawing.timeHeight * this.drawing.score.getTimeDelta(bar, new Fraction(this.barStop)) + this.yBaseTop
    }

    private getBezierCoordinates(slide0: Slide, slide1: Slide): [Bezier, Bezier] {
        const y0 = this.getRelativeY(slide0.bar)
        const y1 = this.getRelativeY(slide1.bar)

        const easeIn =
            Boolean(slide0.directional) && slide0.directional?.type === DirectionalType.DOWN
        const easeOut =
            Boolean(slide0.directional) &&
            (slide0.directional?.type === DirectionalType.LOWER_LEFT ||
                slide0.directional?.type === DirectionalType.LOWER_RIGHT)

        const slidePathPadding = slide0.decoration ? 0 : this.drawing.slidePathPadding

        return [
            [
                [this.drawing.laneWidth * (slide0.lane - 2) + this.drawing.lanePadding - slidePathPadding, y0],
                [
                    this.drawing.laneWidth * (slide0.lane - 2) + this.drawing.lanePadding - slidePathPadding,
                    easeIn ? (y0 + y1) / 2 : y0,
                ],
                [
                    this.drawing.laneWidth * (slide1.lane - 2) + this.drawing.lanePadding - slidePathPadding,
                    easeOut ? (y0 + y1) / 2 : y1,
                ],
                [this.drawing.laneWidth * (slide1.lane - 2) + this.drawing.lanePadding - slidePathPadding, y1],
            ],
            [
                [
                    this.drawing.laneWidth * (slide0.lane - 2 + slide0.width) +
                        this.drawing.lanePadding +
                        slidePathPadding,
                    y0,
                ],
                [
                    this.drawing.laneWidth * (slide0.lane - 2 + slide0.width) +
                        this.drawing.lanePadding +
                        slidePathPadding,
                    easeIn ? (y0 + y1) / 2 : y0,
                ],
                [
                    this.drawing.laneWidth * (slide1.lane - 2 + slide1.width) +
                        this.drawing.lanePadding +
                        slidePathPadding,
                    easeOut ? (y0 + y1) / 2 : y1,
                ],
                [
                    this.drawing.laneWidth * (slide1.lane - 2 + slide1.width) +
                        this.drawing.lanePadding +
                        slidePathPadding,
                    y1,
                ],
            ],
        ]
    }

    private binarySolutionForX(y: number, curve: Bezier): number {
        let start = 0
        let end = 1

        for (let i = 0; i < 60; i += 1) {
            const t = (start + end) / 2
            const p = this.bezierPoint(curve, t)
            if (Math.abs(p[1] - y) < 0.1) {
                return p[0]
            }
            if (p[1] > y) {
                start = t
            } else {
                end = t
            }
        }

        return this.bezierPoint(curve, (start + end) / 2)[0]
    }

    private bezierPoint(curve: Bezier, t: number): Point {
        const inv = 1 - t
        const x =
            curve[0][0] * inv ** 3 +
            curve[1][0] * 3 * inv ** 2 * t +
            curve[2][0] * 3 * inv * t ** 2 +
            curve[3][0] * t ** 3
        const y =
            curve[0][1] * inv ** 3 +
            curve[1][1] * 3 * inv ** 2 * t +
            curve[2][1] * 3 * inv * t ** 2 +
            curve[3][1] * t ** 3
        return [x, y]
    }

    private addFrictionAmongImage(note: Tap | Directional | Slide) {
        const y = this.getRelativeY(note.bar)
        const x =
            this.drawing.laneWidth * (note.lane + note.width / 2 - 2) + this.drawing.lanePadding

        const w = this.drawing.laneWidth * 0.75
        const h = this.drawing.laneWidth * 0.75

        const suffix = note.isCritical() ? '_crtcl' : note instanceof Directional ? '_flick' : '_long'

        this.amongImages.push(
            `<image href="${escapeXml(`${this.drawing.noteHost}/notes_friction_among${suffix}.png`)}" x="${fmt(
                r(x - w / 2),
            )}" y="${fmt(r(y - h / 2))}" width="${fmt(r(w))}" height="${fmt(r(h))}" />`,
        )
    }

    private addAmongImage(note: Slide, leftCurve: Bezier, rightCurve: Bezier) {
        const y = this.getRelativeY(note.bar)
        const xl = this.binarySolutionForX(y, leftCurve)
        const xr = this.binarySolutionForX(y, rightCurve)
        const x = (xl + xr) / 2

        const w = this.drawing.laneWidth
        const h = this.drawing.laneWidth

        this.amongImages.push(
            `<image href="${escapeXml(
                `${this.drawing.noteHost}/notes_long_among${note.isCritical() ? '_crtcl' : ''}.png`,
            )}" x="${fmt(r(x - w / 2))}" y="${fmt(r(y - h / 2))}" width="${fmt(r(w))}" height="${fmt(
                r(h),
            )}" />`,
        )
    }

    private addSlidePath(slide: Slide) {
        const lefts: Bezier[] = []
        const rights: Bezier[] = []

        let slide0: Slide | null = slide
        while (slide0 && slide0.type !== SlideType.END) {
            const amongs: Slide[] = []
            let slide1: Slide | null = slide0.next
            while (slide1) {
                if (slide1.type === SlideType.RELAY) {
                    amongs.push(slide1)
                }
                if (slide1.isPath()) {
                    break
                }
                slide1 = slide1.next
            }

            if (!slide1) {
                break
            }

            const [left, right] = this.getBezierCoordinates(slide0, slide1)
            lefts.push(left)
            rights.push(right)

            for (const among of amongs) {
                this.addAmongImage(among, left, right)
            }

            slide0 = slide1
        }

        if (!lefts.length) {
            return
        }

        const commands: string[] = []
        for (let i = 0; i < lefts.length; i += 1) {
            const l = lefts[i]
            if (i === 0) {
                commands.push(`M ${fmt(r(l[0][0]))} ${fmt(r(l[0][1]))}`)
            }
            commands.push(
                `C ${fmt(r(l[1][0]))} ${fmt(r(l[1][1]))} ${fmt(r(l[2][0]))} ${fmt(r(l[2][1]))} ${fmt(
                    r(l[3][0]),
                )} ${fmt(r(l[3][1]))}`,
            )
        }

        for (let i = rights.length - 1; i >= 0; i -= 1) {
            const rr = rights[i]
            if (i === rights.length - 1) {
                commands.push(`L ${fmt(r(rr[3][0]))} ${fmt(r(rr[3][1]))}`)
            }
            commands.push(
                `C ${fmt(r(rr[2][0]))} ${fmt(r(rr[2][1]))} ${fmt(r(rr[1][0]))} ${fmt(r(rr[1][1]))} ${fmt(
                    r(rr[0][0]),
                )} ${fmt(r(rr[0][1]))}`,
            )
        }

        commands.push('Z')

        const className = slide.decoration
            ? slide.isCritical()
                ? 'decoration-critical'
                : 'decoration'
            : slide.isCritical()
              ? 'slide-critical'
              : 'slide'

        this.slidePaths.push(`<path d="${commands.join(' ')}" class="${className}" />`)
    }

    private addNoteImage(note: Tap | Directional | Slide) {
        const y = this.getRelativeY(note.bar)
        const x = this.drawing.laneWidth * (note.lane - 2.5) + this.drawing.lanePadding

        const w = this.drawing.laneWidth * (note.width + 1)
        const h = (this.drawing.laneWidth / 64) * 56 * 2

        let noteNumber = 2

        if (note.isNone()) {
            return
        }

        if (note.isTrend()) {
            this.addFrictionAmongImage(note)
            if (note.isCritical()) {
                noteNumber = 5
            } else if (note instanceof Directional) {
                noteNumber = 6
            } else {
                noteNumber = 4
            }
        } else if (note.isCritical()) {
            noteNumber = 0
        } else if (note instanceof Directional) {
            noteNumber = 3
        } else if (note instanceof Slide) {
            if (note.type === SlideType.END && note.directional) {
                noteNumber = 3
            } else {
                noteNumber = 1
            }
        }

        this.noteImages.push(
            `<use href="#notes-${noteNumber}-${note.width}" x="${fmt(r(x))}" y="${fmt(
                r(y - h / 2),
            )}" width="${fmt(r(w))}" height="${fmt(r(h))}" />`,
        )
    }

    private addFlickImage(note: Directional | Slide) {
        if (note.isNone()) {
            return
        }

        let type: DirectionalType | null = DirectionalType.UP

        if (note instanceof Directional) {
            if (note.type === DirectionalType.UPPER_LEFT) {
                type = DirectionalType.UPPER_LEFT
            } else if (note.type === DirectionalType.UPPER_RIGHT) {
                type = DirectionalType.UPPER_RIGHT
            }
        } else if (note.directional) {
            if (note.directional.type === DirectionalType.UPPER_LEFT) {
                type = DirectionalType.UPPER_LEFT
            } else if (note.directional.type === DirectionalType.UPPER_RIGHT) {
                type = DirectionalType.UPPER_RIGHT
            } else if (note.directional.type === DirectionalType.UP) {
                type = DirectionalType.UP
            } else {
                type = null
            }
        } else {
            type = null
        }

        if (type === null) {
            return
        }

        const width = note.width < 6 ? note.width : 6
        const y = this.getRelativeY(note.bar)

        const h0 = this.drawing.flickHeight
        const h = h0 * ((width + 3) / 3) ** 0.75
        const w = h0 * 1.5 * ((width + 0.5) / 3) ** 0.75
        const x = this.drawing.laneWidth * (note.lane - 2 + note.width / 2) + this.drawing.lanePadding
        const bias =
            type === DirectionalType.UPPER_LEFT
                ? -this.drawing.noteSize / 4
                : type === DirectionalType.UPPER_RIGHT
                  ? this.drawing.noteSize / 4
                  : 0

        const src = `${this.drawing.noteHost}/notes_flick_arrow${note.isCritical() ? '_crtcl' : ''}_0${width}${
            type === DirectionalType.UPPER_LEFT || type === DirectionalType.UPPER_RIGHT ? '_diagonal' : ''
        }.png`

        const transform =
            type === DirectionalType.UPPER_RIGHT
                ? ` transform="translate(${fmt(r((x + bias) * 2))} 0) scale(-1 1)"`
                : ''

        this.flickImages.push(
            `<image href="${escapeXml(src)}" x="${fmt(r(x - w / 2 + bias))}" y="${fmt(
                r(y + this.drawing.noteSize / 4 - h),
            )}" width="${fmt(r(w))}" height="${fmt(r(h))}"${transform} />`,
        )
    }

    private addTickText(note: Tap | Directional | Slide, next: Tap | Directional | Slide | null) {
        const y = this.getRelativeY(note.bar)

        if (next === null) {
            this.tickTexts.push(
                `<line x1="${fmt(r(this.drawing.lanePadding - this.drawing.tick2Length))}" y1="${fmt(
                    r(y),
                )}" x2="${fmt(r(this.drawing.lanePadding))}" y2="${fmt(r(y))}" class="tick-line" />`,
            )
            return
        }

        let interval: Fraction
        const noteBar = note.bar
        const nextBar = next.bar

        if (
            next === note ||
            nextBar.equals(noteBar) ||
            nextBar.sub(noteBar).compare(1) > 0 ||
            (nextBar.sub(noteBar).compare(0.5) > 0 && Math.floor(nextBar.toNumber()) !== Math.floor(noteBar.toNumber()))
        ) {
            interval = new Fraction(Math.floor(noteBar.toNumber() + 1)).sub(noteBar)
        } else {
            interval = nextBar.sub(noteBar)
        }

        interval = interval.mul(this.drawing.score.getEvent(note.bar).barLength ?? new Fraction(4)).div(4)
        interval = interval.limitDenominator(100)

        if (interval.compare(0) === 0) {
            return
        }

        const numerator = Number(interval.numerator)
        const denominator = Number(interval.denominator)
        const text = numerator !== 1 ? `${numerator}/${denominator}` : `/${denominator}`

        this.tickTexts.push(
            `<line x1="${fmt(r(this.drawing.lanePadding - this.drawing.tickLength))}" y1="${fmt(
                r(y),
            )}" x2="${fmt(r(this.drawing.lanePadding))}" y2="${fmt(r(y))}" class="tick-line" />`,
        )
        this.tickTexts.push(
            `<text x="${fmt(r(this.drawing.lanePadding - 4))}" y="${fmt(r(y - 2))}" class="tick-text">${escapeXml(
                text,
            )}</text>`,
        )
    }

    private renderEvents(height: number): string[] {
        const parts: string[] = []

        for (let bar = this.barStart; bar <= this.barStop; bar += 1) {
            parts.push(
                `<line x1="${fmt(r(this.drawing.lanePadding))}" y1="${fmt(
                    r(this.drawing.timeHeight * this.drawing.score.getTimeDelta(bar, this.barStop) + this.drawing.timePadding),
                )}" x2="${fmt(r(this.drawing.laneWidth * this.drawing.nLanes + this.drawing.lanePadding))}" y2="${fmt(
                    r(this.drawing.timeHeight * this.drawing.score.getTimeDelta(bar, this.barStop) + this.drawing.timePadding),
                )}" class="bar-line" />`,
            )

            const event = this.drawing.score.getEvent(bar)
            const eventBarLength = event.barLength ?? new Fraction(4)
            for (let i = 1; i < Math.ceil(eventBarLength.toNumber()); i += 1) {
                const t = this.drawing.score.getTimeDelta(
                    new Fraction(bar).add(new Fraction(i, eventBarLength)),
                    this.barStop,
                )
                const y = this.drawing.timeHeight * t + this.drawing.timePadding
                parts.push(
                    `<line x1="${fmt(r(this.drawing.lanePadding))}" y1="${fmt(r(y))}" x2="${fmt(
                        r(this.drawing.laneWidth * this.drawing.nLanes + this.drawing.lanePadding),
                    )}" y2="${fmt(r(y))}" class="beat-line" />`,
                )
            }
        }

        const printEvents: Event[] = []
        const mergedEvents = [
            ...Array.from({ length: this.barStop - this.barStart + 1 }, (_, i) =>
                new Event({ bar: this.barStart + i }),
            ),
            ...this.drawing.score.events,
        ].sort((a, b) => a.bar.compare(b.bar))

        for (const event of mergedEvents) {
            const eventY =
                this.drawing.timeHeight * this.drawing.score.getTimeDelta(event.bar, this.barStop) +
                this.drawing.timePadding

            if (event.speed) {
                parts.push(
                    `<line x1="${fmt(r(this.drawing.lanePadding))}" y1="${fmt(r(eventY))}" x2="${fmt(
                        r(this.drawing.laneWidth * this.drawing.nLanes + this.drawing.lanePadding),
                    )}" y2="${fmt(r(eventY))}" class="speed-line" />`,
                )
                parts.push(
                    `<text x="${fmt(r(this.drawing.laneWidth * this.drawing.nLanes + this.drawing.lanePadding - 2))}" y="${fmt(
                        r(eventY - 2),
                    )}" class="speed-text">${escapeXml(`${event.speed}x`)}</text>`,
                )
                continue
            }

            const last = printEvents[printEvents.length - 1]
            if (last && event.bar.sub(last.bar).compare(new Fraction(1, 16)) <= 0) {
                printEvents[printEvents.length - 1] = last.merge(event)
            } else {
                printEvents.push(cloneEvent(event))
            }

            const special = Boolean(event.bpm || event.barLength || event.speed || event.section || event.text)
            parts.push(
                `<line x1="${fmt(r(0))}" y1="${fmt(r(eventY))}" x2="${fmt(r(this.drawing.lanePadding))}" y2="${fmt(
                    r(eventY),
                )}" class="${special ? 'event-flag' : 'bar-count-flag'}" />`,
            )
        }

        for (const event of printEvents) {
            if (!(this.barStart - 1 <= event.bar.toNumber() && event.bar.toNumber() < this.barStop + 1)) {
                continue
            }

            const text = [
                Math.abs(event.bar.toNumber() - Math.round(event.bar.toNumber())) < 1e-9
                    ? `#${formatBar(event.bar)}`
                    : null,
                event.bpm ? `${fmt(event.bpm.toNumber())} BPM` : null,
                event.barLength ? `${fmt(event.barLength.toNumber())}/4` : null,
                event.section,
                event.text,
            ]
                .filter((v) => Boolean(v))
                .join(', ')

            if (!text.length) {
                continue
            }

            const special = Boolean(event.bpm || event.barLength || event.speed || event.section || event.text)
            const y =
                this.drawing.timeHeight * this.drawing.score.getTimeDelta(event.bar, this.barStop) +
                this.drawing.timePadding

            parts.push(
                `<text x="${fmt(r(this.drawing.lanePadding + 8))}" y="${fmt(r(y - this.drawing.laneWidth * 1.5))}" transform="rotate(-90 ${fmt(
                    r(this.drawing.lanePadding),
                )} ${fmt(r(y))})" class="${special ? 'event-text' : 'bar-count-text'}">${escapeXml(
                    text,
                )}</text>`,
            )
        }

        return parts
    }

    render(): { content: string; width: number; height: number } {
        for (let i = 0; i < this.drawing.score.notes.length; i += 1) {
            const note = this.drawing.score.notes[i]

            if (note instanceof Slide) {
                let slide: Slide | null = note.head
                let before = false

                while (slide) {
                    while (slide && !slide.isPath()) {
                        slide = slide.next
                    }

                    if (!slide) {
                        break
                    }

                    const bar = slide.bar.toNumber()
                    if (this.barStart - 1 <= bar && bar < this.barStop + 1) {
                        break
                    }
                    if (bar < this.barStart - 1) {
                        before = true
                    } else if (before && this.barStop + 1 < bar) {
                        slide = null
                        break
                    }

                    slide = slide.next
                }

                if (!slide) {
                    continue
                }
            } else {
                const bar = note.bar.toNumber()
                if (!(this.barStart - 1 <= bar && bar < this.barStop + 1)) {
                    continue
                }
            }

            if (note.isTick() !== null) {
                let nextTick: Tap | Directional | Slide | null = null
                if (note.isTick()) {
                    nextTick = note
                    for (let j = i; j < this.drawing.score.notes.length; j += 1) {
                        const candidate = this.drawing.score.notes[j]
                        if (candidate.isTick() && candidate.bar.compare(note.bar) > 0) {
                            nextTick = candidate
                            break
                        }
                    }
                }

                this.addTickText(note, nextTick)
            }

            if (note instanceof Tap) {
                this.addNoteImage(note)
            } else if (note instanceof Directional) {
                this.addFlickImage(note)
                this.addNoteImage(note)
            } else if (!note.decoration) {
                if (note.type === SlideType.START) {
                    this.addSlidePath(note)
                    this.addNoteImage(note)
                } else if (note.type === SlideType.END) {
                    if (note.directional) {
                        this.addFlickImage(note)
                    }
                    this.addNoteImage(note)
                }
            } else {
                if (note.type === SlideType.START) {
                    this.addSlidePath(note)
                }
                if (note.tap) {
                    this.addNoteImage(note.tap)
                    if (note.directional) {
                        this.addFlickImage(note)
                    }
                }
            }
        }

        const height = this.drawing.timeHeight * this.drawing.score.getTimeDelta(this.barStart, this.barStop)

        const parts: string[] = []
        parts.push(
            `<rect x="0" y="0" width="${fmt(r(this.drawing.laneWidth * this.drawing.nLanes + this.drawing.lanePadding * 2))}" height="${fmt(
                r(height + this.drawing.timePadding * 2),
            )}" class="background" />`,
        )
        parts.push(
            `<rect x="${fmt(r(this.drawing.lanePadding))}" y="0" width="${fmt(
                r(this.drawing.laneWidth * this.drawing.nLanes),
            )}" height="${fmt(r(height + this.drawing.timePadding * 2))}" class="lane" />`,
        )

        for (let lane = 0; lane <= this.drawing.nLanes; lane += 2) {
            const x = this.drawing.laneWidth * lane + this.drawing.lanePadding
            parts.push(
                `<line x1="${fmt(r(x))}" y1="0" x2="${fmt(r(x))}" y2="${fmt(r(
                    height + this.drawing.timePadding * 2,
                ))}" class="lane-line" />`,
            )
        }

        parts.push(...this.renderEvents(height))
        parts.push(...this.slidePaths)
        parts.push(...this.noteImages)
        parts.push(...this.amongImages)
        parts.push(...this.flickImages.slice().reverse())
        parts.push(...this.tickTexts)

        return {
            content: parts.join('\n'),
            width: Math.round(this.drawing.laneWidth * this.drawing.nLanes + this.drawing.lanePadding * 2),
            height: Math.round(height + this.drawing.timePadding * 2),
        }
    }
}

class DrawingRenderer {
    readonly score: Score
    readonly nLanes: number
    readonly laneWidth: number
    readonly timeHeight: number
    readonly noteSize: number
    readonly flickHeight: number
    readonly lanePadding: number
    readonly timePadding: number
    readonly slidePathPadding: number
    readonly metaSize: number
    readonly tickLength: number
    readonly tick2Length: number
    readonly noteHost: string
    readonly styleSheet: string

    constructor(score: Score, options: RenderOptions) {
        this.score = score
        this.nLanes = options.nLanes ?? 12
        this.noteHost = options.noteHost

        this.laneWidth = options.laneWidth ?? 16
        this.timeHeight = options.timeHeight ?? 360
        this.noteSize = options.noteSize ?? 16
        this.flickHeight = options.flickHeight ?? 24

        this.lanePadding = options.lanePadding ?? 40
        this.timePadding = options.timePadding ?? 32
        this.slidePathPadding = options.slidePathPadding ?? -1
        this.metaSize = options.metaSize ?? 192

        this.tickLength = options.tickLength ?? 24
        this.tick2Length = options.tick2Length ?? 8

        this.styleSheet = `${DEFAULT_STYLE}\n${WHITE_STYLE}${options.styleSheet ? `\n${options.styleSheet}` : ''}`
    }

    private renderNoteDefinitions(): string {
        const ratio = 1200
        const defs: string[] = []

        for (let noteNumber = 0; noteNumber <= 6; noteNumber += 1) {
            defs.push(
                `<symbol id="notes-${noteNumber}" viewBox="0 0 112 56"><image href="${escapeXml(
                    `${this.noteHost}/notes_${noteNumber}.png`,
                )}" x="-3" y="-3" width="118" height="62" /></symbol>`,
            )

            defs.push(
                `<symbol id="notes-${noteNumber}-middle" viewBox="0 0 ${112 * ratio} 56"><image href="${escapeXml(
                    `${this.noteHost}/notes_${noteNumber}.png`,
                )}" x="${fmt(-(3 + 28) * ratio)}" y="-3" width="${fmt(118 * ratio)}" height="62" preserveAspectRatio="none" /></symbol>`,
            )

            for (let i = 1; i <= this.nLanes; i += 1) {
                const noteHeight = this.noteSize
                const noteWidth = this.laneWidth * (i + 1)
                const noteInnerWidth = this.laneWidth * i
                const noteLWidth = (noteHeight / 56) * 32
                const noteRWidth = noteLWidth
                const noteMWidth = noteInnerWidth - (noteLWidth + noteRWidth) / 2 - 2
                const notePaddingX =
                    (noteWidth - noteLWidth - noteMWidth - noteRWidth) / 2

                defs.push(
                    `<symbol id="notes-${noteNumber}-${i}" viewBox="0 0 ${fmt(noteWidth)} ${fmt(noteHeight)}">` +
                        `<clipPath id="notes-${noteNumber}-${i}-left"><rect x="0" y="0" width="${fmt(
                            noteLWidth,
                        )}" height="${fmt(noteHeight)}" /></clipPath>` +
                        `<clipPath id="notes-${noteNumber}-${i}-middle"><rect x="0" y="0" width="${fmt(
                            noteMWidth,
                        )}" height="${fmt(noteHeight)}" /></clipPath>` +
                        `<clipPath id="notes-${noteNumber}-${i}-right"><rect x="${fmt(
                            (noteHeight / 56) * 80,
                        )}" y="0" width="${fmt(noteRWidth)}" height="${fmt(noteHeight)}" /></clipPath>` +
                        `<use href="#notes-${noteNumber}" x="${fmt(notePaddingX)}" y="0" width="${fmt(
                            noteHeight * 2,
                        )}" height="${fmt(noteHeight)}" clip-path="url(#notes-${noteNumber}-${i}-left)" />` +
                        `<use href="#notes-${noteNumber}-middle" x="${fmt(
                            notePaddingX + noteLWidth,
                        )}" y="0" width="${fmt(noteHeight * ratio * 2)}" height="${fmt(
                            noteHeight,
                        )}" clip-path="url(#notes-${noteNumber}-${i}-middle)" />` +
                        `<use href="#notes-${noteNumber}" x="${fmt(
                            notePaddingX + noteLWidth + noteMWidth + noteRWidth - noteHeight * 2,
                        )}" y="0" width="${fmt(noteHeight * 2)}" height="${fmt(
                            noteHeight,
                        )}" clip-path="url(#notes-${noteNumber}-${i}-right)" />` +
                        `</symbol>`,
                )
            }
        }

        return defs.join('\n')
    }

    render(): RenderedSvg {
        if (!this.score.notes.length) {
            throw new Error('谱面中没有可渲染的音符')
        }

        const nBars = Math.ceil(this.score.notes[this.score.notes.length - 1].bar.toNumber())

        const drawings: Array<{ content: string; width: number; height: number }> = []
        let totalWidth = 0
        let totalHeight = 0

        let bar = 0
        let event = new Event({
            bar: 0,
            bpm: 120,
            barLength: 4,
            sentenceLength: 4,
        })

        for (let i = 0; i <= nBars; i += 1) {
            const currentEvent = this.score.getEvent(i)
            const currentSentenceLength = currentEvent.sentenceLength || 4
            const previousSentenceLength = event.sentenceLength || 4

            if (
                bar !== i &&
                (currentEvent.section !== event.section ||
                    currentSentenceLength !== previousSentenceLength ||
                    i === bar + previousSentenceLength ||
                    i === nBars)
            ) {
                const sentence = new SentenceRenderer(this, bar, i).render()
                drawings.push(sentence)
                totalWidth += sentence.width
                if (totalHeight < sentence.height) {
                    totalHeight = sentence.height
                }
                bar = i
            }

            event = event.merge(currentEvent)
        }

        const width = totalWidth + this.lanePadding * 2
        const height = totalHeight + this.timePadding * 2 + this.metaSize + this.timePadding * 2

        const parts: string[] = []
        parts.push(`<?xml version="1.0" encoding="UTF-8"?>`)
        parts.push(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(width)}" height="${fmt(
                height,
            )}" viewBox="0 0 ${fmt(width)} ${fmt(height)}">`,
        )
        parts.push('<defs>')
        parts.push(`<style><![CDATA[${this.styleSheet}]]></style>`)
        parts.push(
            `<linearGradient id="decoration-gradient" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--color-start)" /><stop offset="1" stop-color="var(--color-stop)" /></linearGradient>`,
        )
        parts.push(
            `<linearGradient id="decoration-critical-gradient" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--color-start)" /><stop offset="1" stop-color="var(--color-stop)" /></linearGradient>`,
        )
        parts.push(this.renderNoteDefinitions())
        parts.push('</defs>')

        parts.push(
            `<rect x="0" y="0" width="${fmt(width)}" height="${fmt(
                totalHeight + this.timePadding * 2,
            )}" class="background" />`,
        )
        parts.push(
            `<rect x="0" y="${fmt(totalHeight + this.timePadding * 2)}" width="${fmt(width)}" height="${fmt(
                this.metaSize + this.timePadding * 2,
            )}" class="meta" />`,
        )
        parts.push(
            `<line x1="0" y1="${fmt(totalHeight + this.timePadding * 2)}" x2="${fmt(width)}" y2="${fmt(
                totalHeight + this.timePadding * 2,
            )}" class="meta-line" />`,
        )

        parts.push(
            `<image href="${escapeXml(
                this.score.meta.jacket || `${this.noteHost}/../../logo.png`,
            )}" x="${fmt(this.lanePadding * 2)}" y="${fmt(
                totalHeight + this.timePadding * 3,
            )}" width="${fmt(this.metaSize)}" height="${fmt(this.metaSize)}" />`,
        )

        const title = [this.score.meta.title, this.score.meta.artist].filter((x) => x).join(' - ') || 'Untitled'
        parts.push(
            `<text x="${fmt(this.metaSize + this.lanePadding * 4)}" y="${fmt(
                this.metaSize + totalHeight + this.timePadding * 3 - 16,
            )}" class="title">${escapeXml(title)}</text>`,
        )

        const subtitle = [
            this.score.meta.difficulty ? String(this.score.meta.difficulty).toUpperCase() : null,
            this.score.meta.playlevel,
            '譜面確認',
        ]
            .filter((x) => x)
            .join(' ')

        parts.push(
            `<text x="${fmt(this.metaSize + this.lanePadding * 4)}" y="${fmt(
                this.metaSize / 3 + totalHeight + this.timePadding * 3 - 8,
            )}" class="subtitle">${escapeXml(subtitle)}</text>`,
        )

        let x = 0
        for (const drawing of drawings) {
            const tx = x + this.lanePadding
            const ty = totalHeight - drawing.height + this.timePadding
            // Use nested SVG viewport to clip overflow notes at sentence boundaries.
            parts.push(
                `<svg x="${fmt(tx)}" y="${fmt(ty)}" width="${fmt(drawing.width)}" height="${fmt(
                    drawing.height,
                )}" viewBox="0 0 ${fmt(drawing.width)} ${fmt(drawing.height)}" style="overflow:hidden">${drawing.content}</svg>`,
            )
            x += drawing.width
        }

        parts.push('</svg>')

        return {
            svg: parts.join('\n'),
            width: Math.round(width),
            height: Math.round(height),
        }
    }
}

export const renderScoreToSvg = (score: Score, options: RenderOptions): RenderedSvg => {
    const renderer = new DrawingRenderer(score, options)
    return renderer.render()
}

export const defaultSus2ImgStyleSheet = `${DEFAULT_STYLE}\n${WHITE_STYLE}`
