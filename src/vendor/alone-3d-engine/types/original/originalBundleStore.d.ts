import { OriginalBundle } from "./unityBundle";
export type OriginalBundleIndexEntry = {
    file: string;
    size: number;
    rawSize: number;
    sha256: string;
    dependencies: string[];
};
export type OriginalBundleIndex = {
    version: 1;
    bundles: Record<string, OriginalBundleIndexEntry>;
};
export declare class OriginalBundleStore {
    private readonly baseUrl;
    private readonly decompress;
    private readonly cacheBytes;
    private indexPromise;
    private readonly open;
    private readonly sizes;
    private readonly byCabName;
    private total;
    constructor(baseUrl: string, // absolute, ends with "/"
    decompress: (bytes: Uint8Array) => Promise<Uint8Array>, cacheBytes?: number);
    index(): Promise<OriginalBundleIndex>;
    has(name: string): Promise<boolean>;
    byCab(cab: string): OriginalBundle | null;
    load(name: string): Promise<OriginalBundle>;
    private loadOne;
    private evict;
}
