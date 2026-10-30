import type { HarukiMvRuntime } from "./HarukiMvRuntime";
export declare const HARUKI_MV_BRIDGE_OBJECT = "HarukiMvBridge";
/** Sekai.AssetBundleElement: one row of the version's AssetBundleInfo, as the player resolved it. */
export type HarukiOriginalAssetBundleElement = {
    bundleName: string;
    cacheFileName: string;
    cacheDirectoryName: string;
    hash: string;
    category: string;
    /** Unity bundle CRC: CRC-32 of the decompressed block data. */
    crc: number;
    /** Size of the decrypted UnityFS file. */
    fileSize: number;
    dependencies: string[];
    paths: string[];
    isBuiltin: boolean;
    isRelocate: boolean;
    /** ROW (tw/kr/cn) catalogs only. */
    md5Hash?: string;
    downloadPath?: string;
};
/** Bytes handed to the player: copied once into its heap. A Response must be ok; its body is read whole. */
export type HarukiOriginalBytes = ArrayBuffer | ArrayBufferView | Blob | Response;
/** Bytes, or a URL (string or URL object) the player fetches itself. */
export type HarukiOriginalBytesSource = HarukiOriginalBytes | string | URL;
export type HarukiAssetBundleInfoSummary = {
    version: string;
    os: "android" | "ios" | "";
    bundleCount: number;
};
export type HarukiOriginalBundleSetRequest = {
    /** Bundles the caller's original logic needs; their dependencies come from the AssetBundleInfo. */
    roots: string[];
    /** Required when the AssetBundleInfo does not state its os (the ROW JSON catalogs). */
    os?: "android" | "ios";
    /**
     * Supplies one bundle the player asked for: the original bundle's bytes, decrypted (UnityFS) or as the game's
     * encrypted bytes, or a URL serving them. Requests arrive in load order, a window at a time; answers may come in
     * any order. `signal` aborts when the load ends early.
     */
    provideBundle(bundle: HarukiOriginalAssetBundleElement, context: {
        version: string;
        signal: AbortSignal;
    }): HarukiOriginalBytesSource | Promise<HarukiOriginalBytesSource>;
    /** The whole load order, once, before the first request. */
    onPlan?(bundles: HarukiOriginalAssetBundleElement[], version: string): void;
    /**
     * StreamingLive only: a URL serving the bundle already converted for this WebGL player (the host's own conversion
     * cache), or undefined to supply the original bundle through provideBundle.
     */
    provideWebGlBundle?(bundle: HarukiOriginalAssetBundleElement): string | URL | undefined;
    /** Aborting cancels the load in the player. */
    signal?: AbortSignal;
};
export type HarukiVirtualLiveShowRequest = Pick<HarukiOriginalBundleSetRequest, "provideBundle" | "onPlan" | "signal" | "os"> & {
    virtualLiveId: number;
    /**
     * The game's master rows the boot reads (virtualLives, musicVocals, musics, character3ds, costume3ds, costume3dModels,
     * gameCharacters, gameCharacterUnits): an object of tables, its JSON bytes, or a URL. Rows a live does not use may be
     * left out; a missing row fails the boot where the game's would.
     */
    masterData: HarukiOriginalBytesSource | Record<string, unknown[]>;
    /** The local viewer (same profile as StreamingLive): the local avatar's costume, accessory, skin colour and penlight. */
    viewer?: HarukiStreamingLiveViewerProfile;
    /**
     * Session fields the game takes from its server or the user's settings: players, cameraControl, ui, shout, the
     * local avatar's placement, item display options, camera and monitor settings. Audience, items, logout time and the
     * local avatar's appearance come from master data (configs, penlightColors, avatarMotions, avatarCostumes,
     * avatarAccessories, avatarSkinColors, avatarCoordinates, penlights and the live's virtualItems).
     */
    venue?: Record<string, unknown>;
    /** The game starts in the lobby; the player skips it unless this is true. */
    includeLobby?: boolean;
    /** After each of the two downloads (the game's pre-download and its main download). */
    onBundles?(phase: "pre-download" | "download", info: {
        bundleCount: number;
        skipped: string[];
        catalogDifferences: string[];
    }): void;
};
/** Sekai.UserCharacterCostume3D: the 3D costume a user dresses a character in (costume3ds ids, models of `unit`). */
/** `mv-ready`: sent only once every player (the main MV and each cut-in) has drawn and its characters are complete. */
export type HarukiMvReady = {
    requestId?: string;
    musicId: number;
    cutInCount: number;
    durationSeconds: number;
    /** Every cut-in the MVData declares, in order; `loaded` ones can be switched with setCutInEnabled. */
    cutIns: {
        cutInOrder: number;
        musicId: number;
        loaded: boolean;
        enabled: boolean;
    }[];
};
export type HarukiMvCostume3D = {
    characterId: number;
    unit: string;
    headCostume3dId: number;
    hairCostume3dId: number;
    bodyCostume3dId: number;
};
export type HarukiMvShowRequest = Pick<HarukiOriginalBundleSetRequest, "provideBundle" | "onPlan" | "signal" | "os"> & {
    musicId: number;
    /** The vocal the user picked: its music/long bundle is the BGM. */
    musicVocalId: number;
    /**
     * The game's master rows the boot reads (musics, musicVocals, gameCharacters, gameCharacterUnits, costume3ds,
     * costume3dModels): an object of tables, its JSON bytes, or a URL. Rows the MV does not use may be left out.
     */
    masterData: HarukiOriginalBytesSource | Record<string, unknown[]>;
    /** The formation (the game's deck members after CreateMembers): one costume per main MVData character slot. */
    members: HarukiMvCostume3D[];
    /**
     * The cut-ins the deck unlocks (Another cut-ins play only when listed; Normal ones always play), each optionally with
     * the member that plays it; without one the player takes the formation member of the cut-in's character.
     */
    cutIns?: {
        musicId: number;
        member?: HarukiMvCostume3D;
    }[];
    /** Host switch; the game has none, so only an explicit false turns cut-ins off. */
    enableCutIns?: boolean;
    bestEffortCutIns?: boolean;
    canSkipDisplayMusicInfo?: boolean;
    /** The opening overlay's text; its jacket comes from the music row. Absent: no overlay. */
    musicInfo?: HarukiMvMusicInfo;
    /** After each download: the MVData, the cut-in MVData, then the main download. */
    onBundles?(phase: "mv-data" | "cut-in-mv-data" | "download", info: {
        bundleCount: number;
        skipped: string[];
        catalogDifferences: string[];
    }): void;
};
export type HarukiMvPrefabRequest = {
    bundleName: string;
    assetName: string;
};
export type HarukiMvAssetRequest = {
    bundleName: string;
    assetName: string;
};
export declare const HARUKI_MV_RENDER_PRESETS: {
    readonly "720p": {
        readonly width: 1280;
        readonly height: 720;
    };
    readonly "1080p": {
        readonly width: 1920;
        readonly height: 1080;
    };
    readonly "1440p": {
        readonly width: 2560;
        readonly height: 1440;
    };
    readonly "4k-uhd": {
        readonly width: 3840;
        readonly height: 2160;
    };
};
export type HarukiMvFixedRenderResolution = keyof typeof HARUKI_MV_RENDER_PRESETS;
type HarukiMvRenderTiming = {
    refreshRate: number;
    use120Fps: boolean;
    /**
     * False (default): the profile's rate is the viewer's explicit limit and overrides the game.
     * True: start at that rate, then follow the game's own CP.FramerateUtility.SetFrameRate
     * (StreamingLive / Virtual Live quality: high 60, default 30, low 30).
     */
    followGameFrameRate?: boolean;
    /** Original MV quality; fixed output sizes default to the existing high quality. */
    quality?: "default" | "high" | "virtual-live-default";
};
type HarukiMvDeviceRenderProfileRequest = HarukiMvRenderTiming & {
    resolution?: "device";
    width: number;
    height: number;
    dpi: number;
    quality: "default" | "high" | "virtual-live-default";
    playMode: "ingame-3dmv" | "music-video";
};
type HarukiMvFixedRenderProfileRequest = HarukiMvRenderTiming & {
    resolution: HarukiMvFixedRenderResolution;
};
type HarukiMvCustomRenderProfileRequest = HarukiMvRenderTiming & {
    resolution: "custom";
    width: number;
    height: number;
};
export type HarukiMvRenderProfileRequest = HarukiMvDeviceRenderProfileRequest | HarukiMvFixedRenderProfileRequest | HarukiMvCustomRenderProfileRequest;
export type HarukiMvRenderProfile = {
    renderWidth: number;
    renderHeight: number;
    postEffectWidth: number;
    postEffectHeight: number;
    targetFrameRate: number;
};
/**
 * Loader scheduling knobs (Unity MvLoaderTuning). They change scheduling and storage only, never the
 * loaded content; fields left out take Unity's defaults. Applied to the next bundle-set load.
 */
