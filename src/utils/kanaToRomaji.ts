/**
 * 平假名/片假名转罗马音工具
 */

const basicMap: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'o', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    // 小假名
    'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo',
    // 长音
    'ー': '-',
}

const compoundMap: Record<string, string> = {
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
}

export function toRomaji(kana: string): string {
    if (!kana) return ''

    let result = ''
    let i = 0
    const len = kana.length

    while (i < len) {
        const c1 = kana[i] as string
        const c2 = kana[i + 1] as string | undefined

        // 检查拗音 (例如: きゃ)
        if (i + 1 < len && c2) {
            const compound = c1 + c2
            if (compound in compoundMap) {
                result += compoundMap[compound]
                i += 2
                continue
            }
        }

        // 检查促音 (っ/ッ)
        if (c1 === 'っ' || c1 === 'ッ') {
            if (i + 1 < len) {
                const nextChar = kana[i + 1] as string

                // 获取下一个音节的首字母
                let nextRomaji = ''
                // 检查下一个是否是拗音
                const nextNextChar = i + 2 < len ? kana[i + 2] as string : undefined
                if (nextNextChar) {
                    const compound = nextChar + nextNextChar
                    if (compound in compoundMap) {
                        nextRomaji = compoundMap[compound] || ''
                    }
                }

                if (!nextRomaji) {
                    nextRomaji = basicMap[nextChar] || ''
                }

                if (nextRomaji && nextRomaji.length > 0) {
                    // 重复首辅音
                    result += nextRomaji[0]
                    i++ // 只跳过促音，下一个字符在下一次循环处理
                    continue
                }
            }
        }

        // 基本映射
        if (c1 in basicMap) {
            result += basicMap[c1]
            i++
        } else {
            // 未知字符，原样保留
            result += c1
            i++
        }
    }

    return result
}
