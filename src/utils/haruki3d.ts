/**
 * 日服衣装预览：默认使用转换后的 3d-export 资源；本地开发可启用原包引擎。
 */
export const HARUKI_ORIGINAL_ENABLED = import.meta.env.DEV && import.meta.env.VITE_LOCAL_3D_STORE === '1'
export const PJSK_3D_ASSETS_BASE_URL = HARUKI_ORIGINAL_ENABLED
    ? '/__local_3d/'
    : 'https://3d-export.unipjsk.com/jp/'

/** Basis 转码器目录（public/basis，与引擎默认值一致） */
export const PJSK_3D_BASIS_PATH = '/basis/'

export function isWebGL2Supported(): boolean {
    try {
        const canvas = document.createElement('canvas')
        return !!canvas.getContext('webgl2')
    } catch {
        return false
    }
}
