import * as THREE from "three";
import type { CostumeShopViewerLayout } from "./uiParts3DCharacterViewer";
type CurveKey = readonly [number, number, number, number];
export declare const ARCHIVE_VIEWER_BACKGROUND: {
    readonly panelSize: readonly [759.5499877929688, 647.280029296875];
    readonly backgroundSize: readonly [2338, 1440];
    readonly particleScale: 100;
    readonly tri: {
        readonly duration: 6;
        readonly rate: 8;
        readonly lifetime: readonly [6, 7];
        readonly speed: readonly [0.5, 2.200000047683716];
        readonly size: readonly [1, 5];
        readonly startRotation: readonly [-6.283185005187988, 6.283185005187988];
        readonly angularVelocityXY: readonly [-0.6108652353286743, 0.6108652353286743];
        readonly angularVelocityZ: readonly [-1.570796251296997, 1.570796251296997];
        readonly radius: 2.0999999046325684;
        readonly radiusThickness: 0.7599999904632568;
        readonly sizeCurve: readonly CurveKey[];
        readonly alphaKeys: readonly [readonly [0, 0], readonly [number, 1], readonly [number, 1], readonly [1, 0]];
        readonly frameRange: readonly [0, 0.9998999834060669];
        readonly tiles: readonly [2, 2];
    };
    readonly flare: {
        readonly duration: 5;
        readonly lifetime: 5;
        readonly size: 15;
        readonly sizeMultiplier: 2;
        readonly offset: readonly [0, -3.4200000762939453];
        readonly sizeCurve: readonly CurveKey[];
        readonly color: readonly [0.16078431904315948, 0.22817322611808777, 0.9137254953384399];
        readonly alphaKeys: readonly [readonly [0, 0], readonly [number, 1], readonly [number, 1], readonly [1, 0]];
        readonly startFrame: 0.5;
        readonly tiles: readonly [2, 2];
    };
};
export declare function evaluateCurve(keys: readonly CurveKey[], time: number): number;
export declare function evaluateAlpha(keys: readonly (readonly [number, number])[], time: number): number;
type TriParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    startSize: number;
    lifetime: number;
    age: number;
    rotation: [number, number, number];
    angularVelocity: [number, number, number];
    frame: number;
};
export declare class ArchiveViewerParticles {
    readonly tri: TriParticle[];
    flareAge: number;
    private emission;
    private readonly random;
    constructor(seed?: number);
    private between;
    step(deltaTime: number): void;
    prewarm(): void;
}
export type ArchiveViewerBackgroundTextures = {
    background: THREE.Texture;
    triangles: THREE.Texture;
    flare: THREE.Texture;
};
export declare function loadArchiveViewerBackgroundTextures(baseUrl: string): Promise<ArchiveViewerBackgroundTextures>;
export declare class ArchiveViewerBackground {
    private readonly textures;
    readonly simulation: ArchiveViewerParticles;
    private readonly scene;
    private readonly camera;
    private readonly matrixVP;
    private readonly screenParams;
    private readonly backgroundMesh;
    private readonly backgroundPositions;
    private readonly triMesh;
    private triPositions;
    private triColors;
    private triUVs;
    private readonly flareMesh;
    private readonly flarePositions;
    private readonly flareColors;
    private readonly opaqueMesh;
    private capacity;
    underlayColor: THREE.Color;
    constructor(textures: ArchiveViewerBackgroundTextures, seed?: number);
    private setTriAttributes;
    private ensureCapacity;
    step(deltaTime: number): void;
    private layout;
    render(renderer: THREE.WebGLRenderer, layout: CostumeShopViewerLayout, centreX?: number): void;
    dispose(): void;
}
export {};
