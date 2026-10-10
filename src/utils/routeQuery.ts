import type { LocationQuery, RouteLocationNormalizedLoaded, Router } from 'vue-router'

/** 读取字符串 query 参数，缺省或类型不对时返回 fallback */
export function readQueryString(query: LocationQuery, key: string, fallback = ''): string {
    const value = query[key]
    return typeof value === 'string' ? value : fallback
}

/** 读取页码 query 参数（从 1 开始） */
export function readQueryPage(query: LocationQuery, key = 'page'): number {
    return Math.max(1, Math.floor(Number(query[key])) || 1)
}

/**
 * 用 router.replace 把列表筛选状态写入 URL：不新增历史记录，返回详情页后可以原样恢复。
 * patch 中值为空字符串 / null / undefined 的键会被移除；筛选变化默认同时清掉页码。
 */
export function replaceListQuery(
    router: Router,
    route: RouteLocationNormalizedLoaded,
    patch: Record<string, string | null | undefined>,
    options: { resetPage?: boolean } = {},
) {
    const query: LocationQuery = { ...route.query }
    for (const [key, value] of Object.entries(patch)) {
        if (value) query[key] = value
        else delete query[key]
    }
    if (options.resetPage !== false) delete query.page
    return router.replace({ query })
}

/** 翻页使用 push，保留浏览器前进/后退在页码之间切换的能力 */
export function pushListPage(router: Router, route: RouteLocationNormalizedLoaded, page: number) {
    const query: LocationQuery = { ...route.query }
    if (page > 1) query.page = String(page)
    else delete query.page
    return router.push({ query })
}
