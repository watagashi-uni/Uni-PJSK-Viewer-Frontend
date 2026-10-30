import { type HarukiBaseCharacterRuntime, type HarukiCanvasBackground, type HarukiBaseRuntimeEngine } from "../base/browserCharacterRuntime";
import { type PreviewLightState } from "../data/sampleScene";
export type CostumeShopKernelOptions = {
    canvas: HTMLCanvasElement;
    assetBaseUrl: string;
    initialLight?: PreviewLightState;
    ktx2TranscoderPath?: string;
    background?: HarukiCanvasBackground;
    framing?: "default" | "upper-body";
};
export type CostumeShopKernel = HarukiBaseCharacterRuntime;
export declare function createCostumeShopKernel(options: CostumeShopKernelOptions): CostumeShopKernel;
export declare function createCostumeShopKernelRuntime(engine: HarukiBaseRuntimeEngine, assetBaseUrl: string): CostumeShopKernel;
export declare const createHaruki3DKernel: typeof createCostumeShopKernel;
export declare const createHaruki3DKernelRuntime: typeof createCostumeShopKernelRuntime;
export type Haruki3DKernel = CostumeShopKernel;
export type Haruki3DKernelOptions = CostumeShopKernelOptions;
