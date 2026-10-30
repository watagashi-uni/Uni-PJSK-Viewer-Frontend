export type UnityWebGLBuildConfig = {
    dataUrl: string;
    frameworkUrl: string;
    codeUrl: string;
    workerUrl?: string;
    streamingAssetsUrl?: string;
    companyName?: string;
    productName?: string;
    productVersion?: string;
    threads?: boolean;
    devicePixelRatio?: number;
    matchWebGLToCanvasSize?: boolean;
    autoSyncPersistentDataPath?: boolean;
    arguments?: string[];
    webglContextAttributes?: Omit<WebGLContextAttributes, "powerPreference"> & {
        /** Unity 2022's loader reads this as an Emscripten integer (2 = high performance). */
        powerPreference?: WebGLContextAttributes["powerPreference"] | 0 | 1 | 2;
    };
    cacheControl?: (url: string) => "must-revalidate" | "immutable" | "no-store";
    showBanner?: (message: string, type: "error" | "warning" | string) => void;
    /** Called around every Unity frame by WebGLMainLoop.jslib (diagnostics only; leave unset in production). */
    harukiFrameProbe?: {
        begin(now: number): void;
        end(): void;
    };
};
export type UnityWebGLCompression = "none" | "gzip" | "brotli";
export type UnityWebGLBuildOptions = {
    buildBaseUrl: string;
    streamingAssetsUrl?: string;
    buildName?: string;
    compression?: UnityWebGLCompression;
    companyName?: string;
    productName?: string;
    productVersion?: string;
    threads?: boolean;
};
export type ResolvedUnityWebGLBuild = {
    loaderUrl: string;
    config: UnityWebGLBuildConfig;
};
export type UnityWebGLThreadCapabilityScope = {
    SharedArrayBuffer?: typeof globalThis.SharedArrayBuffer;
    WebAssembly?: typeof globalThis.WebAssembly;
    Worker?: typeof globalThis.Worker;
};
export declare function supportsUnityWebGLThreads(scope?: UnityWebGLThreadCapabilityScope): boolean;
export declare function resolveUnityWebGLBuild(options: UnityWebGLBuildOptions): ResolvedUnityWebGLBuild;
