import type { RuntimeCombinedCharacterAsset, RuntimeSkinColors } from "../runtime/runtimeTypes";
export type RuntimePartType = "body" | "head" | "hair" | "head_optional";
export type PartRegistryEntry = {
    costume3dId: number;
    partType: RuntimePartType | string;
    characterId: number;
    unit?: string | null;
    name?: string | null;
    colorId?: number | null;
    colorName?: string | null;
    costume3dGroupId?: number | null;
    modelAssetbundleName?: string | null;
    headCostume3dAssetbundleType?: string | null;
    bundlePath?: string | null;
    colorVariationBundlePath?: string | null;
    baseSourceKey?: string | null;
    sourceKey?: string | null;
    sourcePackagePath?: string | null;
    packagePath: string;
    status?: string;
    warnings?: string[] | null;
};
export type RuntimeRoleCatalogEntry = {
    roleId: number;
    characterId: number;
    characterHeightMeters?: number;
    bodyCostume3dId: number;
    headCostume3dId: number;
    hairCostume3dId: number;
    skinColors?: RuntimeSkinColors;
    unit?: string | null;
    roleRuntimePath: string;
};
export type RuntimeRoleCatalog = {
    version: number;
    masterVersion: string;
    roles: RuntimeRoleCatalogEntry[];
};
export type HeadHairCompatibility = {
    version?: string;
    allowed?: Array<{
        unit?: string | null;
        headCostume3dId: number;
        hairCostume3dId: number;
        headCompositionKind?: string | null;
        mainHeadCostume3dId?: number | null;
        mainHairCostume3dId?: number | null;
        activeContributors?: string[] | null;
    }>;
    denied?: Array<{
        unit?: string | null;
        headCostume3dId: number;
        hairCostume3dId: number;
    }>;
    rules?: Array<{
        unit?: string | null;
        headCostume3dId: number;
        hairCostume3dId: number;
        state?: string | null;
        headCompositionKind?: string | null;
        mainHeadCostume3dId?: number | null;
        mainHairCostume3dId?: number | null;
        activeContributors?: string[] | null;
    }>;
};
export type PartRuntimePackage = {
    version: string;
    corePath?: string;
    packagePath?: string;
    part: {
        costume3dId: number;
        partType: RuntimePartType | string;
        characterId: number;
        unit?: string | null;
        name?: string | null;
        colorId?: number | null;
        colorName?: string | null;
        costume3dGroupId?: number | null;
        modelAssetbundleName?: string | null;
        headCostume3dAssetbundleType?: string | null;
    };
    source?: {
        bundlePath?: string | null;
        colorVariationBundlePath?: string | null;
        assetRootRelativeBundlePath?: string | null;
        logicalBundleName?: string | null;
        physicalBundleSha256?: string | null;
        dependencyBundleNames?: string[] | null;
        colorVariationLogicalBundleName?: string | null;
        colorVariationPhysicalBundleSha256?: string | null;
        colorVariationDependencyBundleNames?: string[] | null;
        unityResourceName?: string | null;
        unityObjectType?: string | null;
    };
    mount?: Record<string, unknown>;
    manifest: unknown;
    nativeMeshes?: Record<string, unknown>;
    materialSlots?: unknown[];
    textureRoles?: unknown[];
    characterTextures?: Record<string, string>;
    characterControllers?: Record<string, unknown>;
    springBone?: Record<string, unknown>;
    morphChannelBindings?: unknown[];
    warnings?: string[];
};
export type RoleRuntimePackage = {
    version: string;
    role: {
        characterId: number;
        unit?: string | null;
    };
    sourceCharacter3dId?: number;
    motionPackage?: {
        sourcePath?: string;
        unityMotionJson?: string | null;
        bodyMotionBindings?: unknown;
        faceMotion?: unknown;
        lightMotion?: unknown;
    } | null;
    warnings?: string[];
};
export type PartPackageSet = {
    registry: PartRegistryEntry[];
    roles: RuntimeRoleCatalogEntry[];
    masterVersion?: string;
    compatibility: HeadHairCompatibility | null;
    packages: Map<string, PartRuntimePackage>;
    roleRuntimes: Map<string, RoleRuntimePackage>;
    baseUrl: string;
};
export type CustomPartSelection = {
    characterId: number;
    unit: string | null;
    bodyCostume3dId: number;
    headCostume3dId: number;
    headPackagePath?: string | null;
    hairCostume3dId: number;
    headOptionalCostume3dId?: number | null;
};
export type ComposePartAssetInput = {
    partSet: PartPackageSet;
    selection: CustomPartSelection;
    activeRoleId: string | null;
    resolveUrl: (path: string) => string;
};
export declare function normalizeRuntimePartType(value: string): RuntimePartType;
export declare function runtimePartSlot(part: {
    partType: RuntimePartType | string;
    headCostume3dAssetbundleType?: string | null;
}): RuntimePartType;
export declare function tryRuntimePartSlot(part: {
    partType: RuntimePartType | string;
    headCostume3dAssetbundleType?: string | null;
}): RuntimePartType | null;
export declare function tryNormalizeRuntimePartType(value: string): RuntimePartType | null;
export declare function runtimeRoleId(characterId: number, unit: string | null | undefined): string;
export declare function getDefaultCustomSelection(partSet: PartPackageSet): CustomPartSelection | null;
export declare function listSelectableParts(partSet: PartPackageSet, characterId: number, partType: RuntimePartType, options?: {
    unit?: string | null;
    loadedOnly?: boolean;
}): PartRegistryEntry[];
export declare function composeRuntimeCombinedCharacterAsset(input: ComposePartAssetInput): RuntimeCombinedCharacterAsset;
export declare function resolveRoleDefaultHairRegistryEntry(partSet: PartPackageSet, selection: Pick<CustomPartSelection, "characterId" | "unit">): PartRegistryEntry | null;
export declare function resolveHeadRegistryEntry(partSet: PartPackageSet, selection: CustomPartSelection): PartRegistryEntry;
export declare function resolveOptionalHeadRegistryEntry(partSet: PartPackageSet, selection: CustomPartSelection): PartRegistryEntry | null;
export declare function getDeniedHeadHairCompatibilityKeys(compatibility: HeadHairCompatibility | null): ReadonlySet<string>;
export declare function headHairCompatibilityKey(unit: string | null | undefined, headCostume3dId: number, hairCostume3dId: number): string;
