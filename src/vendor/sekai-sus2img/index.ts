// @ts-nocheck
import { Score } from './model'
import { parseSusText } from './parser'
import { applyRebase } from './rebase'
import { renderScoreToSvg } from './renderer'
import { scoreFromCustomScoreJson } from './customScoreJson'

export type Sus2ImgSkin = 'custom01' | 'custom02'

export interface Sus2ImgRenderInput {
    sus: string
    rebase?: string
    title?: string
    artist?: string
    author?: string
    difficulty?: string
    playlevel?: string
    pixel?: string | number
    skin?: Sus2ImgSkin
    jacket?: string
}

export interface CustomScoreJsonRenderInput {
    scoreJson: unknown
    rebase?: string
    title?: string
    artist?: string
    author?: string
    difficulty?: string
    playlevel?: string
    pixel?: string | number
    skin?: Sus2ImgSkin
    jacket?: string
    songId?: string | number
    ticksPerBeat?: number
}

export interface Sus2ImgRuntimeOptions {
    assetOrigin?: string
    pngRenderer?: (svg: string, width: number, height: number) => Promise<Blob>
}

export interface Sus2ImgFrontendResult {
    source: 'frontend'
    format: 'svg' | 'png'
    url: string
    blob: Blob
    width: number
    height: number
    svgText: string
}

const normalizeBase = (value: string): string => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '/') {
        return ''
    }
    return trimmed.replace(/\/+$/, '')
}

const joinAssetPath = (base: string, relativePath: string): string => {
    const relative = relativePath.replace(/^\/+/, '')
    if (!base) {
        return `/${relative}`
    }
    return `${base}/${relative}`
}

const resolveAssetBase = (override?: string): string => {
    if (override && override.trim()) {
        return normalizeBase(override)
    }
    return ''
}

const resolveJacketPath = (assetBase: string, jacket?: string): string => {
    const trimmed = (jacket ?? '').trim()
    if (!trimmed) {
        return joinAssetPath(assetBase, 'logo.png')
    }

    if (
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/')
    ) {
        return trimmed
    }

    return joinAssetPath(assetBase, trimmed)
}

const normalizePixel = (pixel: string | number | undefined): number => {
    if (pixel === undefined || pixel === '') {
        return 240
    }
    const value = Number(pixel)
    if (!Number.isFinite(value) || Number.isNaN(value)) {
        throw new Error('每秒长度必须是数字')
    }
    if (value > 600) {
        throw new Error('每秒长度不能超过 600')
    }
    return Math.max(1, Math.floor(value))
}

const parseRebaseJson = (text: string): Record<string, unknown> => {
    if (!text.trim()) {
        return {}
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(text)
    } catch {
        throw new Error('rebase.json 不是合法 JSON')
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('rebase.json 必须是对象')
    }

    return parsed as RebaseInput
}

const createScore = (input: Sus2ImgRenderInput, runtimeOptions?: Sus2ImgRuntimeOptions): {
    score: Score
    noteHost: string
    pixel: number
} => {
    const score = parseSusText(input.sus)
    const rebaseInput = parseRebaseJson(input.rebase ?? '')
    const rebased = input.rebase?.trim() ? applyRebase(score, rebaseInput) : score

    const assetBase = resolveAssetBase(runtimeOptions?.assetOrigin)
    const skin = input.skin ?? 'custom01'

    rebased.meta.difficulty = input.difficulty ?? ''
    rebased.meta.artist = input.artist ?? ''
    rebased.meta.jacket = resolveJacketPath(assetBase, input.jacket)
    rebased.meta.title = input.title ?? ''

    let playlevel = `${input.playlevel ?? ''} 創作譜面`
    if ((input.author ?? '').trim()) {
        playlevel += ` by ${input.author?.trim()}`
    }
    rebased.meta.playlevel = playlevel

    const pixel = normalizePixel(input.pixel)

    return {
        score: rebased,
        noteHost: joinAssetPath(assetBase, `static/notes_new/${skin}`),
        pixel,
    }
}

const createCustomScoreJsonScore = (
    input: CustomScoreJsonRenderInput,
    runtimeOptions?: Sus2ImgRuntimeOptions,
): {
    score: Score
    noteHost: string
    pixel: number
} => {
    const assetBase = resolveAssetBase(runtimeOptions?.assetOrigin)
    const skin = input.skin ?? 'custom01'
    const parsedScore = scoreFromCustomScoreJson(input.scoreJson, {
        title: input.title ?? '',
        artist: input.artist ?? '',
        author: input.author ?? '',
        difficulty: input.difficulty ?? '',
        playlevel: input.playlevel ?? '',
        songId: input.songId ?? '',
        ticksPerBeat: input.ticksPerBeat,
    })
    const rebaseInput = parseRebaseJson(input.rebase ?? '')
    const score = input.rebase?.trim() ? applyRebase(parsedScore, rebaseInput) : parsedScore

    score.meta.jacket = resolveJacketPath(assetBase, input.jacket)

    let playlevel = `${input.playlevel ?? ''} 創作譜面`
    if ((input.author ?? '').trim()) {
        playlevel += ` by ${input.author?.trim()}`
    }
    score.meta.playlevel = playlevel

    return {
        score,
        noteHost: joinAssetPath(assetBase, `static/notes_new/${skin}`),
        pixel: normalizePixel(input.pixel),
    }
}

const toSvgPayload = (
    input: Sus2ImgRenderInput,
    runtimeOptions?: Sus2ImgRuntimeOptions,
): { svgText: string; width: number; height: number } => {
    const { score, noteHost, pixel } = createScore(input, runtimeOptions)
    const rendered = renderScoreToSvg(score, {
        noteHost,
        noteSize: 18,
        timeHeight: pixel,
    })
    return {
        svgText: rendered.svg,
        width: rendered.width,
        height: rendered.height,
    }
}

