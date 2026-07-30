export type HarukiRenderRecipe = {
    roleId: string;
    bodyRoleId?: string | null;
    bodyCostume3dId: number;
    headCostume3dId: number;
    headPackagePath?: string | null;
    hairCostume3dId: number;
    headOptionalCostume3dId?: number | null;
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
};
export declare function normalizeHarukiRenderRecipe(recipe: HarukiRenderRecipe): NormalizedHarukiRenderRecipe;
