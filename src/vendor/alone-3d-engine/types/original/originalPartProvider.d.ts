import type { PartRegistryEntry, PartRuntimePackage } from "../parts/runtimePartComposer";
import type { UnityClipData } from "./unityAnimationClip";
import type { OriginalPartType } from "./partBuilder";
export declare class OriginalPartProvider {
    private readonly baseUrl;
    private worker;
    private nextId;
    private readonly pending;
    private readonly built;
    private readonly clipBundles;
    constructor(baseUrl: string);
    build(entry: PartRegistryEntry, options: {
        characterHeightMeters: number;
        partType?: OriginalPartType;
        bundleName?: string;
    }): Promise<PartRuntimePackage>;
    clips(bundleNames: readonly string[]): Promise<Record<string, UnityClipData[] | null>>;
    private post;
    private request;
    private createWorker;
    dispose(): void;
}
