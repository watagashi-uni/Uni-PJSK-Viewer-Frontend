import type { AssetResolver, ModelManifestEntry, ScenarioSceneData } from 'pjsk-scenario-player'
import { storyAssetUrl, voicePaths } from './storyPlayback'

export interface StoryPlayerModel extends ModelManifestEntry {
  modelDir: string
  modelFile: string
  motionLibrary: string | null
  physicsPath: string | null
  extraMotions: Record<string, string>
}
export interface StoryPlayerIndex {
  version: 1
  models: Record<string, StoryPlayerModel>
  motions: Record<string, Record<string, string>>
  backgrounds: Record<string, string>
  bgm: Record<string, string>
  se: Record<string, string>
  movies: Record<string, string>
}

export async function loadStoryPlayerIndex(signal: AbortSignal): Promise<StoryPlayerIndex> {
  const response = await fetch(storyAssetUrl('story-player/index.json'), {
    signal: AbortSignal.any([signal, AbortSignal.timeout(25000)]), cache: 'no-cache',
  })
  if (!response.ok) throw new Error('场景资源目录暂不可用，可切换到文本阅读')
  const index = await response.json() as StoryPlayerIndex
  if (index.version !== 1 || !index.models || !index.motions) throw new Error('场景资源目录格式不支持')
  return index
}

// Every URL stays on the existing public asset origin. The R2 completion
// follower regenerates this index so new costumes need no frontend rebuild.
export function storyPlayerResolver(index: StoryPlayerIndex, scenarioUrl: string): AssetResolver {
  const fromIndex = (paths: Record<string, string>, id: string) => paths[id] ? storyAssetUrl(paths[id]) : null
  return {
    scenario: () => scenarioUrl,
    modelManifest: () => storyAssetUrl('story-player/index.json'),
    model: entry => storyAssetUrl(`${entry.modelDir}/${entry.modelFile}`),
    physics: entry => typeof entry.physicsPath === 'string' ? storyAssetUrl(entry.physicsPath) : null,
    motion: (entry, kind, name) => {
      const model = entry as StoryPlayerModel
      const clip = `${kind}/${name.toLowerCase()}`
      const path = model.extraMotions?.[clip] || index.motions[model.motionLibrary || '']?.[clip]
      return path ? storyAssetUrl(path) : null
    },
    background: id => fromIndex(index.backgrounds, id),
    bgm: id => id === 'bgm00000' ? null : fromIndex(index.bgm, id),
    se: id => fromIndex(index.se, id),
    voice: (scenarioId, voiceId) => [
      ...voicePaths(scenarioId, voiceId),
      ...(voicePaths(scenarioId, voiceId).length ? [`startapp/sound/scenario/voice/${scenarioId}/${voiceId}.mp3`] : []),
    ].map(storyAssetUrl),
    movie: name => fromIndex(index.movies, name),
    // Converted particle effects and extracted UI are optional in the engine.
    fx: path => storyAssetUrl(`story-player/fx/${path}`),
    ui: path => storyAssetUrl(`story-player/ui/${path}`),
    font: name => storyAssetUrl(`story-player/fonts/${name}`),
  }
}

export function parsePlayerScenario(data: unknown, scenarioId: string): ScenarioSceneData {
  if (!data || typeof data !== 'object' || !Array.isArray((data as ScenarioSceneData).TalkData)) {
    throw new Error('剧本格式不支持')
  }
  const scenario = data as ScenarioSceneData
  return {
    ...scenario,
    ScenarioId: scenario.ScenarioId || scenarioId,
    FirstBgm: scenario.FirstBgm || '', FirstBackground: scenario.FirstBackground || '',
    FirstCharacterLayoutMode: scenario.FirstCharacterLayoutMode || 0,
    AppearCharacters: scenario.AppearCharacters || [], FirstLayout: scenario.FirstLayout || [],
    LayoutData: scenario.LayoutData || [], SoundData: scenario.SoundData || [],
    SpecialEffectData: scenario.SpecialEffectData || [],
    ScenarioSnippetCharacterLayoutModes: scenario.ScenarioSnippetCharacterLayoutModes || [],
    Snippets: scenario.Snippets?.length ? scenario.Snippets : scenario.TalkData.map((_, index) => ({
      Index: index, Action: 1, ReferenceIndex: index, ProgressBehavior: 1, Delay: 0,
    })),
  }
}
