/**
 * 超时后自动中止的信号，可再并上调用方自己的信号。
 * AbortSignal.timeout 要 Safari 16 / Chrome 103，AbortSignal.any 要 Safari 17.4 / Chrome 116，
 * 旧浏览器上直接调用会抛错，这里退回到 AbortController + 定时器。
 */
export function timeoutSignal(ms: number, signal?: AbortSignal): AbortSignal {
  const hasTimeout = typeof AbortSignal.timeout === 'function'
  if (!signal && hasTimeout) return AbortSignal.timeout(ms)
  if (signal && hasTimeout && typeof AbortSignal.any === 'function') return AbortSignal.any([signal, AbortSignal.timeout(ms)])

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('signal timed out', 'TimeoutError')), ms)
  if (signal) {
    const onAbort = () => {
      clearTimeout(timer)
      controller.abort(signal.reason)
    }
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }
  return controller.signal
}
