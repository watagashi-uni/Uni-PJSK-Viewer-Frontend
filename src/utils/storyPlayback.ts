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
  snippetIndex: number
  talk: StoryTalk
  background: string
  location: string
  bgm: string
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
  const append = (index: number, snippetIndex: number) => {
    const talk = data.TalkData[index]
    if (!talk?.Body && !talk?.WindowDisplayName) return
    frames.push({ key: `${frames.length}-${index}`, talkIndex: index, snippetIndex, talk, background, bgm, location })
  }
  for (const [snippetIndex, snippet] of (data.Snippets || []).entries()) {
    if (snippet.Action === 1) append(snippet.ReferenceIndex, snippetIndex)
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
  if (!frames.length) data.TalkData.forEach((_, index) => append(index, index))
  return frames
}

export function voicePaths(scenarioId: string, voiceId: string): string[] {
  if (!/^[\w-]+$/.test(scenarioId) || !/^[\w-]+$/.test(voiceId)) return []
  const directories = /^\d{6}_/.test(scenarioId)
    ? ['ondemand/sound/card_scenario/voice', 'ondemand/sound/scenario/voice']
    : ['ondemand/sound/scenario/voice', 'ondemand/sound/card_scenario/voice']
  return directories.map(directory => `${directory}/${scenarioId}/${voiceId}.mp3`)
}

// The game loads special stories from the episode's bundle. The opening's op_01 is the
// exception: it only exists in the parent's special-story bundle.
export function specialScenarioPath(
  storyBundle: string,
  episode: { assetbundleName: string; scenarioId: string },
  available: ReadonlySet<string>,
): string | undefined {
  return [episode.assetbundleName, storyBundle]
    .map(bundle => `startapp/scenario/special/${bundle}/${episode.scenarioId}.json`)
    .find(path => available.has(path))
}
