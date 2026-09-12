export interface StoryVoice { Character2dId?: number; VoiceId: string; Volume?: number }
export interface StoryTalk {
  WindowDisplayName?: string
  Body?: string
  TalkCharacters?: { Character2dId: number }[]
  Voices?: StoryVoice[]
}
export interface StoryScenario {
  ScenarioId?: string
  FirstBackground?: string
  FirstBgm?: string
  TalkData: StoryTalk[]
  Snippets?: { Action: number; ReferenceIndex: number }[]
  SpecialEffectData?: { EffectType: number; StringVal?: string; StringValSub?: string }[]
  SoundData?: { Bgm?: string; PlayMode?: number }[]
}
export interface StoryFrame {
  key: string
  talkIndex: number
  talk: StoryTalk
  background: string
  location: string
  bgm: string
}
export interface StoryMediaIndex {
  backgrounds: Record<string, string>
  bgm: Record<string, string>
  comics: string[]
  specialScenarios?: string[]
}

// Story media lives on the global origin; the mainland mirror has a smaller scope.
export const storyAssetHost = 'https://assets.unipjsk.com'
export const storyAssetUrl = (path: string) => `${storyAssetHost}/${path.split('/').map(encodeURIComponent).join('/')}`

export function buildStoryFrames(data: StoryScenario): StoryFrame[] {
  if (!Array.isArray(data.TalkData)) throw new Error('剧本格式不支持')
  let background = data.FirstBackground || ''
  let bgm = data.FirstBgm || ''
  let location = ''
  const frames: StoryFrame[] = []
  const append = (index: number) => {
    const talk = data.TalkData[index]
    if (!talk?.Body && !talk?.WindowDisplayName) return
    frames.push({ key: `${frames.length}-${index}`, talkIndex: index, talk, background, bgm, location })
  }
  for (const snippet of data.Snippets || []) {
    if (snippet.Action === 1) append(snippet.ReferenceIndex)
    if (snippet.Action === 6) {
      const effect = data.SpecialEffectData?.[snippet.ReferenceIndex]
      if (effect?.EffectType === 7) {
        background = effect.StringValSub || effect.StringVal || ''
        location = ''
      }
      if (effect && [8, 18].includes(effect.EffectType) && effect.StringVal) location = effect.StringVal
    }
    if (snippet.Action === 7) {
      const sound = data.SoundData?.[snippet.ReferenceIndex]
      if (sound?.Bgm) bgm = sound.Bgm === 'bgm00000' ? '' : sound.Bgm
    }
  }
  if (!frames.length) data.TalkData.forEach((_, index) => append(index))
  return frames
}

export function voicePaths(scenarioId: string, voiceId: string): string[] {
  if (!/^[\w-]+$/.test(scenarioId) || !/^[\w-]+$/.test(voiceId)) return []
  const directories = /^\d{6}_/.test(scenarioId)
    ? ['ondemand/sound/card_scenario/voice', 'ondemand/sound/scenario/voice']
    : ['ondemand/sound/scenario/voice', 'ondemand/sound/card_scenario/voice']
  return directories.map(directory => `${directory}/${scenarioId}/${voiceId}.mp3`)
}

let mediaPromise: Promise<StoryMediaIndex> | undefined
export function loadStoryMedia(): Promise<StoryMediaIndex> {
  return mediaPromise ||= fetch('/data/story-media-index.json').then(async response => {
    if (!response.ok) throw new Error('场景资源目录加载失败')
    return response.json() as Promise<StoryMediaIndex>
  }).catch(error => { mediaPromise = undefined; throw error })
}

export function backgroundPath(id: string, media: StoryMediaIndex): string {
  if (!id || !/^[\w-]+$/.test(id)) return ''
  return media.backgrounds[id] || `ondemand/scenario/background/${id}/${id}.png`
}

export function bgmPath(id: string, media: StoryMediaIndex): string {
  if (!id || id === 'bgm00000' || !/^[\w-]+$/.test(id)) return ''
  return media.bgm[id] || `ondemand/sound/scenario/bgm/${id}/${id}.mp3`
}
