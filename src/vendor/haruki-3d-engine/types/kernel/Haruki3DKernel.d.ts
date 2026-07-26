import { type PreviewLightState } from "../data/sampleScene";
import { Haruki3DEngine } from "../engine/Haruki3DEngine";
import type { HarukiRenderRecipe } from "./renderRecipe";
export type Haruki3DKernelOptions = {
    canvas: HTMLCanvasElement;
    assetBaseUrl: string;
    initialLight?: PreviewLightState;
    ktx2TranscoderPath?: string;
};
export type Haruki3DKernel = {
    prepare(recipe: HarukiRenderRecipe): Promise<void>;
    load(recipe: HarukiRenderRecipe): Promise<void>;
    play(): void;
    pause(): void;
    resize(width: number, height: number): void;
    destroy(): Promise<void>;
};
type Haruki3DKernelEngine = Pick<Haruki3DEngine, "destroy" | "loadRenderRecipe" | "renderFrame" | "setViewportSize" | "stepRuntimeFrame"> & Partial<Pick<Haruki3DEngine, "waitForPostProcessorReady">>;
export declare function createHaruki3DKernel(options: Haruki3DKernelOptions): Haruki3DKernel;
export declare function createHaruki3DKernelRuntime(engine: Haruki3DKernelEngine, assetBaseUrl: string): Haruki3DKernel;
export {};