export type HarukiMvLoaderTuning = {
    mvDownloads: number;
    mvPrefetchBytes: number;
    mvSyncLoad: boolean;
    keepSourceLz4: boolean;
    gcEveryBundles: number;
    /** ASTC mip decodes in this many Web Workers; 0 decodes on the main thread. */
    astcWorkers: number;
    /** Log a SHA-256 over every converted bundle (for comparing tunings). */
    checksum: boolean;
    /** Compare original bundles' CRC with their AssetBundleInfo rows and report differences (the game does not check). */
    catalogCrc: boolean;
    slDownloads: number;
    slPrefetchBytes: number;
    slExpandedBytes: number;
    slFrameBudgetMs: number;
    slPrefetchArchive: boolean;
    slLazyOpen: boolean;
    slOnDemand: boolean;
    slLogOpens: boolean;
};
/** The opening overlay (MusicInfoView) of an MV: texts, and optionally the jacket and wording overrides. */
export type HarukiMvMusicInfo = {
    title: string;
    lyricist?: string;
    composer?: string;
    arranger?: string;
    vocalText?: string;
    difficulty?: string;
    jacketBundleName?: string;
    jacketAssetName?: string;
    creatorWordingFormat?: string;
    singerWordingFormat?: string;
    playStartEffectEnabled?: boolean;
};
export type HarukiMvFrameRateLimit = {
    /** The rate in effect (Application.targetFrameRate). */
    targetFrameRate: number;
    /** The game's last request, 0 when none. */
    gameFrameRate: number;
    /** The viewer's explicit limit, 0 when following the game. */
    viewerFrameRate: number;
};
/** MvOriginalSound phases (MusicVideoController order). */
export type HarukiMvAudioPhase = "idle" | "waitingforoutput" | "preparing" | "prepared" | "playing" | "paused" | "finished";
/** The `state` event (`getState()` and playback transitions). Audio fields come from CRI. */
export type HarukiMvPlaybackState = {
    state: "empty" | "paused" | "preparing" | "playing" | "completed";
    /** The music has ended and the exit tail plays (`finished` follows). */
    finishing: boolean;
    timeSeconds: number;
    durationSeconds: number;
    absoluteTimeSeconds: number;
    playbackStartSeconds: number;
    frameCount: number;
    targetFrameRate: number;
    screenWidth: number;
    screenHeight: number;
    virtualLiveStateIndex: number;
    /** The MV cue sheet and cue ("" without an assembled MV). */
    cueSheet: string;
    cueName: string;
    audioPhase: HarukiMvAudioPhase;
    /** CriAtomExPlayback.status of the BGM playback: "none", "prep", "playing" or "removed". */
    playbackStatus: "none" | "prep" | "playing" | "removed";
    /** The playback's audio-synced time (criAtomExPlayback_GetTimeSyncedWithAudio), -1 without one. */
    playbackTimeMs: number;
    /** The game's currentMusicTimeMs (SoundManager.GetAudioSyncedUnityTimer), -1 without a sound. */
    musicTimeMs: number;
    /** PCM frames (48 kHz) queued in the Atom output. */
    outputQueued: number;
    /** The Atom output device runs (its AudioContext is not suspended). */
    outputRunning: boolean;
    /** The Atom AudioContext waits for a user gesture. */
    outputNeedsGesture: boolean;
    /** The page volume in effect (setVolume). */
    volume: number;
};
/** Parses and checks a `state` event payload; throws on a malformed one. */
export declare function parseHarukiMvState(payload: string): HarukiMvPlaybackState;
export type HarukiMvBridge = {
    /**
     * Boots a StreamingLive archive from original bundles as the game does: the StreamingLiveData, then
     * StreamingLiveUtility.GetDownloadStreamingLiveCommonAssetBundleList, the archive and the viewer's avatar.
     * Requires setAssetBundleInfo. Every bundle is requested once at load and handed to the player as a URL (bytes
     * become object URLs, kept until unloadStreamingLiveArchive): archives are fetched during playback.
     */
    loadStreamingLiveArchiveShow(request: HarukiStreamingLiveArchiveShowRequest): Promise<HarukiStreamingLiveState>;
    setStreamingLivePaused(paused: boolean): Promise<HarukiStreamingLiveState>;
    seekStreamingLive(timeSeconds: number): Promise<HarukiStreamingLiveState>;
    /** Zero-based index in sekai.rlh; a master setlist's chapterId maps to chapterId - 1. */
    selectStreamingLiveChapter(chapterIndex: number): Promise<HarukiStreamingLiveState>;
    getStreamingLiveState(): Promise<HarukiStreamingLiveState>;
    /** The option dialog path: stores VLQuality, then StreamingLiveController.OnUpdateSettings. */
    setStreamingLiveQuality(quality: HarukiStreamingLiveQuality): Promise<HarukiStreamingLiveState>;
    applyStreamingLiveInput(request: HarukiStreamingLiveInput): Promise<HarukiStreamingLiveState>;
    /** Also cancels a pending archive load and rejects its promise. */
    unloadStreamingLiveArchive(): Promise<unknown>;
    /** The version's AssetBundleInfo (decrypted MessagePack, or the ROW JSON); kept for later original loads. */
    setAssetBundleInfo(source: HarukiOriginalBytesSource): Promise<HarukiAssetBundleInfoSummary>;
    /**
     * Loads roots and their dependencies from original bundles the caller supplies. `catalogDifferences` lists
     * bundles whose size (or, with the catalogCrc tuning, CRC) differs from their AssetBundleInfo row: the game loads
     * them regardless, and so does the player.
     */
    loadOriginalBundleSet(request: HarukiOriginalBundleSetRequest): Promise<{
        bundleCount: number;
        catalogDifferences: string[];
    }>;
    /**
     * Boots an original Virtual Live as the game does (VirtualLiveBootData: pre-download, per-setlist setup, download),
     * on original bundles the caller supplies, compiles its program and loads it. Requires setAssetBundleInfo.
     */
    loadVirtualLiveShow(request: HarukiVirtualLiveShowRequest): Promise<unknown>;
    /**
     * Boots an original MV as the game does (BootAssetUtility: MVData pre-download, cut-in MVData, the music video
     * download list from the formation), on original bundles the caller supplies, then assembles it. Requires
     * setAssetBundleInfo. Resolves with the mv-ready payload.
     */
    loadMvShow(request: HarukiMvShowRequest): Promise<HarukiMvReady>;
    /** Instantiates a prefab of the loaded original bundle set (diagnostics). */
    instantiatePrefab(request: HarukiMvPrefabRequest): Promise<unknown>;
    readMvData(request: HarukiMvAssetRequest): Promise<unknown>;
    getRenderProfile(request: HarukiMvRenderProfileRequest): Promise<HarukiMvRenderProfile>;
    /** Applies the selected output pixels and frame-rate target inside Unity. */
    applyRenderProfile(request: HarukiMvRenderProfileRequest): Promise<HarukiMvRenderProfile>;
    /**
     * The frame-rate axis alone. "game" follows the game's own requests (MV 60/120 by the render
     * profile; StreamingLive / Virtual Live quality high 60, default 30, low 30); a number is the
     * viewer's explicit limit. Resolution and quality are unchanged.
     */
    setFrameRateLimit(frameRate: "game" | number): Promise<HarukiMvFrameRateLimit>;
    setLoaderTuning(tuning: Partial<HarukiMvLoaderTuning>): Promise<HarukiMvLoaderTuning>;
    skipVirtualLiveState(): void;
    applyVirtualLiveInput(request: HarukiVirtualLiveInput): Promise<unknown>;
    /** Must be called from a click/tap where the browser requires sensor permission. */
    enableVirtualLiveGyro(): Promise<() => void>;
    setCutInActive(cutInOrder: number, active: boolean): void;
    /**
     * The cut-in switch (the game's CutInFlags): off skips that cut-in from its next start, on plays it from its next
     * start; one on screen finishes. Only cut-ins the load included can be turned on (HarukiMvReady.cutIns `loaded`).
     */
    setCutInEnabled(cutInOrder: number, enabled: boolean): void;
    setPaused(paused: boolean): void;
    /**
     * Page volume 0..1, like a device volume: the CRI output device's gain after every Atom session (MV, Virtual Live,
     * StreamingLive), behind the ACF MasterOut limiter, kept across sessions. The game's own volumes stay as they are.
     */
    setVolume(volume: number): void;
    seek(timeSeconds: number): void;
    retry(): void;
    getState(): void;
    disposeScene(): Promise<unknown>;
};
export type HarukiStreamingLiveViewerProfile = {
    /** Original Int64 identity, kept as a string to avoid JavaScript precision loss. */
    userId: string;
    nickName: string;
    costumeId: number;
    skinColorId: number;
    accessoryId: number;
    coordinateId: number;
    penlightId: number;
    /** Localized WORD_DEFAULT_USER_NAME text used for blocked names. */
    defaultUserName: string;
    blockedUserIds?: string[];
};
export type HarukiStreamingLiveInput = {
    kind: "move";
    direction: {
        x: number;
        y: number;
    };
} | {
    kind: "move-finish";
} | {
    kind: "emote";
    actionId: number;
} | {
    kind: "penlight-right" | "penlight-left";
    /** A positive main ID takes precedence; both IDs <= 0 selects the original off sentinel. */
    penlightColorId: number;
    subGameCharacterPenlightColorId: number;
} | {
    kind: "swing-penlights";
} | {
    kind: "time-event";
    power: number;
} | {
    kind: "stamp";
    stampId: number;
} | {
    kind: "custom-stamp";
    stampName: string;
    balloonId: number;
}
/**
 * Original GestureManager tap lock-on: send only taps released within 0.5 s. `position` is in
 * Unity screen pixels (drawing-buffer pixels, bottom-left origin); see `streamingLiveTapPosition`.
 */
 | {
    kind: "lock-on-tap";
    position: {
        x: number;
        y: number;
    };
} | {
    kind: "lock-on";
    characterId: number;
} | {
    kind: "lock-on-cancel";
}
/**
 * Original GestureManager.OnPinchScale: `zoom` is the GyroCamera zoom-rate change (pinch distance
 * change in centimetres / 5; the full range is 0..1). Also disables the tap lock-on for 0.3 s.
 * See `streamingLivePinchZoom` and `streamingLiveWheelZoom`.
 */
 | {
    kind: "zoom";
    zoom: number;
};
/** Original VLQuality: 0 high (60 fps), 1 default (30 fps, the game's default), 2 low (30 fps). */
export type HarukiStreamingLiveQuality = 0 | 1 | 2;
/** `streaming-live-layout`: normalized rectangles relative to the Unity output, top-left origin. */
export type HarukiStreamingLiveLayout = {
    timeEventButtons: {
        x: number;
        y: number;
        width: number;
        height: number;
    }[];
};
/** `streaming-live-stamp`: the original local front-view display request. */
export type HarukiStreamingLiveStamp = {
    stampName: string;
    balloonName: string;
    appearTime: number;
    scale: number;
};
export type HarukiStreamingLiveArchiveShowRequest = Pick<HarukiOriginalBundleSetRequest, "provideBundle" | "provideWebGlBundle" | "onPlan" | "signal" | "os"> & {
    archiveId: number;
    viewer: HarukiStreamingLiveViewerProfile;
    /**
     * The original master tables StreamingLive reads (streamingLiveArchives, virtualLives, configs, clientConfigs,
     * gameCharacters, gameCharacterUnits, stamps, penlightColors, subGameCharacterPenlightColors, virtualItems,
     * avatarCostumes, avatarAccessories, avatarSkinColors, avatarCoordinates, avatarMotions, penlights, character2ds):
     * an object of tables, its JSON bytes, or a URL.
     */
    masterData: HarukiOriginalBytesSource | Record<string, unknown[]>;
    chapterIndex?: number;
    startSeconds?: number;
    forceAfterEvent?: boolean;
    /** Bundles supplied by provideWebGlBundle to fetch with the set (the show's setup); the others are fetched when needed. */
    preloadBundles?: string[];
    /** [archive seconds, bundle] of the later provideWebGlBundle bundles: fetched in the background ahead of the clock and before a jump settles. */
    schedule?: [number, string][];
    /** [chapter start seconds, bundles] a jump to that chapter uses: fetched before the jump settles. */
    jumps?: [number, string[]][];
    quality?: HarukiStreamingLiveQuality;
    /** After the StreamingLiveData download and after the main download. */
    onBundles?(phase: "streaming-data" | "download", info: {
        bundleCount: number;
        skipped: string[];
        catalogDifferences: string[];
    }): void;
};
export type HarukiStreamingLiveState = {
    requestId?: string;
    archiveId: number;
    ready: boolean;
    paused: boolean;
    loading: boolean;
    finished: boolean;
    liveState: number;
    chapterIndex: number;
    timeSeconds: number;
    durationSeconds: number;
    bufferTime: number;
    quality: HarukiStreamingLiveQuality | -1;
    /** Application.targetFrameRate as currently set. */
    targetFrameRate: number;
    /** Game character ID of the lock-on target, -1 when none. */
    lockOnCharacterId: number;
    /** GyroCamera.SwipeZoomRate, 0 (widest) to 1. */
    zoomRate: number;
    header?: {
        version: string;
        baseTicks: number;
        delayTime: number;
        splitSeconds: number;
        splitFileIds: number[];
        chapterBlocks: {
            blocks: {
                enabled: boolean;
                start: number;
                end: number;
                name: string;
            }[];
        };
    } | null;
    setlist?: {
        id: number;
        seq: number;
        chapterId: number;
        name: string;
        characterIds: number[];
        virtualLiveSetlistType: string;
        musicId: number;
    }[] | null;
};
export type HarukiVirtualLiveInput = {
    operation: "state" | "rotate" | "zoom" | "recenter" | "lock" | "unlock" | "gyro" | "quality" | "move" | "warp" | "emote" | "swing" | "penlight" | "jump" | "appearance" | "names" | "item" | "throwItem" | "farItem";
    delta?: {
        x: number;
        y: number;
    };
    position?: {
        x: number;
        y: number;
        z: number;
    };
    endPosition?: {
        x: number;
        y: number;
        z: number;
    };
    itemId?: number;
    isMine?: boolean;
    appearance?: Record<string, unknown>;
    avatarId?: string;
    characterId?: number;
    motionId?: number;
    value?: number;
    enabled?: boolean;
    left?: boolean;
    color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    quality?: 0 | 1 | 2;
};
/** Typed browser-side contract for the Unity HarukiMvBridge component. */
export declare function createHarukiMvBridge(runtime: HarukiMvRuntime): HarukiMvBridge;
/** Converts a pointer position on the canvas to Unity screen pixels (bottom-left origin). */
export declare function streamingLiveTapPosition(canvas: HTMLCanvasElement, clientX: number, clientY: number): {
    x: number;
    y: number;
};
/**
 * GestureManager.OnPinchScale converts a pinch distance change to centimetres (pixels / (dpi / 2.54))
 * and divides by 5. A CSS pixel is 1/96 inch, so the same physical pinch gives the same rate.
 */
export declare function streamingLivePinchZoom(distanceChangeCssPixels: number): number;
/**
 * Mouse wheel, as the VL host maps it (VirtualLiveCameraInput.Scroll): 0.05 per wheel step, wheel up
 * zooms in. A step is 100 pixels or 3 lines of `deltaY`.
 */
export declare function streamingLiveWheelZoom(event: Pick<WheelEvent, "deltaY" | "deltaMode">): number;
export {};
