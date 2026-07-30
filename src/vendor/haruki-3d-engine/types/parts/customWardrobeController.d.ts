import type { RuntimeCombinedCharacterAsset } from "../runtime/runtimeTypes";
import { type CustomPartSelection, type PartPackageSet, type PartRegistryEntry, type PartRuntimePackage, type RuntimePartType } from "./runtimePartComposer";
export type CustomWardrobeControllerOptions = {
    resolveUrl: (path: string) => string;
    loadPartRuntime?: (entry: PartRegistryEntry) => Promise<PartRuntimePackage | null>;
    ensureCompatibility?: (selection: CustomPartSelection) => Promise<void>;
};
export declare class CustomWardrobeController {
    private readonly options;
    private partSet;
    private selection;
    private activeRoleId;
    private combined;
    constructor(options: CustomWardrobeControllerOptions);
    loadPartPackageSet(partSet: PartPackageSet, options?: {
        composeDefault?: boolean;
    }): RuntimeCombinedCharacterAsset | null;
    clear(): void;
    getPartPackageSet(): PartPackageSet | null;
    getCustomSelection(): CustomPartSelection | null;
    getActiveCharacterId(): number | null;
    getActiveRoleId(): string | null;
    selectRole(characterId: number, unit: string | null): void;
    getCombinedCharacter(): RuntimeCombinedCharacterAsset | null;
    listCustomParts(characterId: number, partType: RuntimePartType, options?: {
        unit?: string | null;
        loadedOnly?: boolean;
    }): PartRegistryEntry[];
    setCustomSelection(selection: CustomPartSelection, isLatest?: () => boolean): Promise<RuntimeCombinedCharacterAsset>;
    updateCustomSelection(partType: RuntimePartType, costume3dId: number | null): Promise<RuntimeCombinedCharacterAsset>;
    composeCustomCharacter(selection: CustomPartSelection): Promise<RuntimeCombinedCharacterAsset>;
    private resolveHeadSource;
    private assertSameActiveCharacter;
    private ensureSelectionPackages;
    private findRegistryEntry;
    private findRegistryEntryForRole;
    private compose;
}
