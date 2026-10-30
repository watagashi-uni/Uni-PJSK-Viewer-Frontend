type Channel = {
    stream: number;
    offset: number;
    format: number;
    dimension: number;
};
export declare const enum VertexChannel {
    Position = 0,
    Normal = 1,
    Tangent = 2,
    Color = 3,
    TexCoord0 = 4,
    TexCoord1 = 5,
    TexCoord2 = 6,
    BlendWeight = 12,
    BlendIndices = 13
}
export type DecodedVertexData = {
    vertexCount: number;
    channel(index: number): {
        dimension: number;
        values: Float32Array | Uint32Array;
    } | null;
};
export declare function decodeVertexData(vertexData: {
    m_VertexCount: number;
    m_Channels: Channel[];
    m_DataSize: Uint8Array;
}, external: Uint8Array | null): DecodedVertexData;
export type UnitySubMesh = {
    firstByte: number;
    indexCount: number;
    topology: number;
    baseVertex: number;
    firstVertex: number;
    vertexCount: number;
};
export type UnityBlendShapes = {
    vertices: {
        vertex: Vec3;
        normal: Vec3;
        tangent: Vec3;
        index: number;
    }[];
    shapes: {
        firstVertex: number;
        vertexCount: number;
        hasNormals: number;
        hasTangents: number;
    }[];
    channels: {
        name: string;
        nameHash: number;
        frameIndex: number;
        frameCount: number;
    }[];
    fullWeights: ArrayLike<number>;
};
type Vec3 = {
    x: number;
    y: number;
    z: number;
};
export type UnityMeshObject = {
    m_Name: string;
    m_SubMeshes: UnitySubMesh[];
    m_Shapes: UnityBlendShapes;
    m_BindPose: Record<string, number>[];
    m_MeshCompression: number;
    m_IndexFormat: number;
    m_IndexBuffer: Uint8Array;
    m_VertexData: {
        m_VertexCount: number;
        m_Channels: Channel[];
        m_DataSize: Uint8Array;
    };
    m_VariableBoneCountWeights: {
        m_Data: ArrayLike<number>;
    };
    m_StreamData: {
        offset: bigint;
        size: number;
        path: string;
    };
};
export type MeshSubmeshOut = {
    start: number;
    count: number;
    indices: Uint32Array;
};
export type MeshMorphOut = {
    name: string;
    indices: Uint32Array;
    positionDeltas: Float32Array;
    normalDeltas: Float32Array | null;
    tangentDeltas: Float32Array | null;
};
export type DecodedMesh = {
    name: string;
    vertexCount: number;
    positions: Float32Array;
    normals: Float32Array | null;
    tangents: Float32Array | null;
    colors: Float32Array | null;
    uv: (Float32Array | null)[];
    skinIndices: Uint16Array | null;
    skinWeights: Float32Array | null;
    submeshes: MeshSubmeshOut[];
    bindPoses: Float32Array;
    morphs: MeshMorphOut[];
};
export declare function decodeMesh(mesh: UnityMeshObject, streamBytes: (path: string, offset: number, size: number) => Uint8Array): DecodedMesh;
export {};
