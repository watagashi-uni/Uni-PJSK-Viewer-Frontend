import type { HeadHairCompatibility, PartRegistryEntry, RuntimeRoleCatalog, RuntimeRoleCatalogEntry } from "../parts/runtimePartComposer";
export type MasterCostume3d = {
    id: number;
    costume3dGroupId: number;
    costume3dType?: string;
    name: string;
    partType: string;
    colorId: number;
    colorName: string;
    characterId: number;
    assetbundleName: string;
};
export type MasterCostume3dModel = {
    id: number;
    costume3dId: number;
    unit?: string | null;
    assetbundleName?: string | null;
    headCostume3dAssetbundleType?: string | null;
    colorAssetbundleName?: string | null;
    part?: string | null;
    thumbnailAssetbundleName?: string | null;
};
export type MasterCharacter3d = {
    id: number;
    characterType: string;
    characterId: number;
    unit: string | null;
    name: string;
    headCostume3dId: number;
    hairCostume3dId: number;
    bodyCostume3dId: number;
};
export type MasterGameCharacter = {
    id: number;
    figure: string;
    breastSize: string;
    height: number;
};
export type MasterGameCharacterUnit = {
    id: number;
    gameCharacterId: number;
    unit: string;
    skinColorCode: string;
    skinShadowColorCode1: string;
    skinShadowColorCode2: string;
};
export type MasterGameCharacterUnit3dMotion = {
    id: number;
    gameCharacterUnitId: number;
    motionType: string;
    assetbundleName: string;
};
export type MasterModelPattern = {
    unit?: string | null;
    headCostume3dId: number;
    hairCostume3dId: number;
};
export type CostumeMaster = {
    costume3ds: MasterCostume3d[];
    costume3dModels: MasterCostume3dModel[];
    character3ds: MasterCharacter3d[];
    gameCharacters: MasterGameCharacter[];
    gameCharacterUnits: MasterGameCharacterUnit[];
    gameCharacterUnit3dMotions?: MasterGameCharacterUnit3dMotion[];
    costume3dModelNotAvailablePatterns: MasterModelPattern[];
    costume3dModelDefaultHairs: MasterModelPattern[];
    version: string;
};
export type OriginalRegistryEntry = PartRegistryEntry & {
    colorAssetbundleName?: string | null;
    part?: string | null;
    attachNode?: string | null;
};
export declare const SPECIAL_HEAD_TYPES: readonly ["head_all", "head_front", "head_back"];
export declare function resolveFaceBundle(exists: (name: string) => boolean, bundleName: string, headType?: string | null): string | null;
export declare function buildPartRegistry(master: CostumeMaster, exists: (name: string) => boolean): OriginalRegistryEntry[];
export declare function buildHeadHairCompatibility(master: CostumeMaster): HeadHairCompatibility;
export declare function buildRoleCatalog(master: CostumeMaster): RuntimeRoleCatalog;
export declare const COSTUME_MOTION_FALLBACK_BUNDLE = "model3d/motion/result/01";
export declare const ORIGINAL_MOTION_SCHEME = "original-motion:";
export declare function roleMotionBundle(master: CostumeMaster, characterId: number, unit: string | null, exists: (bundle: string) => boolean): string;
export declare function buildRoleRuntime(master: CostumeMaster, role: RuntimeRoleCatalogEntry, exists: (bundle: string) => boolean): {
    version: string;
    role: {
        characterId: number;
        unit: string | null;
    };
    motionPackage: {
        originalMotionBundle: string;
    };
};
