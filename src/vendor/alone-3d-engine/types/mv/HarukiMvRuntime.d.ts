import type { UnityWebGLBuildConfig } from "./unityWebGLBuild";
export type UnityWebGLInstance = {
    SendMessage(gameObject: string, method: string, parameter?: string | number): void;
    SetFullscreen?(fullscreen: 0 | 1): void;
    GetMemoryInfo?(): UnityWebGLMemoryInfo;
    /** Unity 6's replacement for GetMemoryInfo: the same heap sizes plus timing metrics. */
    GetMetricsInfo?(): UnityWebGLMemoryInfo;
    Quit(): Promise<unknown>;
    /** The Emscripten module; Unity reads devicePixelRatio from it every frame when matching the canvas size. */
    Module?: {
        devicePixelRatio?: number;
    };
};
export type UnityWebGLMemoryInfo = {
    totalWASMHeapSize: number;
    usedWASMHeapSize: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};
export type UnityWebGLCreateInstance = (canvas: HTMLCanvasElement, config: UnityWebGLBuildConfig, onProgress?: (progress: number) => void) => Promise<UnityWebGLInstance>;
export type HarukiMvRuntimeState = "idle" | "loading" | "ready" | "failed" | "destroying" | "destroyed";
export type HarukiMvRuntimeOptions = {
    canvas: HTMLCanvasElement;
    build: UnityWebGLBuildConfig;
    /** Generated Unity factory. When omitted, loaderUrl is loaded once. */
    createUnityInstance?: UnityWebGLCreateInstance;
    loaderUrl?: string;
    onProgress?: (progress: number) => void;
};
export type HarukiMvRuntime = {
    readonly build: UnityWebGLBuildConfig;
    readonly state: HarukiMvRuntimeState;
    /** Aborted as soon as destroy() starts, before Unity Quit() is awaited. */
    readonly signal: AbortSignal;
    prepare(): Promise<UnityWebGLInstance>;
    sendMessage(gameObject: string, method: string, parameter?: string | number): void;
    /**
     * Render at this size whatever the canvas's CSS display size. With matchWebGLToCanvasSize (Unity sizes the drawing
     * buffer and Screen from CSS size × devicePixelRatio every frame) the runtime sets that ratio to render ÷ CSS size
     * and keeps it as the CSS size changes; otherwise it sizes the drawing buffer directly.
     */
    setRenderSize(width: number, height: number): void;
    setFullscreen(fullscreen: boolean): void;
    getMemoryInfo(): UnityWebGLMemoryInfo | null;
    destroy(): Promise<void>;
};
/** Hosts one original Unity WebGL/WASM MV player. */
export declare function createHarukiMvRuntime(options: HarukiMvRuntimeOptions): HarukiMvRuntime;
export declare function loadUnityWebGLCreateInstance(loaderUrl: string): Promise<UnityWebGLCreateInstance>;
