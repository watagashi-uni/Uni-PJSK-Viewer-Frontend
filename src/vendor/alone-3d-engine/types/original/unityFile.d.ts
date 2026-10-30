export declare class Cursor {
    readonly bytes: Uint8Array;
    little: boolean;
    readonly view: DataView;
    offset: number;
    constructor(bytes: Uint8Array, little?: boolean);
    ensure(count: number): void;
    take(count: number): Uint8Array<ArrayBufferLike>;
    u8(): number;
    i8(): number;
    u16(): number;
    i16(): number;
    u32(): number;
    i32(): number;
    i64(): bigint;
    u64(): bigint;
    f32(): number;
    f64(): number;
    align(n?: number): void;
    cstring(): string;
    count(max?: number): number;
}
export declare function decompressLz4(source: Uint8Array, size: number): Uint8Array;
export type UnityFsNode = {
    path: string;
    flags: number;
    bytes: Uint8Array;
};
export type UnityFs = {
    unityVersion: string;
    unityRevision: string;
    nodes: Map<string, UnityFsNode>;
};
export declare function readUnityFs(bytes: Uint8Array): UnityFs;
export type PPtr = {
    m_FileID: number;
    m_PathID: bigint;
};
export type SerializedObject = {
    pathId: bigint;
    classId: number;
    typeName: string;
    scriptTypeIndex: number;
    byteStart: number;
    byteSize: number;
    read<T = Record<string, unknown>>(): T;
};
export type SerializedExternal = {
    path: string;
    type: number;
};
export type SerializedFile = {
    unityVersion: string;
    targetPlatform: number;
    objects: Map<bigint, SerializedObject>;
    externals: SerializedExternal[];
};
export declare function readSerializedFile(bytes: Uint8Array): SerializedFile;
