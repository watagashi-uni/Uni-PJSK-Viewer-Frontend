import * as THREE from "three";
import { type CostumeShopViewerLayout } from "./uiParts3DCharacterViewer";
export declare function createStudioRenderTexture(): THREE.WebGLRenderTarget<THREE.Texture>;
export declare class CostumeShopViewerComposite {
    private readonly scene;
    private readonly camera;
    private readonly shadow;
    private readonly model;
    private readonly matrixVP;
    constructor(texture: THREE.Texture);
    render(renderer: THREE.WebGLRenderer, layout: CostumeShopViewerLayout, background: THREE.Scene["background"], clear?: boolean): void;
    dispose(): void;
}
