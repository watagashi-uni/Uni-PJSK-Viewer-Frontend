import * as THREE from "three";
export declare class RuntimeTextureLoader {
    private readonly imageLoader;
    private readonly ktx2Loader;
    constructor(renderer: THREE.WebGLRenderer, transcoderPath?: string);
    loadAsync(url: string): Promise<THREE.Texture>;
    dispose(): void;
}
