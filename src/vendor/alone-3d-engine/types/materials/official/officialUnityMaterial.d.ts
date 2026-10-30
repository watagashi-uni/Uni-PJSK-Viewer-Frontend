import * as THREE from "three";
import { type UnityVertexStageOptions } from "./unityGlesProgram";
export type OfficialStateValue = {
    value: number;
    property: string | null;
};
export type OfficialBlendState = Record<"srcBlend" | "destBlend" | "srcBlendAlpha" | "destBlendAlpha" | "blendOp" | "blendOpAlpha" | "colMask", OfficialStateValue>;
export type OfficialStencilState = Record<"pass" | "fail" | "zFail" | "comp", OfficialStateValue>;
export type OfficialPassState = Record<"zClip" | "zTest" | "zWrite" | "culling" | "conservative" | "offsetFactor" | "offsetUnits" | "alphaToMask" | "stencilRef" | "stencilReadMask" | "stencilWriteMask", OfficialStateValue> & {
    blend: OfficialBlendState[];
    separateBlend: boolean;
    stencilOp: OfficialStencilState;
    stencilOpFront: OfficialStencilState;
    stencilOpBack: OfficialStencilState;
};
export type OfficialVariant = {
    keywords: string[];
    program: string;
    shaderRequirements: number;
};
export type OfficialPass = {
    owner: string;
    name: string;
    tags: Record<string, string>;
    state: OfficialPassState;
    keywordSpace: string[];
    variants: OfficialVariant[];
};
export type OfficialProperty = {
    name: string;
    type: number;
    default: number | number[] | {
        name: string;
        dimension: number;
    };
    flags: number;
};
export type OfficialSubShader = {
    lod: number;
    tags: Record<string, string>;
    passes: OfficialPass[];
};
export type OfficialShaderTable = {
    shader: string;
    properties: OfficialProperty[];
    subShaders: OfficialSubShader[];
    programs: Record<string, {
        vertex: string;
        fragment: string;
    }>;
};
export declare function selectOfficialSubShader(table: OfficialShaderTable, maximumLOD: number): OfficialSubShader;
export declare function findOfficialPass(sub: OfficialSubShader, name: string): OfficialPass;
export declare function selectOfficialVariant(pass: OfficialPass, enabledKeywords: Iterable<string>): OfficialVariant;
export type UnityUniformDeclaration = {
    name: string;
    type: string;
    arraySize: number | null;
};
export declare function readUnityUniforms(...stages: string[]): UnityUniformDeclaration[];
export type OfficialMaterialPropertySource = {
    float(name: string): number | null;
    color(name: string): [number, number, number, number] | null;
};
export declare function applyOfficialPassState(material: THREE.Material, table: OfficialShaderTable, pass: OfficialPass, properties: OfficialMaterialPropertySource): void;
export type OfficialPassMaterial = {
    material: THREE.RawShaderMaterial;
    pass: OfficialPass;
    variant: OfficialVariant;
    uniforms: UnityUniformDeclaration[];
};
export declare function createOfficialPassMaterial(table: OfficialShaderTable, pass: OfficialPass, enabledKeywords: Iterable<string>, vertexOptions: UnityVertexStageOptions, properties: OfficialMaterialPropertySource): OfficialPassMaterial;