const customScoreJsonToSvgPayload = (
    input: CustomScoreJsonRenderInput,
    runtimeOptions?: Sus2ImgRuntimeOptions,
): { svgText: string; width: number; height: number } => {
    const { score, noteHost, pixel } = createCustomScoreJsonScore(input, runtimeOptions)
    const rendered = renderScoreToSvg(score, {
        noteHost,
        noteSize: 18,
        timeHeight: pixel,
    })
    return {
        svgText: rendered.svg,
        width: rendered.width,
        height: rendered.height,
    }
}

const blobToDataUrl = async (blob: Blob): Promise<string> =>
    await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('读取图片资源失败'))
        reader.readAsDataURL(blob)
    })

const canInlineImages = (): boolean =>
    typeof window !== 'undefined' &&
    typeof fetch !== 'undefined' &&
    typeof FileReader !== 'undefined'

const resolveHrefForFetch = (href: string): string => {
    if (href.startsWith('http://') || href.startsWith('https://')) {
        return href
    }
    if (href.startsWith('//')) {
        return `${window.location.protocol}${href}`
    }
    return new URL(href, window.location.href).toString()
}

const inlineSvgImages = async (svgText: string): Promise<string> => {
    if (!canInlineImages()) {
        return svgText
    }

    const hrefRegex = /href="([^"]+)"/g
    const matches = [...svgText.matchAll(hrefRegex)]
    const hrefs = Array.from(
        new Set(
            matches
                .map((match) => match[1])
                .filter((href) => href && !href.startsWith('#') && !href.startsWith('data:') && !href.startsWith('blob:')),
        ),
    )

    if (!hrefs.length) {
        return svgText
    }

    const dataUrlMap = new Map<string, string>()
    await Promise.all(
        hrefs.map(async (href) => {
            try {
                const response = await fetch(resolveHrefForFetch(href))
                if (!response.ok) {
                    return
                }
                const blob = await response.blob()
                const dataUrl = await blobToDataUrl(blob)
                dataUrlMap.set(href, dataUrl)
            } catch {
                // keep original href when fetch fails
            }
        }),
    )

    let inlined = svgText
    for (const [href, dataUrl] of dataUrlMap) {
        inlined = inlined.replaceAll(`href="${href}"`, `href="${dataUrl}"`)
    }
    return inlined
}

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('PNG 编码失败'))
                return
            }
            resolve(blob)
        }, 'image/png')
    })

const defaultPngRenderer = async (svgText: string, width: number, height: number): Promise<Blob> => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
        throw new Error('当前环境不支持前端 PNG 转换')
    }

    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    try {
        const image = new Image()
        image.decoding = 'async'

        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('加载 SVG 图像失败'))
            image.src = svgUrl
        })

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            throw new Error('无法创建 Canvas 上下文')
        }

        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(image, 0, 0, width, height)

        return await canvasToBlob(canvas)
    } finally {
        URL.revokeObjectURL(svgUrl)
    }
}

export const renderSusToSvg = async (
    input: Sus2ImgRenderInput,
    runtimeOptions?: Sus2ImgRuntimeOptions,
): Promise<Sus2ImgFrontendResult> => {
    const { svgText: rawSvgText, width, height } = toSvgPayload(input, runtimeOptions)
    const svgText = await inlineSvgImages(rawSvgText)
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    return {
        source: 'frontend',
        format: 'svg',
        url,
        blob,
        width,
        height,
        svgText,
    }
}

export const renderCustomScoreJsonToSvg = async (
    input: CustomScoreJsonRenderInput,
    runtimeOptions?: Sus2ImgRuntimeOptions,
): Promise<Sus2ImgFrontendResult> => {
    const { svgText: rawSvgText, width, height } = customScoreJsonToSvgPayload(input, runtimeOptions)
    const svgText = await inlineSvgImages(rawSvgText)
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    return {
        source: 'frontend',
        format: 'svg',
        url,
        blob,
        width,
        height,
        svgText,
    }
}

export const renderCustomScoreJsonToPng = async (
    input: CustomScoreJsonRenderInput,
    runtimeOptions?: Sus2ImgRuntimeOptions,
): Promise<Sus2ImgFrontendResult> => {
    const { svgText: rawSvgText, width, height } = customScoreJsonToSvgPayload(input, runtimeOptions)
    const svgText = await inlineSvgImages(rawSvgText)
    const pngBlob = await (runtimeOptions?.pngRenderer ?? defaultPngRenderer)(svgText, width, height)
    const url = URL.createObjectURL(pngBlob)

    return {
        source: 'frontend',
        format: 'png',
        url,
        blob: pngBlob,
        width,
        height,
        svgText,
    }
}

export const renderSusToPng = async (
    input: Sus2ImgRenderInput,
    runtimeOptions?: Sus2ImgRuntimeOptions,
): Promise<Sus2ImgFrontendResult> => {
    const { svgText: rawSvgText, width, height } = toSvgPayload(input, runtimeOptions)
    const svgText = await inlineSvgImages(rawSvgText)
    const pngBlob = await (runtimeOptions?.pngRenderer ?? defaultPngRenderer)(svgText, width, height)
    const url = URL.createObjectURL(pngBlob)

    return {
        source: 'frontend',
        format: 'png',
        url,
        blob: pngBlob,
        width,
        height,
        svgText,
    }
}

export const revokeSus2ImgResult = (result: { url?: string | null } | null | undefined) => {
    if (!result?.url) {
        return
    }
    if (result.url.startsWith('blob:')) {
        URL.revokeObjectURL(result.url)
    }
}
