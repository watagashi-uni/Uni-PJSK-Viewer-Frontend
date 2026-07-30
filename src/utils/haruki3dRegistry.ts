import { decode } from '@msgpack/msgpack'
import { PJSK_3D_ASSETS_BASE_URL } from '@/utils/haruki3d'

export type RuntimePartSlot = 'body' | 'head' | 'hair' | 'head_optional'

export interface RuntimeRoleDefaults {
    bodyCostume3dId: number
    headCostume3dId: number
    hairCostume3dId: number
}

export interface RuntimePartRegistryEntry {
    costume3dId: number
    partType: RuntimePartSlot | string
    characterId: number
    unit?: string | null
    name?: string | null
    colorId?: number | null
    colorName?: string | null
    costume3dGroupId?: number | null
    costumeAssetbundleName?: string | null
    headCostume3dAssetbundleType?: string | null
    packagePath: string
    status?: string
    warnings?: string[] | null
}

export interface RuntimeRoleData {
    defaults: RuntimeRoleDefaults
    masterVersion: string
    registry: RuntimePartRegistryEntry[]
}

const roleDataCache = new Map<string, Promise<RuntimeRoleData>>()
const registryIndexCache = new WeakMap<RuntimeRoleData, Map<number, RuntimePartRegistryEntry[]>>()

function roleKey(characterId: number, unit: string): string {
    return `${characterId}:${unit}`
}

async function decodeBrotliMessagePack(response: Response): Promise<unknown> {
    if (!response.ok) {
        throw new Error(`3D 运行时数据请求失败 (HTTP ${response.status})`)
    }
    const brotli = await (await import('brotli-wasm')).default
    return decode(brotli.decompress(new Uint8Array(await response.arrayBuffer())))
}

export function isUsableRuntimePart(entry: RuntimePartRegistryEntry | undefined): boolean {
    return Boolean(entry && entry.status !== 'missing')
}

export function runtimePartSlot(entry: RuntimePartRegistryEntry): RuntimePartSlot | null {
    const raw = entry.partType.toLowerCase()
    if (raw === 'body' || raw === 'hair' || raw === 'head_optional') return raw
    if (raw !== 'head') return null

    const headType = entry.headCostume3dAssetbundleType?.toLowerCase()
    if (headType === 'head_only' || headType === 'head_all' || headType === 'head_front' || headType === 'head_back') {
        return 'head_optional'
    }
    return 'head'
}

export async function loadRuntimeRoleData(characterId: number, unit: string): Promise<RuntimeRoleData> {
    const key = roleKey(characterId, unit)
    const cached = roleDataCache.get(key)
    if (cached) return cached

    const request = (async () => {
        const root = `${PJSK_3D_ASSETS_BASE_URL}parts/by-role/${characterId}/${unit}`
        const catalog = await decodeBrotliMessagePack(
            await fetch(`${root}/runtime-role-catalog.msgpack.br`)
        ) as {
            masterVersion?: string
            roles?: RuntimeRoleDefaults[]
        }
        const defaults = catalog.roles?.[0]
        if (!defaults || !catalog.masterVersion) {
            throw new Error(`该角色（${key}）暂无完整的 3D role catalog`)
        }

        const registryPayload = await decodeBrotliMessagePack(
            await fetch(`${root}/part-registry.msgpack.br?masterVersion=${encodeURIComponent(catalog.masterVersion)}`)
        ) as {
            entries?: RuntimePartRegistryEntry[]
            parts?: RuntimePartRegistryEntry[]
        } | RuntimePartRegistryEntry[]
        const registry = Array.isArray(registryPayload)
            ? registryPayload
            : (registryPayload.entries ?? registryPayload.parts ?? [])

        return {
            defaults: {
                bodyCostume3dId: defaults.bodyCostume3dId,
                headCostume3dId: defaults.headCostume3dId,
                hairCostume3dId: defaults.hairCostume3dId,
            },
            masterVersion: catalog.masterVersion,
            registry,
        }
    })()

    roleDataCache.set(key, request)
    void request.catch(() => {
        if (roleDataCache.get(key) === request) roleDataCache.delete(key)
    })
    return request
}

export function findRuntimePart(
    roleData: RuntimeRoleData,
    costume3dId: number,
    slots: RuntimePartSlot[],
): RuntimePartRegistryEntry | undefined {
    let registryIndex = registryIndexCache.get(roleData)
    if (!registryIndex) {
        registryIndex = new Map<number, RuntimePartRegistryEntry[]>()
        for (const entry of roleData.registry) {
            const entries = registryIndex.get(entry.costume3dId)
            if (entries) entries.push(entry)
            else registryIndex.set(entry.costume3dId, [entry])
        }
        registryIndexCache.set(roleData, registryIndex)
    }

    return registryIndex.get(costume3dId)?.find(entry => {
        const slot = runtimePartSlot(entry)
        return slot !== null
            && slots.includes(slot)
            && isUsableRuntimePart(entry)
    })
}
