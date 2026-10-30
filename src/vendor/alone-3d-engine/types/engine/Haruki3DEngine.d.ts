import * as THREE from "three";
import { type RuntimePackageLoadOptions, type RuntimePackageLoadResult } from "../runtime/runtimePackageLoader";
import type { PreviewLightState } from "../data/sampleScene";
import { type UtjSpringBoneDebugOptions, type UtjSpringBoneRuntimeSnapshot, type UtjSpringBoneTraceSnapshot } from "./springRuntimeTypes";
import { type SpringTimelineControl } from "./unityPrefabSpringRuntimeAdapter";
import { type RuntimeConstraintDebug } from "./unityConstraintRuntime";
import type { SpringRuntimeMode } from "../config/viewerConfig";
import type { CustomPartSelection, RuntimePartType } from "../parts/runtimePartComposer";
import { type HarukiRuntimeRenderRecipe } from "../kernel/renderRecipe";
import type { RuntimeCombinedCharacterAsset, RuntimeSkinColors } from "../runtime/runtimeTypes";
import { type PjskCameraProfile, type PjskCameraPreset, type RuntimeCameraDebug } from "../costume_shop/cameraPolicy";
import { type NativeMeshInstallDiagnostics } from "./unityPrefabRuntime";
export type { PjskCameraProfile, PjskCameraPreset, RuntimeCameraDebug, } from "../costume_shop/cameraPolicy";
import { type CostumeShopMotionSnapshot } from "./costumeShopMotion";
export type SpringTimelineControlState = SpringTimelineControl;
export type PjskPresentationMode = "interactive" | "capture";
export type HarukiCameraControls = {
    readonly target: THREE.Vector3;
    enabled?: boolean;
    readonly minPolarAngle: number;
    readonly maxPolarAngle: number;
    update(): void;
    dispose(): void;
};
export type HarukiCameraControlsFactory = (options: {
    camera: THREE.PerspectiveCamera;
    canvas: HTMLCanvasElement;
    target: THREE.Vector3;
    onChange: (target: THREE.Vector3) => void;
}) => HarukiCameraControls;
export type PjskEngineOptions = {
    container?: HTMLElement;
    canvas?: HTMLCanvasElement;
    initialLight?: PreviewLightState;
    presentationMode?: PjskPresentationMode;
    cameraPreset?: PjskCameraPreset;
    cameraProfile?: PjskCameraProfile;
    autoRender?: boolean;
    manageResize?: boolean;
    controlsFactory?: HarukiCameraControlsFactory;
    ktx2TranscoderPath?: string;
    background?: HarukiBackgroundMode;
};
export type HarukiBackgroundMode = "transparent" | "archive";
export type PjskViewerEngineOptions = PjskEngineOptions;
export type Haruki3DEngineOptions = PjskEngineOptions;
export type HarukiRuntimePackageRequest = RuntimePackageLoadOptions & {
    baseUrl: string;
};
export type HarukiRenderResult = {
    selection: CustomPartSelection;
    combinedCharacter: RuntimeCombinedCharacterAsset;
};
export type HarukiEngineSnapshots = {
    animation: AnimationPlaybackSnapshot;
    springBone: SpringBoneRuntimeSnapshot;
    camera: RuntimeCameraDebug;
    runtimeDebug: RuntimeDebugSnapshot;
    utjSpringBoneTrace?: UtjSpringBoneTraceSnapshot | null;
};
export type RuntimePartImportMode = "unity-runtime";
export type CompositionMode = "pending" | "model_combine_setup";
export type PartImportStatus = {
    assetId: string;
    displayName: string;
    sourceMode: RuntimePartImportMode;
    requestedUrl: string;
    meshCount: number;
    boneCount: number;
    skinnedMeshCount: number;
};
export type CompositionStatus = {
    mode: CompositionMode;
    missingBodyBones: string[];
    missingHeadBones: string[];
};
export type AnimationPlaybackSnapshot = CostumeShopMotionSnapshot & {
    activeClipName: string | null;
    currentTime: number;
    duration: number;
    paused: boolean;
    speed: number;
};
export type RuntimeOutlineShellDebug = {
    meshName: string;
    outlineName: string;
    sourceMaterialKind: string | null;
    sourceMaterialKinds: string[];
    sourceMaterialNames: string[];
    hasVertexColor: boolean;
    vertexColorRedMax: number | null;
    renderOrder: number;
    sourceRenderOrder: number;
    hasTangent: boolean;
    hasUv1: boolean;
    hasUv2: boolean;
    useSecondNormal: boolean[];
    wantsSecondNormal: boolean[];
};
export type RuntimeFaceLightDebug = {
    lightDirection: {
        x: number;
        y: number;
        z: number;
    };
    previewLightDirection: {
        x: number;
        y: number;
        z: number;
    };
    costumeShopLightRotationDegrees: {
        x: number;
        y: number;
        z: number;
    };
    faceRightWorld: {
        x: number;
        y: number;
        z: number;
    };
    faceUpWorld: {
        x: number;
        y: number;
        z: number;
    };
    faceForwardWorld: {
        x: number;
        y: number;
        z: number;
    };
    headHorizontalFromUp: {
        x: number;
        y: number;
    };
    headHorizontalFromRight: {
        x: number;
        y: number;
    };
    headHorizontalFromForward: {
        x: number;
        y: number;
    };
    lightHorizontal: {
        x: number;
        y: number;
    };
    headDotDirectionalLight: {
        x: number;
        y: number;
    };
    faceTbnLight: {
        x: number;
        y: number;
        z: number;
    };
    faceLight: {
        side: number;
        front: number;
    };
    faceSdfLimit: number;
    headYawDegrees: number;
    lightYawDegrees: number;
};
export type RuntimeDebugSnapshot = {
    materialBindingMode: "manifest";
    skinColors?: RuntimeSkinColors | null;
    funit: RuntimeFUnitDebug;
    camera?: RuntimeCameraDebug;
    constraints?: RuntimeConstraintDebug | null;
};
export type RuntimeFUnitDebug = {
    present: boolean;
    scriptCount: number;
    springManagerCount: number;
    springBoneCount: number;
    sphereColliderCount: number;
    capsuleColliderCount: number;
    panelColliderCount: number;
    detectedScripts: string[];
    policy: string;
};
export type SpringBoneRuntimeSnapshot = {
    present: boolean;
    runtimePresent: boolean;
    active: boolean;
    bodyManagerCount: number;
    bodySpringBoneCount: number;
    bodyExtraBoneCount: number;
    bodySphereColliderCount: number;
    bodyCapsuleColliderCount: number;
    bodyPanelColliderCount: number;
    headManagerCount: number;
    headSpringBoneCount: number;
    headExtraBoneCount: number;
    headSphereColliderCount: number;
    headCapsuleColliderCount: number;
    headPanelColliderCount: number;
    characterHairPresent: boolean;
    characterEyePresent: boolean;
    vrmSpringBoneManagerPresent: boolean;
    utjRuntime?: UtjSpringBoneRuntimeSnapshot | null;
    source: "PJSK_sekai_runtime" | "none";
};
type CombinedCharacterImportOptions = {
    disposeBeforeLoad?: boolean;
};
export type PartImportSnapshot = {
    revision: number;
    body: PartImportStatus;
    head: PartImportStatus;
    composition: CompositionStatus;
};
type CharacterHairMaterialController = {
    offset: THREE.Vector3;
    headTransformName: string | null;
    headTransformPath: string | null;
};
export declare function readCharacterHairMaterialController(runtimeExtension: unknown): CharacterHairMaterialController | null;
export declare class Haruki3DEngine {
    private readonly container;
    private readonly ownsCanvas;
    private readonly scene;
    private readonly camera;
    private readonly renderer;
    private readonly controls;
    private readonly cameraTarget;
    private readonly autoRender;
    private readonly manageResize;
    private readonly clock;
    private readonly textureLoader;
    private readonly characterRoot;
    private readonly bodySlot;
    private readonly headSlot;
    private readonly sceneReference;
    private capturePresentationEnabled;
    private backgroundMode;
    private archiveBackground;
    private archiveBackgroundBaseUrl;
    private viewportWidth;
    private viewportHeight;
    private viewportPixelRatio;
    private animationFrame;
    private importRevision;
    private customSelectionQueue;
    private customSelectionGeneration;
    private currentCompositionStatus;
    private currentBodyAnimationRoot;
    private costumeShopMotion;
    private costumeShopMotionBaseUrl;
    private costumeShopMotionPaused;
    private costumeShopMotionRoleId;
    onCostumeShopAnimatorEvaluated: (() => void) | null;
    private costumeShopMotionSpeed;
    private currentRuntimeExtension;
    private currentSpringRuntime;
    private currentExtraBoneRuntime;
    private currentConstraintRuntime;
    private currentSpringTimelineControl;
    private currentPrefabSourceGraph;
    private readonly studioLights;
    private officialCharacter;
    private officialUpdatePending;
    private officialUpdateDone;
    private springRuntimeMode;
    private masterCharacterHeightMeters;
    private characterModelScaleMeters;
    private readonly tempVector;
    private readonly tempVectorB;
    private readonly tempQuaternion;
    private currentCameraPreset;
    private currentCameraProfile;
    private cameraRootYawDegrees;
    private readonly studioCamera;
    private readonly characterViewer;
    private studioRenderTexture;
    private viewerComposite;
    private detachViewerInput;
    private readonly drawingBufferSize;
    private cameraDebugChangeCallback;
    private currentLoadedRuntimePackage;
    private lastNativeMeshInstallDiagnostics;
    private lastConstraintSetupDiagnostics;
    private readonly runtimeDebug;
    constructor(containerOrOptions: HTMLElement | PjskEngineOptions, initialLight?: PreviewLightState);
    importCombinedCharacter(characterAsset: RuntimeCombinedCharacterAsset, options?: CombinedCharacterImportOptions): Promise<PartImportSnapshot>;
    setCharacterYawDegrees(degrees: number): void;
    /**
     * CostumeShop view drag. The game rotates CameraRoot while the assembled
     * character remains in place; rotating characterRoot here makes authored
     * spring chains lag behind and looks like static hair/skirt bones are alive.
     */
    setViewYawDegrees(degrees: number): void;
    faceCharacterTowardCamera(): void;
    getRuntimeDebugSnapshot(): {
        nativeMeshes: NativeMeshInstallDiagnostics | null;
        constraints: RuntimeConstraintDebug | null;
        funit: RuntimeFUnitDebug;
        camera: RuntimeCameraDebug;
        materialBindingMode: "manifest";
        skinColors?: RuntimeSkinColors | null;
    };
    getCameraDebugSnapshot(): RuntimeCameraDebug;
    onCameraDebugChange(callback: (() => void) | null): void;
    getSpringBoneSnapshot(debugOptions?: UtjSpringBoneDebugOptions): SpringBoneRuntimeSnapshot;
    setUtjSpringBoneTraceFilters(filters: readonly string[], maxEvents?: number): void;
    getUtjSpringBoneTraceSnapshot(): UtjSpringBoneTraceSnapshot | null;
    getAnimationSnapshot(): AnimationPlaybackSnapshot;
    setAnimationPaused(paused: boolean): void;
    setAnimationSpeed(speed: number): void;
    setUtjSpringBoneEnabled(enabled: boolean): void;
    setSpringRuntimeMode(mode: SpringRuntimeMode): void;
    private resetCurrentSpringRuntimeState;
    private isSpringRuntimeEnabled;
    private createSpringRuntime;
    setSpringTimelineControl(control: SpringTimelineControlState | null): void;
    seekAnimationPhase(phase: number): AnimationPlaybackSnapshot;
    seekAnimationLoopPhase(phase: number): AnimationPlaybackSnapshot;
    private prepareSpringRuntimeForAnimationSeek;
    setPresentationMode(mode: PjskPresentationMode): void;
    setCapturePresentation(enabled: boolean): void;
    private stepCharacterDynamics;
    private costumeShopMotionForCurrentStore;
    private costumeShopAnimatorRoot;
    private costumeShopRenderedMeshes;
    private costumeShopMotionBundle;
    private applyCostumeShopMotionRole;
    getCostumeShopMotionSnapshot(): CostumeShopMotionSnapshot | null;
    stepCaptureFrame(delta: number, advanceAnimation: boolean): void;
    setBackgroundMode(mode: HarukiBackgroundMode, assetBaseUrl?: string): Promise<void>;
    getBackgroundMode(): HarukiBackgroundMode;
    private drawsArchiveBackground;
    getCharacterRoot(): THREE.Group<THREE.Object3DEventMap>;
    getCanvas(): HTMLCanvasElement;
    waitForPostProcessorReady(): Promise<void>;
    setViewportSize(width: number, height: number): void;
    renderFrame(): void;
    private renderCostumeShopViewer;
    private costumeShopViewerLayout;
    private applyStudioCamera;
    private studioCameraState;
    private enterCostumeShopViewer;
    private leaveCostumeShopViewer;
    private attachViewerInput;
    costumeShopViewerTouch(phase: "began" | "moved" | "ended", id: number, x: number, y: number): void;
    getCostumeShopViewerSnapshot(): {
        zoomValue: number;
        zoomMoveValue: number;
        zoomDurationRatio: number;
        cameraLocalPosition: number[];
        cameraRootRotation: number[];
        viewer: {
            touchCount: number;
            collider: "model" | "extended" | "released";
            isZoomIncontinuous: boolean;
            currentPinchCenter: number;
        };
        layout: import("../costume_shop/uiParts3DCharacterViewer").CostumeShopViewerLayout;
    };
    private updateOfficialFrame;
    private cameraRootRotation;
    private prepareOfficialFrame;
    finishCaptureFrame(): void;
    stepRuntimeFrame(delta: number, options?: {
        advanceAnimation?: boolean;
        elapsedTime?: number;
    }): void;
    loadRuntimePackage(request: HarukiRuntimePackageRequest): Promise<RuntimePackageLoadResult>;
    setCustomSelection(selection: CustomPartSelection): Promise<RuntimeCombinedCharacterAsset>;
    updateCustomSelection(partType: RuntimePartType, costume3dId: number | null): Promise<RuntimeCombinedCharacterAsset>;
    loadRenderRecipe(recipe: HarukiRuntimeRenderRecipe): Promise<HarukiRenderResult>;
    private enqueueCustomSelectionMutation;
    private applyCustomSelection;
    private loadRenderRecipeInternal;
    getSnapshots(debugOptions?: UtjSpringBoneDebugOptions): HarukiEngineSnapshots;
    destroy(): void;
    private setCameraTarget;
    private syncCameraTarget;
    private applyCostumeShopCharacterHeight;
    applyCameraPreset(preset: PjskCameraPreset, profile?: PjskCameraProfile): void;
    shiftCameraRight(amount?: number): void;
    private makeImportStatus;
    private resetSlotParents;
    private readonly retiredCharacterObjects;
    private readonly retiredOfficialCharacters;
    private retireCharacterSlot;
    private disposeRetiredCharacters;
    private releaseCurrentCharacterResources;
    private prepareCombinedComposition;
    private loadCombinedCharacterAsset;
    private handleResize;
    private render;
    private syncUnityPrefabSourceGraph;
    private syncOfficialModelCombineSetup;
}
