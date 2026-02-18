/**
 * Furigana alignment utility
 *
 * Given a Japanese title and its full hiragana pronunciation,
 * produces segments with ruby (furigana) annotations.
 *
 * Algorithm: uses hiragana and katakana characters in the title as
 * anchors to segment the pronunciation, then assigns readings to
 * non-anchor portions of the title.
 *
 * Key: when searching for an anchor position in the pronunciation,
 * the ENTIRE next anchor group is matched as a substring (not just
 * the first character), avoiding ambiguity when readings overlap.
 *
 * Example:
 *   title:         "好き！雪！本気マジック"
 *   pronunciation: "すきゆきまじまじっく"
 *   result:        好(す) き ！雪！本気(ゆきまじ) マジック
 */

export interface FuriganaSegment {
    text: string
    ruby?: string
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

/** Peek at the full consecutive anchor group starting at `start` */
function peekAnchorGroup(title: string, start: number): string {
    let group = ''
    let i = start
    const firstIsHiragana = isHiragana(title[i]!)
    if (firstIsHiragana) {
        while (i < title.length && isHiragana(title[i]!)) {
            group += title[i]!
            i++
        }
    } else {
        while (i < title.length && isKatakana(title[i]!)) {
            group += title[i]!
            i++
        }
    }
    return group
}

/** Convert a string (possibly with katakana) to hiragana for matching */
function toHiragana(str: string): string {
    return str.split('').map(c => isKatakana(c) ? katakanaToHiragana(c) : c).join('')
}

export function alignFurigana(title: string, pronunciation: string): FuriganaSegment[] {
    if (!title || !pronunciation) return [{ text: title || '' }]

    const result: FuriganaSegment[] = []
    let ti = 0
    let pi = 0

    while (ti < title.length) {
        const ch = title[ti]!

        if (isHiragana(ch)) {
            let group = ''
            while (ti < title.length && isHiragana(title[ti]!)) {
                group += title[ti]!
                ti++
                pi++
            }
            result.push({ text: group })

        } else if (isKatakana(ch)) {
            let group = ''
            while (ti < title.length && isKatakana(title[ti]!)) {
                group += title[ti]!
                ti++
                pi++
            }
            result.push({ text: group })

        } else {
            // Everything else: kanji, latin, digits, punctuation, symbols
            let group = ''
            while (ti < title.length && !isAnchor(title[ti]!)) {
                group += title[ti]!
                ti++
            }

            // Find reading by searching for the entire next anchor group
            // as a substring in the pronunciation (not just the first char)
            let reading = ''
            if (ti < title.length) {
                const anchorGroup = peekAnchorGroup(title, ti)
                const anchorPron = toHiragana(anchorGroup)
                const remaining = pronunciation.substring(pi)
                const foundIdx = remaining.indexOf(anchorPron)

                if (foundIdx !== -1) {
                    reading = pronunciation.substring(pi, pi + foundIdx)
                    pi = pi + foundIdx
                } else {
                    // Anchor group not found — take remaining pronunciation
                    reading = pronunciation.substring(pi)
                    pi = pronunciation.length
                }
            } else {
                // End of title — rest of pronunciation is the reading
                reading = pronunciation.substring(pi)
                pi = pronunciation.length
            }

            if (reading) {
                result.push({ text: group, ruby: reading })
            } else {
                result.push({ text: group })
            }
        }
    }

    return result
}
