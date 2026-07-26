type JsonToSusModule = {
    UTF8ToString: (ptr: number) => string
    stringToNewUTF8: (text: string) => number
    _json_to_sus: (
        jsonPtr: number,
        titlePtr: number,
        artistPtr: number,
        designerPtr: number,
        includeNoteSpeed: number,
    ) => number
    _json_to_sus_free: (ptr: number) => void
    _free: (ptr: number) => void
}

type JsonToSusFactory = (options: {
    locateFile: (file: string, prefix?: string) => string
    print?: (...args: unknown[]) => void
    printErr?: (...args: unknown[]) => void
}) => Promise<JsonToSusModule>

export interface JsonToSusOptions {
    title?: string
    artist?: string
    designer?: string
    /** 输出 MikuMikuWorld note speed 扩展（仅当谱面含非 1.0 的 speedRatio 时才会实际出现），默认 true */
    includeNoteSpeed?: boolean
}

let modulePromise: Promise<JsonToSusModule> | null = null

const publicAssetUrl = (path: string): string => {
    const base = import.meta.env.BASE_URL || '/'
    const normalizedBase = base.endsWith('/') ? base : `${base}/`
    return new URL(`${normalizedBase}${path.replace(/^\/+/, '')}`, window.location.href).toString()
}

const loadJsonToSusModule = async (): Promise<JsonToSusModule> => {
    if (!modulePromise) {
        const moduleUrl = publicAssetUrl('wasm/json-to-sus/json_to_sus_wasm.js')
        modulePromise = import(/* @vite-ignore */ moduleUrl).then((module) =>
            (module as { default: JsonToSusFactory }).default({
                locateFile: (file: string) => publicAssetUrl(`wasm/json-to-sus/${file}`),
            }),
        )
    }
    return modulePromise
}

const throwIfConverterError = (susText: string): void => {
    if (!susText.startsWith('{"error":')) {
        return
    }
    try {
        const parsed = JSON.parse(susText) as { error?: unknown }
        if (typeof parsed.error === 'string' && parsed.error) {
            throw new Error(`JSON 转 SUS 失败：${parsed.error}`)
        }
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('JSON 转 SUS 失败：')) {
            throw error
        }
        throw new Error(`JSON 转 SUS 失败：${susText.slice(0, 300)}`)
    }
}

export const convertCustomScoreJsonToSus = async (
    jsonText: string,
    options: JsonToSusOptions = {},
): Promise<string> => {
    const module = await loadJsonToSusModule()
    const jsonPtr = module.stringToNewUTF8(jsonText)
    const titlePtr = module.stringToNewUTF8(options.title ?? '')
    const artistPtr = module.stringToNewUTF8(options.artist ?? '')
    const designerPtr = module.stringToNewUTF8(options.designer ?? '')
    let outputPtr = 0
    try {
        outputPtr = module._json_to_sus(
            jsonPtr,
            titlePtr,
            artistPtr,
            designerPtr,
            (options.includeNoteSpeed ?? true) ? 1 : 0,
        )
        if (!outputPtr) {
            throw new Error('JSON 转 SUS 失败：wasm 没有返回结果')
        }
        const susText = module.UTF8ToString(outputPtr)
        throwIfConverterError(susText)
        return susText
    } finally {
        if (outputPtr) {
            module._json_to_sus_free(outputPtr)
        }
        module._free(jsonPtr)
        module._free(titlePtr)
        module._free(artistPtr)
        module._free(designerPtr)
    }
}
