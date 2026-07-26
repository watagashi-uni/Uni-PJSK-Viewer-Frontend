export type Vec3 = {
    x: number;
    y: number;
    z: number;
};
export type PreviewLightState = {
    x: number;
    y: number;
    z: number;
    intensity: number;
    ambient: number;
    shadowThreshold: number;
    shadowWeight: number;
    characterAmbient: number;
    rimColorAlpha: number;
    rimRange: number;
    rimEdgeSmoothness: number;
    rimEmission: number;
    rimLightInfluence: number;
    rimShadowSharpness: number;
    characterHeight: number;
};
export type SekaiRuntimeMaterialProfile = {
    version: number;
    bodyPipeline: "sekai_csh_toon";
    facePipeline: "sekai_csh_toon";
    layerPipeline: "sekai_eye_layers";
    vrmStrategy: "prefab_native_runtime_only";
    textureRoles: {
        main: "Sekai C";
        shadow: "Sekai S";
        value: "Sekai H";
        faceShadow: "Sekai SDF";
    };
    pluginPreview: {
        directionalLocation: Vec3;
        directionalEnergy: number;
        ambientIntensity: number;
        shadowThreshold: number;
        shadowWeight: number;
        characterAmbientIntensity: number;
        rimColorAlpha: number;
        rimRange: number;
        rimEdgeSmoothness: number;
        rimEmission: number;
        rimLightInfluence: number;
        rimShadowSharpness: number;
        rimRotationDegrees: Vec3;
    };
    viewerTunedPreview: PreviewLightState;
};
export type SekaiVrmMigrationProfile = {
    version: number;
    targetContainer: {
        preferred: "Unity prefab native runtime";
        fallback: "none";
        currentPhase: "prefab_native_runtime_with_pjsk_runtime_extension";
    };
    standardVrmFallback: {
        humanoidBoneMap: Record<string, string>;
        materialFallback: {
            shader: "MToon";
            mainTex: "baseColorTexture";
            shadowTex: "shadeMultiplyTexture";
            valueTex: "custom extras for rim/spec mask";
            faceShadowTex: "custom extras only";
        };
        expressionSource: "PJSK morphChannelBindings";
        springBoneSource: "raw PJSK spring metadata";
    };
    sekaiRuntimeExtras: {
        extensionName: "PJSK_sekai_runtime";
        requiredForExactViewerRender: true;
        payloadKeys: string[];
        materialKinds: string[];
    };
    preserveOutsideStandardVrm: string[];
    unresolvedBeforeTrueParity: string[];
};
export type FaceMode = "clean" | "sdf";
export type StitchMode = "stitched" | "manual" | "split";
export type AssetSource = {
    bundleRoot: string;
    manifestUrl: string;
    meshUrl: string;
    skeletonUrl?: string;
    animationUrls?: string[];
};
export type AssemblyAnchor = {
    nodeName?: string;
    fallbackPosition: Vec3;
};
export type MaterialLightingSettings = {
    specularPower: number;
    rimThreshold: number;
    shadowTexWeight: number;
    fadeMode: number;
    hueSinAngle: number;
    hueCosAngle: number;
    saturation: number;
    value: number;
    contrast: number;
    partsAmbientColor: string;
    reflectionBlendColor: string;
    outlineWidth: number;
    outlineOffset: number;
    outlineLightness: number;
    shadowWidth: number;
    useOutlineSecondNormal: number;
    distortionFps: number;
    distortionIntensity: number;
    distortionIntensityX: number;
    distortionIntensityY: number;
    distortionOffsetX: number;
    distortionOffsetY: number;
    distortionScrollSpeed: number;
    distortionScrollX: number;
    distortionScrollY: number;
    distortionTexTilingX: number;
    distortionTexTilingY: number;
    threshold: number;
    lightInfluence: number;
    lightInfluenceForEyeHighlight: number;
    sekaiShadowThreshold?: number | null;
    useLambert?: boolean | null;
    useValueTex?: boolean | null;
    useFaceSdf?: boolean | null;
    useFaceShadowLimiter?: boolean | null;
    rangeLimit?: number | null;
    hairShadow?: boolean | null;
    headNormalBlend?: number | null;
};
export type RawMaterialTextureProperty = {
    name: string;
    textureName?: string | null;
    textureFileId: number;
    texturePathId: number;
    textureKey?: string | null;
    scaleX: number;
    scaleY: number;
    offsetX: number;
    offsetY: number;
    colorSpace: number;
    uri?: string | null;
    sourceWidth: number;
    sourceHeight: number;
    sourceMipCount: number;
    sourceFormat: number;
    filterMode: number;
    anisoLevel: number;
    mipBias: number;
    wrapU: number;
    wrapV: number;
    wrapW: number;
};
export type RawMaterialColorProperty = {
    name: string;
    r: number;
    g: number;
    b: number;
    a: number;
};
export type RawMaterialScalarProperty = {
    name: string;
    value: number;
};
export type RawMaterialProperties = {
    shaderName?: string | null;
    shaderFileId: number;
    shaderPathId: number;
    shaderKey?: string | null;
    textureProperties: RawMaterialTextureProperty[];
    colorProperties: RawMaterialColorProperty[];
    floatProperties: RawMaterialScalarProperty[];
    intProperties: RawMaterialScalarProperty[];
    validKeywords: string[];
    invalidKeywords: string[];
    lightmapFlags: number;
    enableInstancingVariants: boolean;
    doubleSidedGi: boolean;
    customRenderQueue: number;
    stringTags: Record<string, string>;
    disabledShaderPasses: string[];
};
export type BodyMaterialSlot = {
    meshName: string;
    slotIndex: number;
    materialKey: string;
    materialFileId: number;
    materialPathId: number;
    materialName?: string;
    materialKind?: string;
    mainTex?: string;
    shadowTex?: string;
    valueTex?: string;
    lighting?: MaterialLightingSettings;
    rawMaterial?: RawMaterialProperties;
};
export type FaceMaterialSlot = {
    meshName: string;
    slotIndex: number;
    materialKey: string;
    materialFileId: number;
    materialPathId: number;
    materialName?: string;
    materialKind?: string;
    mainTex?: string;
    shadowTex?: string;
    valueTex?: string;
    faceShadowTex?: string;
    mode: FaceMode;
    isAccessory?: boolean;
    lighting?: MaterialLightingSettings;
    rawMaterial?: RawMaterialProperties;
};
export type BodyAssetManifest = {
    id: string;
    displayName: string;
    characterId?: string;
    characterHeightMeters?: number;
    materialPipeline?: "embedded" | "sekai_preview";
    source: AssetSource;
    neckAnchor: Vec3;
    skeleton: {
        skeletonId: string;
        rootNodeName?: string;
        neckAttach: AssemblyAnchor;
    };
    bodyMaterials: BodyMaterialSlot[];
    proxy: {
        bodyColor: string;
        shadowColor: string;
        bodyScale: number;
        torsoLength: number;
        shoulderWidth: number;
    };
};
export type HeadMorphChannel = {
    name: string;
    sourceName: string;
    nameHash: number;
    curveHash: number;
};
export type HeadAssetManifest = {
    id: string;
    displayName: string;
    characterId?: string;
    characterHeightMeters?: number;
    materialPipeline?: "embedded" | "sekai_preview";
    source: AssetSource;
    rawImportOffset: Vec3;
    assembly: {
        expectedSkeletonId: string;
        attachOrigin: AssemblyAnchor;
        rootNodeName?: string;
        boneRemap?: Record<string, string>;
    };
    defaultFaceMode: FaceMode;
    faceMaterials: FaceMaterialSlot[];
    morphChannels?: string[];
    morphChannelBindings?: HeadMorphChannel[];
    proxy: {
        faceColor: string;
        faceShadeColor: string;
        skinColorDefault?: string;
        skinColor1?: string;
        skinColor2?: string;
        hairColor: string;
        hairShadowColor: string;
        headRadius: number;
        faceDepth: number;
        hairArc: number;
    };
};
export type CharacterAssemblyState = {
    bodyAssetId: string;
    headAssetId: string;
    stitchMode: StitchMode;
    headScale: number;
    splitDistance: number;
    headOffset: Vec3;
};
export type CharacterImportCatalog = {
    version: 1;
    id: string;
    displayName: string;
    bodies: BodyAssetManifest[];
    heads: HeadAssetManifest[];
    defaultAssembly: CharacterAssemblyState;
};
export declare const sekaiReferenceDirectionalLocation: Vec3;
export declare function sekaiPluginLightLocationToThreeDirection(location: Vec3): Vec3;
export declare const sekaiCostumeShopDirectionalLightRotationDegrees: Vec3;
export declare const sekaiCostumeShopDirectionalLightDirection: Vec3;
export declare const sekaiCostumeShopRimLightDirection: Vec3;
export declare const sekaiCostumeShopControllerDefaults: {
    readonly ambientColor: {
        readonly r: 0.5;
        readonly g: 0.5;
        readonly b: 0.5;
    };
    readonly ambientIntensity: 1;
    readonly specularColor: {
        readonly r: 1;
        readonly g: 1;
        readonly b: 1;
    };
    readonly specularIntensity: 1;
    readonly rimColor: {
        readonly r: 0.5;
        readonly g: 0.5;
        readonly b: 0.5;
    };
    readonly rimColorAlpha: 1;
    readonly rimRange: 7;
    readonly rimEdgeSmoothness: 0.0010000000474974513;
    readonly rimEmission: 0;
    readonly rimLightInfluence: 1;
    readonly shadowRimColor: {
        readonly r: 0;
        readonly g: 0;
        readonly b: 0;
    };
    readonly rimShadowSharpness: 0.5;
};
export declare const previewLightDirectionFit: Vec3;
export declare const previewShadowThresholdFit = 0.40625;
export declare const previewLightDefaults: PreviewLightState;
export declare const sekaiRuntimeMaterialProfile: SekaiRuntimeMaterialProfile;
export declare const sekaiVrmMigrationProfile: SekaiVrmMigrationProfile;
export declare const characterHeightMetersById: Record<string, number>;
export declare const sampleCatalog: CharacterImportCatalog;
export declare function cloneAssemblyState(assembly: CharacterAssemblyState): CharacterAssemblyState;
export declare function getBodyAsset(catalog: CharacterImportCatalog, bodyAssetId: string): BodyAssetManifest;
export declare function getHeadAsset(catalog: CharacterImportCatalog, headAssetId: string): HeadAssetManifest;
