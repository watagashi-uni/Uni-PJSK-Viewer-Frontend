import { useRouter } from 'vue-router'

/**
 * 详情页「返回列表」：如果上一页就是该列表（带着筛选、页码等 query），用浏览器后退恢复原状态；
 * 直接打开详情页时（没有可返回的列表历史）再跳转到列表首页。
 */
export function useBackToList(listPath: string, alsoListPaths: string[] = []) {
    const router = useRouter()

    return function goBackToList() {
        const back = window.history.state?.back
        if (typeof back === 'string') {
            const backPath = back.split(/[?#]/)[0] ?? ''
            if (backPath === listPath || alsoListPaths.includes(backPath)) {
                router.back()
                return
            }
        }
        router.push(listPath)
    }
}
