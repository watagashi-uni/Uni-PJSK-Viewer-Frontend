/** Side of the bitmap the artwork is reduced to. Stretched over the screen it reads as a soft wash. */
const SIZE = 64
/** Box-blur radius in bitmap pixels; three passes approximate a Gaussian. */
const RADIUS = 4
const PASSES = 3
/** Matches the old `saturate(1.9)`, so the colours stay as vivid. */
const SATURATION = 1.9

const cache = new Map<string, Promise<HTMLCanvasElement | null>>()

/**
 * The artwork shrunk to a small, blurred and saturated bitmap for a full-screen backdrop.
 * Done once per cover: the page then only stretches and turns the bitmap, which costs the
 * GPU next to nothing, instead of blurring a full-size image with a CSS filter every frame.
 * Null when the image cannot be loaded.
 */
export function paintBackdrop(url: string): Promise<HTMLCanvasElement | null> {
  let task = cache.get(url)
  if (!task) {
    task = render(url)
    cache.set(url, task)
    if (cache.size > 8) cache.delete(cache.keys().next().value!)
  }
  return task
}

async function render(url: string): Promise<HTMLCanvasElement | null> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.decoding = 'async'
  image.src = url
  try {
    await image.decode()
  } catch {
    cache.delete(url)
    return null
  }
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  // Halve step by step: a single big reduction skips pixels and keeps hard detail.
  let source: CanvasImageSource = image
  let width = image.naturalWidth
  let height = image.naturalHeight
  while (width > SIZE * 2 && height > SIZE * 2) {
    const step = document.createElement('canvas')
    step.width = Math.ceil(width / 2)
    step.height = Math.ceil(height / 2)
    step.getContext('2d')?.drawImage(source, 0, 0, step.width, step.height)
    source = step
    width = step.width
    height = step.height
  }
  context.drawImage(source, 0, 0, SIZE, SIZE)
  try {
    const pixels = context.getImageData(0, 0, SIZE, SIZE)
    blur(pixels.data)
    saturate(pixels.data)
    context.putImageData(pixels, 0, 0)
  } catch {
    // Artwork served without CORS can be drawn but not read: the reduced image is soft enough.
  }
  return canvas
}

function blur(data: Uint8ClampedArray) {
  const buffer = new Float32Array(SIZE * SIZE * 4)
  for (let i = 0; i < data.length; i++) buffer[i] = data[i]!
  const line = new Float32Array(SIZE * 4)
  for (let pass = 0; pass < PASSES; pass++) {
    for (const horizontal of [true, false]) {
      for (let a = 0; a < SIZE; a++) {
        const at = (b: number) => (horizontal ? a * SIZE + b : b * SIZE + a) * 4
        for (let b = 0; b < SIZE; b++) {
          for (let c = 0; c < 4; c++) {
            let sum = 0
            // Edges repeat the outermost pixel instead of fading to black.
            for (let k = -RADIUS; k <= RADIUS; k++) sum += buffer[at(Math.max(0, Math.min(SIZE - 1, b + k))) + c]!
            line[b * 4 + c] = sum / (RADIUS * 2 + 1)
          }
        }
        for (let b = 0; b < SIZE; b++) for (let c = 0; c < 4; c++) buffer[at(b) + c] = line[b * 4 + c]!
      }
    }
  }
  for (let i = 0; i < data.length; i++) data[i] = buffer[i]!
}

/** The same colour matrix as the CSS `saturate()` filter. */
function saturate(data: Uint8ClampedArray) {
  const s = SATURATION
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    data[i] = (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b
    data[i + 1] = (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b
    data[i + 2] = (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b
  }
}

/**
 * Copy a backdrop bitmap into a visible canvas. `fadeEdges` lets it thin out towards a circle
 * inside its square, for a layer placed off-centre whose edge could otherwise turn into view.
 */
export function drawBackdrop(canvas: HTMLCanvasElement, bitmap: HTMLCanvasElement, fadeEdges = false) {
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (!context) return
  context.drawImage(bitmap, 0, 0)
  if (!fadeEdges) return
  const half = bitmap.width / 2
  const fade = context.createRadialGradient(half, half, half * 0.8, half, half, half)
  fade.addColorStop(0, '#000')
  fade.addColorStop(1, 'transparent')
  context.globalCompositeOperation = 'destination-in'
  context.fillStyle = fade
  context.fillRect(0, 0, bitmap.width, bitmap.height)
  context.globalCompositeOperation = 'source-over'
}
