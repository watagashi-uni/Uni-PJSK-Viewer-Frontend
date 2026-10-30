import * as THREE from "three";
export type UnityGlobalValue = number | readonly number[] | Float32Array | THREE.Texture;
export declare class UnityShaderGlobals {
    maximumLOD: number;
    private readonly values;
    private version;
    get revision(): number;
    setFloat(name: string, value: number): void;
    setInt(name: string, value: number): void;
    setVector(name: string, x: number, y: number, z: number, w: number): void;
    setColor(name: string, color: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): void;
    setFloatArray(name: string, values: readonly number[]): void;
    setVectorArray(name: string, values: readonly (readonly [number, number, number, number])[]): void;
    setTexture(name: string, texture: THREE.Texture): void;
    get(name: string): UnityGlobalValue | undefined;
    private set;
}
