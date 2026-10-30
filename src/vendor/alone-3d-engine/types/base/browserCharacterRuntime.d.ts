import type { HarukiRenderRecipe } from "../kernel/renderRecipe";
export type HarukiCanvasBackground = "transparent" | "archive";
export type HarukiBaseCharacterRuntime = {
    prepare(recipe: HarukiRenderRecipe): Promise<void>;
    load(recipe: HarukiRenderRecipe): Promise<void>;
    play(): void;
    pause(): void;
    resize(width: number, height: number): void;
    setCharacterYawDegrees(degrees: number): void;
    setViewYawDegrees(degrees: number): void;
    setBackground(background: HarukiCanvasBackground): Promise<void>;
    destroy(): Promise<void>;
};
export type HarukiBaseRuntimeEngine = {
    destroy(): void;
    loadRenderRecipe(recipe: HarukiRenderRecipe & {
        baseUrl: string;
    }): Promise<unknown>;
    renderFrame(): void;
    setCharacterYawDegrees(degrees: number): void;
    setViewYawDegrees(degrees: number): void;
    setViewportSize(width: number, height: number): void;
    stepRuntimeFrame(deltaSeconds: number, options: {
        advanceAnimation: boolean;
        elapsedTime?: number;
    }): void;
    waitForPostProcessorReady?(): Promise<void>;
    setBackgroundMode?(background: HarukiCanvasBackground, assetBaseUrl: string): Promise<void>;
};
/**
 * Shared browser lifecycle around a character engine. Presentation modules own
 * the concrete engine and its camera, lighting, and scene policy.
 */
export declare function createHarukiBaseCharacterRuntime(engine: HarukiBaseRuntimeEngine, assetBaseUrl: string): HarukiBaseCharacterRuntime;
