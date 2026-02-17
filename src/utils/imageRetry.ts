/**
 * SVG image 元素加载失败处理
 * SVG image 使用 href 而不是 src，不能用 AssetImage 组件
 */
export function handleSvgImageError(event: Event) {
    const img = event.target as SVGImageElement
    img.style.display = 'none'
}

/**
 * 获取远程图片的原始尺寸
 * 用于 bonds honor 渲染中计算角色 SD 图和台词文字的偏移量
 */
export function getRemoteImageSize(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = reject
        image.src = url
    })
}
