/**
 * Furigana alignment utility
 *
 * Given a Japanese title and its full hiragana pronunciation,
 * produces segments with ruby (furigana) annotations.
 */

export interface FuriganaSegment {
    text: string
    ruby?: string
}

// Exception map for titles where algorithmic alignment fails due to linguistic ambiguity
const EXCEPTION_MAP: Record<string, FuriganaSegment[]> = {
    // 好き！雪！本気マジック / すきゆきまじまじっく
    // Backward matching assigns 'きゆきまじ' to '好' rather than the correct alignment.
    "好き！雪！本気マジック": [
        { text: "好", ruby: "す" },
        { text: "き！" },
        { text: "雪", ruby: "ゆき" },
        { text: "！" },
        { text: "本気", ruby: "まじ" },
        { text: "マジック" }
    ]
}

function isHiragana(char: string): boolean {
    const code = char.charCodeAt(0)
    return code >= 0x3040 && code <= 0x309F
}

function isKatakana(char: string): boolean {
    const code = char.charCodeAt(0)
    return (code >= 0x30A1 && code <= 0x30FA) || code === 0x30FC
}

function katakanaToHiragana(char: string): string {
    const code = char.charCodeAt(0)
    if (code >= 0x30A1 && code <= 0x30F6) {
        return String.fromCharCode(code - 0x60)
    }
    return char
}

function isAnchor(char: string): boolean {
    return isHiragana(char) || isKatakana(char)
}

function toHiragana(str: string): string {
    return str.split('').map(c => isKatakana(c) ? katakanaToHiragana(c) : c).join('')
}

/** 
 * Recursively find the best valid alignment of anchors in the pronunciation.
 * Since an anchor could appear multiple times (ambiguity), we want the 
 * *last* valid occurrence of the anchor to avoid eating up the pronunciation
 * that belongs to the preceding kanji. 
 * We search backwards (lastIndexOf) to greedily leave more pronunciation for the prefix text.
 */
function findValidAlignmentBackwards(
    pron: string,
    anchorGroups: string[],
    pEndIdx: number,
    groupIndex: number,
    memo: Map<string, number[]>
): number[] | null {
    if (groupIndex < 0) {
        // All groups matched backward successfully
        return []
    }

    // Memoization key: "pronEndIdx:groupIndex"
    const memoKey = `${pEndIdx}:${groupIndex}`
    if (memo.has(memoKey)) return null

    const currentGroup = anchorGroups[groupIndex]!
    let searchEndPos = pEndIdx

    while (searchEndPos >= currentGroup.length) {
        // Search backwards
        const matchIdx = pron.lastIndexOf(currentGroup, searchEndPos - currentGroup.length)

        if (matchIdx === -1) {
            break // No more matches for this group
        }

        // Found a match. The rest of the groups (earlier in string) must fit before matchIdx.
        const prevPEndIdx = matchIdx
        const prevAlignment = findValidAlignmentBackwards(pron, anchorGroups, prevPEndIdx, groupIndex - 1, memo)

        if (prevAlignment !== null) {
            // Valid alignment found! Build the path forward.
            return [...prevAlignment, matchIdx]
        }

        // This match led to a dead end. Try the previous occurrence.
        searchEndPos = matchIdx
    }

    // All attempts failed. Memoize and return null.
    memo.set(memoKey, [])
    return null
}


export function alignFurigana(title: string, pronunciation: string): FuriganaSegment[] {
    if (!title || !pronunciation) return [{ text: title || '' }]

    // Check exceptions first
    if (EXCEPTION_MAP[title]) {
        return EXCEPTION_MAP[title]!
    }

    type ChunkType = 'anchor' | 'text'
    interface Chunk {
        type: ChunkType
        text: string
        hiragana: string
    }

    const chunks: Chunk[] = []
    let ti = 0
    while (ti < title.length) {
        let isAnchorChunk = false
        let group = ''

        if (isHiragana(title[ti]!)) {
            isAnchorChunk = true
            while (ti < title.length && isHiragana(title[ti]!)) {
                group += title[ti]!
                ti++
            }
        } else if (isKatakana(title[ti]!)) {
            isAnchorChunk = true
            while (ti < title.length && isKatakana(title[ti]!)) {
                group += title[ti]!
                ti++
            }
        } else {
            // Text chunk
            while (ti < title.length && !isAnchor(title[ti]!)) {
                group += title[ti]!
                ti++
            }
        }

        if (isAnchorChunk) {
            chunks.push({ type: 'anchor', text: group, hiragana: toHiragana(group) })
        } else {
            chunks.push({ type: 'text', text: group, hiragana: '' })
        }
    }

    const anchorGroups = chunks.filter(c => c.type === 'anchor').map(c => c.hiragana)

    const memo = new Map<string, number[]>()
    // Start searching backwards from the end of the pronunciation for the LAST anchor group
    const alignmentIndices = findValidAlignmentBackwards(
        pronunciation,
        anchorGroups,
        pronunciation.length,
        anchorGroups.length - 1,
        memo
    )

    const result: FuriganaSegment[] = []

    if (alignmentIndices === null) {
        return [{ text: title }]
    }

    let pi = 0
    let currentAnchorIdx = 0

    for (const chunk of chunks) {
        if (chunk.type === 'anchor') {
            const matchIdx = alignmentIndices[currentAnchorIdx]!
            result.push({ text: chunk.text })
            pi = matchIdx + chunk.hiragana.length
            currentAnchorIdx++
        } else {
            // Text chunk. It gets the reading from current `pi` up to the matchIdx of the NEXT anchor
            let endIdx: number
            if (currentAnchorIdx < alignmentIndices.length) {
                endIdx = alignmentIndices[currentAnchorIdx]!
            } else {
                endIdx = pronunciation.length
            }

            const reading = pronunciation.substring(pi, endIdx)
            if (reading) {
                result.push({ text: chunk.text, ruby: reading })
            } else {
                result.push({ text: chunk.text })
            }
            pi = endIdx
        }
    }

    return result
}
