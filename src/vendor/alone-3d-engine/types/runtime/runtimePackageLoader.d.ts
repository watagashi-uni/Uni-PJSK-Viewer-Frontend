import type { RuntimeCombinedCharacterAsset } from "./runtimeTypes";
import { CustomWardrobeController } from "../parts/customWardrobeController";
import { type PartPackageSet, type RoleRuntimePackage } from "../parts/runtimePartComposer";
import { OriginalPartProvider } from "../original/originalPartProvider";
export type RuntimePackageLoadResult = {
    kind: "part-registry";
    combinedCharacter: RuntimeCombinedCharacterAsset | null;
    displayNameByUrl: Map<string, string>;
    partSet: PartPackageSet | null;
    wardrobe: CustomWardrobeController | null;
};
export type RuntimePackageLoadOptions = {
    deferDefaultSelection?: boolean;
    roleId: string;
};
export declare function loadRuntimePackageFromBaseUrl(baseUrl: string, options: RuntimePackageLoadOptions): Promise<RuntimePackageLoadResult>;
/** Merge another role's catalog for cross-role bodies; part assets remain lazy. */
export declare function ensureRolePartRegistry(partSet: PartPackageSet, characterId: number, unit: string | null): Promise<void>;
export declare function resolveRuntimePackageUrl(baseUrl: string, relativePath: string): string;
export declare function ensureRoleRuntimePackage(partSet: PartPackageSet, characterId: number, unit: string | null): Promise<RoleRuntimePackage>;
export declare function loadMotionRoleRuntime(partSet: PartPackageSet, characterId: number, unit: string | null): Promise<RoleRuntimePackage>;
export declare function originalPartProvider(baseUrl: string): OriginalPartProvider;
export declare function fetchRuntimeMessagePack(url: string): Promise<unknown>;
