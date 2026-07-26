import type { RuntimeCombinedCharacterAsset } from "./runtimeTypes";
import { CustomWardrobeController } from "../parts/customWardrobeController";
import { type PartPackageSet, type RoleRuntimePackage } from "../parts/runtimePartComposer";
export type RuntimePackageLoadResult = {
    kind: "part-registry";
    combinedCharacter: RuntimeCombinedCharacterAsset | null;
    previewLight: null;
    faceMotion: null;
    displayNameByUrl: Map<string, string>;
    partSet: PartPackageSet | null;
    wardrobe: CustomWardrobeController | null;
};
export type RuntimePackageLoadOptions = {
    deferDefaultSelection?: boolean;
    roleId: string;
};
export declare function loadRuntimePackageFromBaseUrl(baseUrl: string, options: RuntimePackageLoadOptions): Promise<RuntimePackageLoadResult>;
export declare function resolveRuntimePackageUrl(baseUrl: string, relativePath: string): string;
export declare function ensureRoleRuntimePackage(partSet: PartPackageSet, characterId: number, unit: string | null): Promise<RoleRuntimePackage | null>;
export declare function fetchRuntimeMessagePack(url: string): Promise<unknown>;
