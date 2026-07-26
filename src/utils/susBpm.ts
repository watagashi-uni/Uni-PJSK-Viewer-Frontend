/**
 * 从 sus 谱面文本中仅解析 BPM 变化事件。
 * 解析路径与 @/vendor/sekai-sus2img/parser.ts 保持一致
 * （#BPMxx 定义 + #mmm08 引用，引用按行序即时解析），
 * 但跳过音符等其他数据，供轻量级 BPM 展示使用。
 */

export interface SusBpmEvent {
  /** 事件所在小节（0 起，可能含小节内偏移小数，与谱面预览的 #N 口径一致） */
  bar: number
  bpm: number
}

// 与 parser.ts parseScoreData 一致：两位一组，"00" 为空位，逗号后的 hispeed 值与 BPM 无关
function parseScorePairs(data: string): Array<{ offset: number; pair: string }> {
  const cleaned = data.trim()
  const pairs: string[] = []

  if (cleaned.includes(',')) {
    let i = 0
    while (i < cleaned.length) {
      while (i < cleaned.length && /\s/u.test(cleaned[i] ?? '')) i += 1
      if (i + 1 >= cleaned.length) break
      pairs.push(cleaned.slice(i, i + 2))
      i += 2
      if (i < cleaned.length && cleaned[i] === ',') {
        i += 1
        while (i < cleaned.length && !/\s/u.test(cleaned[i] ?? '') && cleaned[i] !== ',') i += 1
      }
      while (i < cleaned.length && (/\s/u.test(cleaned[i] ?? '') || cleaned[i] === ',')) i += 1
    }
  } else {
    for (let i = 0; i + 1 < cleaned.length; i += 2) {
      pairs.push(cleaned.slice(i, i + 2))
    }
  }

  return pairs
    .map((pair, index) => ({ offset: index / pairs.length, pair }))
    .filter(({ pair }) => pair !== '00')
}

export function parseSusBpm(susText: string): SusBpmEvent[] {
  const definitions = new Map<number, number>()
  const events: SusBpmEvent[] = []

  for (const rawLine of susText.split(/\r?\n/u)) {
    // 与 parser.ts parseLine 一致：BPM 相关数据只出现在 "#HEADER: data" 形式的 score 行
    const line = rawLine.trim().match(/^#(\w+):\s*(.*)$/)
    if (!line) continue
    const header = line[1] ?? ''
    const data = line[2] ?? ''

    const def = header.match(/^BPM(..)$/)
    if (def) {
      const id = Number.parseInt(def[1] ?? '', 36)
      const bpm = Number(data.trim())
      if (Number.isFinite(id) && Number.isFinite(bpm) && bpm > 0) {
        definitions.set(id, bpm)
      }
      continue
    }

    const ref = header.match(/^(\d\d\d)08$/)
    if (ref) {
      const bar = Number(ref[1])
      for (const { offset, pair } of parseScorePairs(data)) {
        const bpm = definitions.get(Number.parseInt(pair, 36))
        if (bpm !== undefined) {
          events.push({ bar: bar + offset, bpm })
        }
      }
    }
  }

  // 稳定排序后按 initEvents 的合并语义处理：同一小节位置后者覆盖前者
  events.sort((a, b) => a.bar - b.bar)
  const merged: SusBpmEvent[] = []
  for (const event of events) {
    const last = merged[merged.length - 1]
    if (last && Math.abs(last.bar - event.bar) < 1e-9) {
      last.bpm = event.bpm
    } else {
      merged.push({ ...event })
    }
  }

  // 折叠连续相同 BPM，只保留实际变化点
  const result: SusBpmEvent[] = []
  for (const event of merged) {
    const last = result[result.length - 1]
    if (last && last.bpm === event.bpm) continue
    result.push(event)
  }
  return result
}
