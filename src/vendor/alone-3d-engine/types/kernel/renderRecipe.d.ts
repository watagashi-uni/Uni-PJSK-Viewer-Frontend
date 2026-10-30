export type HarukiRenderRecipe = {
    roleId: string;
    /** Optional body source role. Head, hair, skin and default motion stay on roleId. */
    bodyRoleId?: string | null;
    bodyCostume3dId: number;
    headCostume3dId: number;
    headPackagePath?: string | null;
    hairCostume3dId: number;
    headOptionalCostume3dId?: number | null;
    motionRoleId?: string | null;
};
export type HarukiRuntimeRenderRecipe = HarukiRenderRecipe & {
    baseUrl: string;
};
export type NormalizedHarukiRenderRecipe = {
    roleId: string;
    bodyRoleId: string;
    bodyCostume3dId: number;
    headCostume3dId: number;
    headPackagePath: string | null;
    hairCostume3dId: number;
    headOptionalCostume3dId: number | null;
    motionRoleId: string | null;
};
export declare function normalizeHarukiRenderRecipe(recipe: HarukiRenderRecipe): NormalizedHarukiRenderRecipe;
