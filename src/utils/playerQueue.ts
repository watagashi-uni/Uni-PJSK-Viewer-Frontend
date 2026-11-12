// Queue arithmetic for the global music player. Pure functions: every operation
// returns the new list together with the index of the track that stays current.

export type RepeatMode = 'off' | 'all' | 'one'

export interface QueueState<T> {
  queue: T[]
  /** Index of the current track, or -1 when the queue is empty. */
  index: number
}

/** Insert right after the current track (or at the front of an empty queue). */
export function insertNext<T>(state: QueueState<T>, items: T[]): QueueState<T> {
  const at = state.index < 0 ? 0 : state.index + 1
  const queue = [...state.queue.slice(0, at), ...items, ...state.queue.slice(at)]
  return { queue, index: state.index < 0 && queue.length ? 0 : state.index }
}

export function append<T>(state: QueueState<T>, items: T[]): QueueState<T> {
  const queue = [...state.queue, ...items]
  return { queue, index: state.index < 0 && queue.length ? 0 : state.index }
}

/**
 * Remove one entry. Removing the current track hands the slot to the one that
 * followed it; removing the last entry falls back to the new last entry.
 */
export function removeAt<T>(state: QueueState<T>, at: number): QueueState<T> {
  if (at < 0 || at >= state.queue.length) return state
  const queue = state.queue.filter((_, i) => i !== at)
  let index = state.index
  if (at < index) index -= 1
  else if (at === index) index = Math.min(index, queue.length - 1)
  return { queue, index }
}

/** Move an entry; the current track stays current wherever it lands. */
export function moveItem<T>(state: QueueState<T>, from: number, to: number): QueueState<T> {
  const last = state.queue.length - 1
  if (from < 0 || from > last) return state
  const target = Math.max(0, Math.min(last, to))
  if (target === from) return state
  const queue = [...state.queue]
  const [item] = queue.splice(from, 1)
  queue.splice(target, 0, item as T)
  let index = state.index
  if (from === index) index = target
  else if (from < index && target >= index) index -= 1
  else if (from > index && target <= index) index += 1
  return { queue, index }
}

/** Keep the played part and the current track, drop everything queued after it. */
export function clearUpcoming<T>(state: QueueState<T>): QueueState<T> {
  return { queue: state.queue.slice(0, state.index + 1), index: state.index }
}

/** Fisher–Yates over the tracks after the current one. */
export function shuffleUpcoming<T>(state: QueueState<T>, random: () => number = Math.random): QueueState<T> {
  const head = state.queue.slice(0, state.index + 1)
  const tail = state.queue.slice(state.index + 1)
  for (let i = tail.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const swap = tail[i] as T
    tail[i] = tail[j] as T
    tail[j] = swap
  }
  return { queue: [...head, ...tail], index: state.index }
}

/**
 * Track to play after the current one, or -1 when playback stops.
 * `auto` is true when the current track simply ran out: only then does
 * "repeat one" hold the position; a manual skip always moves on.
 */
export function nextIndex(index: number, length: number, repeat: RepeatMode, auto: boolean): number {
  if (length === 0 || index < 0) return -1
  if (auto && repeat === 'one') return index
  if (index + 1 < length) return index + 1
  return repeat === 'off' ? -1 : 0
}

export function previousIndex(index: number, length: number, repeat: RepeatMode): number {
  if (length === 0 || index < 0) return -1
  if (index > 0) return index - 1
  return repeat === 'all' ? length - 1 : 0
}
