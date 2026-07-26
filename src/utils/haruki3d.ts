/**
 * Haruki 3D Engine（src/vendor/haruki-3d-engine）相关配置。
 * 运行时资源（转换后的 .msgpack.br 包）由 3d-export 服务器提供，仅 JP 区。
 */
export const PJSK_3D_ASSETS_BASE_URL = 'https://3d-export.unipjsk.com/jp/'

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
