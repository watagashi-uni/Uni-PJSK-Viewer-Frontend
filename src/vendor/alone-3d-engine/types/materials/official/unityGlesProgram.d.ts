export declare function prepareUnityGlesStage(source: string): string;
export type UnityVertexStageOptions = {
    skinning: boolean;
    morphTargets: {
        count: number;
        stride: number;
        normals: boolean;
        tangents?: boolean;
    } | null;
};
export type UnityVertexInput = {
    name: string;
    precision: string;
    type: string;
};
export declare function readUnityVertexInputs(source: string): UnityVertexInput[];
export declare function buildUnityVertexStage(source: string, options: UnityVertexStageOptions): string;
export declare function buildUnityFragmentStage(source: string): string;
