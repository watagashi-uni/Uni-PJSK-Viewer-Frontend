import type { ModelRenderStudioCamera } from "./modelRenderStudio";
export declare const BASE_SCREEN_SIZE: readonly [1920, 1080];
export declare const COSTUME_SHOP_VIEWER_LAYOUT: {
    readonly viewerAnchoredX: -583;
    readonly shadowAnchoredX: 35;
    readonly shadowColor: readonly [0.26666668, 0.26666668, 0.4, 0.10196079];
    readonly modelColor: readonly [1, 1, 1, 1];
};
export type ScreenRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type CostumeShopViewerLayout = {
    screenWidth: number;
    screenHeight: number;
    scaleFactor: number;
    contentWidth: number;
    contentHeight: number;
    modelTexture: ScreenRect;
    shadowTexture: ScreenRect;
};
export declare function costumeShopViewerLayout(screenWidth: number, screenHeight: number): CostumeShopViewerLayout;
export declare class UIParts3DCharacterViewer {
    private readonly studio;
    private readonly pointerList;
    private readonly gestureData;
    private currentPinchCenter;
    private prevTouchCount;
    private isZoomIncontinuous;
    private colliderState;
    private readonly touches;
    private readonly pointerData;
    constructor(studio: ModelRenderStudioCamera);
    touchBegan(id: number, x: number, y: number): void;
    touchMoved(id: number, x: number, y: number): void;
    touchEnded(id: number, x: number, y: number): void;
    update(layout: CostumeShopViewerLayout, hasModel: boolean): void;
    get snapshot(): {
        touchCount: number;
        collider: "model" | "extended" | "released";
        isZoomIncontinuous: boolean;
        currentPinchCenter: number;
    };
    private colliderContains;
    private onPointerDown;
    private onPointerUp;
    private listenerPointerDown;
    private listenerPointerUp;
    private listenerUpdate;
    private onDrag;
    private onPinchScale;
    private updatePinch;
    private updatePinchCenter;
    private calculatePinchCenterY;
    private onPinchScaleEnd;
}
