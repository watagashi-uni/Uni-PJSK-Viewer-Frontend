type RustScore = {
    free: () => void
    setMetaField: (name: string, value: string) => boolean
}

type RustDrawing = {
    free: () => void
    setGenerator: (generator: string) => void
    setNoteHost: (noteHost: string) => void
    setNoteAssetExtension: (extension: string) => void
    svg: (score: RustScore) => string
    noteSize: number
    timeHeight: number
}

type RustRebase = {
    free: () => void
    apply: (score: RustScore) => RustScore
}

type RustRendererModule = {
    default: (moduleOrPath?: string | URL) => Promise<unknown>
    Score: {
        fromJson: (content: string) => RustScore
    }
    Drawing: new () => RustDrawing
    Rebase: {
        fromJson: (content: string) => RustRebase
    }
}

export type RustRendererInput = {
    scoreJson: string
    rebase?: string
    meta: Record<string, string>
    noteHost: string
    noteSize: number
    timeHeight: number
}

let modulePromise: Promise<RustRendererModule> | null = null

const publicAssetUrl = (path: string): string => {
    const base = import.meta.env.BASE_URL || '/'
    const normalizedBase = base.endsWith('/') ? base : `${base}/`
    return new URL(`${normalizedBase}${path.replace(/^\/+/, '')}`, window.location.href).toString()
}

const loadRustRendererModule = async (): Promise<RustRendererModule> => {
    if (!modulePromise) {
        const moduleUrl = publicAssetUrl('wasm/pjsekai-scores-rs/pjsekai_scores_rs.js')
        const wasmUrl = publicAssetUrl('wasm/pjsekai-scores-rs/pjsekai_scores_rs_bg.wasm')
        modulePromise = import(/* @vite-ignore */ moduleUrl).then(async (loaded) => {
            const module = loaded as RustRendererModule
            await module.default(wasmUrl)
            return module
        })
    }
    return modulePromise
}

export const renderCustomScoreJsonWithRust = async (input: RustRendererInput): Promise<string> => {
    const module = await loadRustRendererModule()
    const sourceScore = module.Score.fromJson(input.scoreJson)
    let score = sourceScore
    let rebase: RustRebase | null = null
    let drawing: RustDrawing | null = null

    try {
        if (input.rebase?.trim()) {
            rebase = module.Rebase.fromJson(input.rebase)
            score = rebase.apply(sourceScore)
        }

        for (const [name, value] of Object.entries(input.meta)) {
            score.setMetaField(name, value)
        }

        drawing = new module.Drawing()
        drawing.setNoteHost(input.noteHost)
        drawing.setNoteAssetExtension('png')
        drawing.setGenerator('Uni PJSK Viewer / pjsekai-scores-rs')
        drawing.noteSize = input.noteSize
        drawing.timeHeight = input.timeHeight
        return drawing.svg(score)
    } finally {
        drawing?.free()
        if (score !== sourceScore) {
            score.free()
        }
        rebase?.free()
        sourceScore.free()
    }
}
