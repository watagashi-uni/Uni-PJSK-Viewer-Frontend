import { type PPtr, type SerializedFile, type SerializedObject } from "./unityFile";
export declare const enum ClassId {
    GameObject = 1,
    Transform = 4,
    Material = 21,
    MeshRenderer = 23,
    Texture2D = 28,
    MeshFilter = 33,
    Mesh = 43,
    Shader = 48,
    AnimationClip = 74,
    Animator = 95,
    MonoBehaviour = 114,
    MonoScript = 115,
    SkinnedMeshRenderer = 137,
    AssetBundle = 142
}
export type UnityGameObject = {
    m_Component: {
        component: PPtr;
    }[];
    m_Layer: number;
    m_Name: string;
    m_Tag: number;
    m_IsActive: boolean;
};
export type UnityTransform = {
    m_GameObject: PPtr;
    m_LocalRotation: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    m_LocalPosition: {
        x: number;
        y: number;
        z: number;
    };
    m_LocalScale: {
        x: number;
        y: number;
        z: number;
    };
    m_Children: PPtr[];
    m_Father: PPtr;
};
type ContainerEntry = {
    first: string;
    second: {
        preloadIndex: number;
        preloadSize: number;
        asset: PPtr;
    };
};
export type UnityAssetBundle = {
    m_Name: string;
    m_PreloadTable: PPtr[];
    m_Container: ContainerEntry[];
    m_Dependencies: string[];
};
export declare class OriginalBundle {
    readonly name: string;
    readonly serialized: SerializedFile;
    private readonly streams;
    private readonly pathCache;
    readonly assetBundle: UnityAssetBundle;
    readonly cabName: string;
    constructor(name: string, bytes: Uint8Array);
    get objects(): Iterable<SerializedObject>;
    object(pathId: bigint): SerializedObject | null;
    local(pptr: PPtr | null | undefined): SerializedObject | null;
    read<T>(pptr: PPtr | null | undefined): T | null;
    externalCab(fileId: number): string | null;
    stream(path: string, offset: number, size: number): Uint8Array;
    resource(resourceName: string, expectedContainerSuffix: string): {
        containerPath: string;
        root: SerializedObject;
        objects: SerializedObject[];
    };
    transformPath(transformPathId: bigint): string;
    gameObjectTransform(gameObject: UnityGameObject): bigint | null;
    script(mono: {
        m_Script: PPtr;
    }): {
        name: string;
        namespace: string;
    };
}
export {};
