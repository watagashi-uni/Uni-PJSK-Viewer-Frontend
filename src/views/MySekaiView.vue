<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAccountStore } from '@/stores/account'
// ==================== Constants & Configuration ====================

const SCENES: Record<string, any> = {
  scene1: {
    physicalWidth: 33.333,
    offsetX: 0,
    offsetY: -40,
    imagePath: '/img/mysekai/grassland.png',
    xDirection: 'x-',
    yDirection: 'y-',
    reverseXY: true,
    name: 'さいしょの原っぱ'
  },
  scene2: {
    physicalWidth: 24.806,
    offsetX: -62.015,
    offsetY: 20.672,
    imagePath: '/img/mysekai/flowergarden.png',
    xDirection: 'x-',
    yDirection: 'y-',
    reverseXY: true,
    name: '彩りの花畑'
  },
  scene3: {
    physicalWidth: 20.513,
    offsetX: 0,
    offsetY: 80,
    imagePath: '/img/mysekai/beach.png',
    xDirection: 'x+',
    yDirection: 'y-',
    reverseXY: false,
    name: '願いの砂浜'
  },
  scene4: {
    physicalWidth: 21.333,
    offsetX: 0,
    offsetY: -106.667,
    imagePath: '/img/mysekai/memorialplace.png',
    xDirection: 'x+',
    yDirection: 'y-',
    reverseXY: false,
    name: '忘れ去られた場所'
  }
}

const FIXTURE_COLORS: Record<number, string> = {
  112: '#f9f9f9',
  1001: '#da6d42', // wood
  1002: '#da6d42',
  1003: '#da6d42',
  1004: '#da6d42',
  2001: '#878685', // iron
  2002: '#d5750a', // copper
  2003: '#d5d5d5', // stone
  2004: '#a7c7cb',
  2005: '#9933cc',
  3001: '#c95a49',
  4001: '#f8729a', // flower
  4002: '#f8729a',
  4003: '#f8729a',
  4004: '#f8729a',
  4005: '#f8729a',
  4006: '#f8729a',
  4007: '#f8729a',
  4008: '#f8729a',
  4009: '#f8729a', // cotton
  4010: '#f8729a',
  4011: '#f8729a',
  4012: '#f8729a',
  4013: '#f8729a',
  4014: '#f8729a',
  4015: '#f8729a',
  4016: '#f8729a',
  4017: '#f8729a',
  4018: '#f8729a',
  4019: '#f8729a',
  4020: '#f8729a',
  5001: '#f6f5f2',
  5002: '#f6f5f2',
  5003: '#f6f5f2',
  5004: '#f6f5f2',
  5101: '#f6f5f2',
  5102: '#f6f5f2',
  5103: '#f6f5f2',
  5104: '#f6f5f2',
  6001: '#6f4e37',
  7001: '#a5d9ff',
}

const ITEM_TEXTURES: Record<string, Record<string, string>> = {
  mysekai_material: {
    "1": "/img/mysekai/icon/Texture2D/item_wood_1.png",
    "2": "/img/mysekai/icon/Texture2D/item_wood_2.png",
    "3": "/img/mysekai/icon/Texture2D/item_wood_3.png",
    "4": "/img/mysekai/icon/Texture2D/item_wood_4.png",
    "5": "/img/mysekai/icon/Texture2D/item_wood_5.png",
    "6": "/img/mysekai/icon/Texture2D/item_mineral_1.png",
    "7": "/img/mysekai/icon/Texture2D/item_mineral_2.png",
    "8": "/img/mysekai/icon/Texture2D/item_mineral_3.png",
    "9": "/img/mysekai/icon/Texture2D/item_mineral_4.png",
    "10": "/img/mysekai/icon/Texture2D/item_mineral_5.png",
    "11": "/img/mysekai/icon/Texture2D/item_mineral_6.png",
    "12": "/img/mysekai/icon/Texture2D/item_mineral_7.png",
    "13": "/img/mysekai/icon/Texture2D/item_junk_1.png",
    "14": "/img/mysekai/icon/Texture2D/item_junk_2.png",
    "15": "/img/mysekai/icon/Texture2D/item_junk_3.png",
    "16": "/img/mysekai/icon/Texture2D/item_junk_4.png",
    "17": "/img/mysekai/icon/Texture2D/item_junk_5.png",
    "18": "/img/mysekai/icon/Texture2D/item_junk_6.png",
    "19": "/img/mysekai/icon/Texture2D/item_junk_7.png",
    "20": "/img/mysekai/icon/Texture2D/item_plant_1.png",
    "21": "/img/mysekai/icon/Texture2D/item_plant_2.png",
    "22": "/img/mysekai/icon/Texture2D/item_plant_3.png",
    "23": "/img/mysekai/icon/Texture2D/item_plant_4.png",
    "24": "/img/mysekai/icon/Texture2D/item_tone_8.png",
    "32": "/img/mysekai/icon/Texture2D/item_junk_8.png",
    "33": "/img/mysekai/icon/Texture2D/item_mineral_8.png",
    "34": "/img/mysekai/icon/Texture2D/item_junk_9.png",
    "61": "/img/mysekai/icon/Texture2D/item_junk_10.png",
    "62": "/img/mysekai/icon/Texture2D/item_junk_11.png",
    "63": "/img/mysekai/icon/Texture2D/item_junk_12.png",
    "64": "/img/mysekai/icon/Texture2D/item_mineral_9.png",
    "65": "/img/mysekai/icon/Texture2D/item_mineral_10.png",
  },
  mysekai_item: {
    "7": "/img/mysekai/icon/Texture2D/item_blueprint_fragment.png",
  },
  mysekai_fixture: {
    "118": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sapling1_118.png",
    "119": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sapling1_119.png",
    "120": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sapling1_120.png",
    "121": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sapling1_121.png",
    "126": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_126.png",
    "127": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_127.png",
    "128": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_128.png",
    "129": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_129.png",
    "130": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_130.png",
    "474": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_474.png",
    "475": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_475.png",
    "476": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_476.png",
    "477": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_477.png",
    "478": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_478.png",
    "479": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_479.png",
    "480": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_480.png",
    "481": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_481.png",
    "482": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_482.png",
    "483": "/img/mysekai/icon/Texture2D/mdl_non1001_before_sprout1_483.png"
  },
  mysekai_music_record: {
    352: '/img/mysekai/icon/music352.png'
  }
}

const RARE_ITEM: Record<string, number[]> = {
  mysekai_material: [5, 12, 20, 24, 32, 33, 61, 62, 63, 64, 65],
  mysekai_item: [7],
  mysekai_music_record: [],
  mysekai_fixture: [118, 119, 120, 121]
}

const SUPER_RARE_ITEM: Record<string, number[]> = {
  mysekai_material: [5, 12, 20, 24],
  mysekai_item: [],
  mysekai_fixture: [],
  mysekai_music_record: []
}

const SITE_ID_MAP: Record<number, string> = {
  5: 'さいしょの原っぱ',
  6: '願いの砂浜',
  7: '彩りの花畑',
  8: '忘れ去られた場所'
}

// ==================== Data Parsing Logic ====================

interface ProcessedPoint {
  location: [number, number]
  fixtureId: number
  reward: Record<string, Record<string, number>>
}

function parseMySekaiData(data: any): Record<string, ProcessedPoint[]> {
  const processedMap: Record<string, ProcessedPoint[]> = {}
  const harvestMapsData = data?.updatedResources?.userMysekaiHarvestMaps || []

  for (const mpData of harvestMapsData) {
    const siteId = mpData.mysekaiSiteId
    const siteName = SITE_ID_MAP[siteId] || `Unknown Site ${siteId}`
    const mpDetail: ProcessedPoint[] = []

    const fixtures = mpData.userMysekaiSiteHarvestFixtures || []
    for (const fixture of fixtures) {
      if (fixture.userMysekaiSiteHarvestFixtureStatus === 'spawned') {
        mpDetail.push({
          location: [fixture.positionX, fixture.positionZ],
          fixtureId: fixture.mysekaiSiteHarvestFixtureId,
          reward: {}
        })
      }
    }

    const drops = mpData.userMysekaiSiteHarvestResourceDrops || []
    for (const drop of drops) {
      const posX = drop.positionX
      const posZ = drop.positionZ
      // Find matching fixture
      const matchingFixture = mpDetail.find(item => item.location[0] === posX && item.location[1] === posZ)

      if (matchingFixture) {
        const resourceType = drop.resourceType
        const resourceId = drop.resourceId
        const quantity = drop.quantity

        if (resourceType && resourceId !== undefined) {
          if (!matchingFixture.reward[resourceType]) {
            matchingFixture.reward[resourceType] = {}
          }
          matchingFixture.reward[resourceType][resourceId] = (matchingFixture.reward[resourceType][resourceId] || 0) + quantity
        }
      }
    }

    processedMap[siteName] = mpDetail
  }

  return processedMap
}

// ==================== Vue Logic ====================

const accountStore = useAccountStore()
const accounts = computed(() => accountStore.accounts)
const currentUserId = computed({
  get: () => accountStore.currentUserId,
  set: (v) => accountStore.selectAccount(v)
})

const isLoading = ref(false)
const errorMsg = ref('')
const parsedData = ref<Record<string, ProcessedPoint[]> | null>(null)
const selectedSceneKey = ref('scene1')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
// To store popup elements
const popupContainerRef = ref<HTMLDivElement | null>(null)

const selectedScene = computed(() => SCENES[selectedSceneKey.value])

// Filter State
const visibleResources = ref<Set<string>>(new Set())

interface ResourceStat {
    id: string // category:itemId
    category: string
    itemId: string
    name: string
    texture: string
    count: number
    isRare: boolean
    isSuperRare: boolean
}

// Extract available resources from current scene data
const resourceStats = computed(() => {
    const stats: Record<string, ResourceStat> = {}
    const data = parsedData.value
    const scene = selectedScene.value
    
    if (!data || !data[scene.name]) return []
    
    const points = data[scene.name]
    if (!points) return []
    
    points.forEach(point => {
        for (const category in point.reward) {
             for (const itemIdStr in point.reward[category]) {
                 const id = `${category}:${itemIdStr}`
                 const quantity = point.reward[category][itemIdStr]
                 
                 if (!stats[id]) {
                     const itemId = parseInt(itemIdStr)
                     const texture = ITEM_TEXTURES[category]?.[itemIdStr] || 
                                     (category === 'mysekai_music_record' ? '/img/mysekai/icon/Texture2D/item_surplus_music_record.png' : '')
                     
                     let isRare = false
                     let isSuperRare = false
                     
                     if (category === 'mysekai_music_record') {
                         isRare = true
                         isSuperRare = true
                     } else {
                         if (SUPER_RARE_ITEM[category]?.includes(itemId)) isSuperRare = true
                         if (RARE_ITEM[category]?.includes(itemId)) isRare = true
                     }
                     
                     stats[id] = {
                         id, category, itemId: itemIdStr,
                         name: '',
                         texture,
                         count: 0,
                         isRare,
                         isSuperRare
                     }
                 }
                 stats[id].count += quantity ?? 0
             }
        }
    })
    
    const list = Object.values(stats)
    
    list.sort((a, b) => {
        if (a.isSuperRare && !b.isSuperRare) return -1
        if (!a.isSuperRare && b.isSuperRare) return 1
        if (a.isRare && !b.isRare) return -1
        if (!a.isRare && b.isRare) return 1
        return a.id.localeCompare(b.id)
    })
    
    return list
})

// Reset filter when scene/data changes
watch([parsedData, selectedSceneKey], () => {
    visibleResources.value = new Set()
})

function toggleResource(id: string) {
    const newSet = new Set(visibleResources.value)
    if (newSet.has(id)) {
        newSet.delete(id)
    } else {
        newSet.add(id)
    }
    visibleResources.value = newSet
    drawPoints()
}

// Whether filter is active (user has selected specific items)
const isFilterActive = computed(() => visibleResources.value.size > 0)

// Fetch user data
async function fetchUserData() {
  if (!currentUserId.value) {
    errorMsg.value = '请先选择一个账号'
    return
  }
  
  isLoading.value = true
  errorMsg.value = ''
  parsedData.value = null
  
  try {
    const url = `https://suite-api.haruki.seiunx.com/public/jp/mysekai/${currentUserId.value}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`API请求失败: ${res.status}`)
    }
    const json = await res.json()
    // The structure returned by the API might vary, assuming it's the raw user data structure
    // If it's wrapped, we might need to adjust. Based on context, it returns what mysekai_test.json contains.
    if (json.upload_time) {
        uploadTime.value = json.upload_time
    }
    parsedData.value = parseMySekaiData(json)
    
  } catch (e: any) {
    errorMsg.value = e.message || '获取数据失败'
  } finally {
    isLoading.value = false
  }
}

// Watch for data or scene changes to re-render
watch([parsedData, selectedSceneKey], () => {
    nextTick(() => {
        initCanvas()
        if (parsedData.value) {
            drawPoints()
        }
    })
})

function initCanvas() {
  const canvas = canvasRef.value
  const image = imageRef.value
  if (!canvas || !image) return
  
  canvas.width = image.clientWidth
  canvas.height = image.clientHeight
  
  // Clear popups
  if (popupContainerRef.value) {
    popupContainerRef.value.innerHTML = ''
  }
  
  // Re-draw points after canvas resize/init
  if (parsedData.value) {
      drawPoints()
  }
}

function doContainsRareItem(reward: any, isSuperRare = false): boolean {
    let compareList: Record<string, number[]> = isSuperRare ? SUPER_RARE_ITEM : RARE_ITEM
    for (const category in reward) {
        if (reward.hasOwnProperty(category) && compareList.hasOwnProperty(category)) {
            for (const itemId of Object.keys(reward[category])) {
               if (compareList[category]?.includes(parseInt(itemId))) {
                   return true
               }
            }
        }
    }
    return false
}

function drawPoints() {
    const canvas = canvasRef.value
    const image = imageRef.value
    const data = parsedData.value
    const scene = selectedScene.value
    
    if (!canvas || !image || !data) return
    if (!data[scene.name]) return // No data for this scene

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (popupContainerRef.value) popupContainerRef.value.innerHTML = ''
    
    const points = data[scene.name]
    if (!points) return

    const physicalWidth = scene.physicalWidth
    const offsetX = scene.offsetX
    const offsetY = scene.offsetY
    const xDirection = scene.xDirection
    const yDirection = scene.yDirection
    const reverseXY = scene.reverseXY

    const displayWidth = image.clientWidth
    const naturalWidth = image.naturalWidth
    // Scale factor
    const displayGridWidth = physicalWidth * (displayWidth / naturalWidth)
    
    const originX = canvas.width / 2 + offsetX
    const originY = canvas.height / 2 + offsetY
    
    // Filter logic: empty set = show all, otherwise only show selected items
    const filterActive = visibleResources.value.size > 0
    const visibleSet = visibleResources.value

    points.forEach(point => {
        // Apply filter: build filtered reward if filter is active
        let rewardToShow = point.reward
        if (filterActive) {
            const filteredReward: any = {}
            let hasVisibleItems = false
            for (const cat in point.reward) {
                filteredReward[cat] = {}
                for (const itemId in point.reward[cat]) {
                    const id = `${cat}:${itemId}`
                    if (visibleSet.has(id)) {
                        filteredReward[cat][itemId] = point.reward[cat][itemId]
                        hasVisibleItems = true
                    }
                }
                if (Object.keys(filteredReward[cat]).length === 0) {
                    delete filteredReward[cat]
                }
            }
            if (!hasVisibleItems) return // Skip point entirely if no visible items
            rewardToShow = filteredReward
        }

        // Handle coordinate swapping if needed
        let pX = point.location[0]
        let pY = point.location[1]
        
        if (reverseXY) {
             const temp = pX
             pX = pY
             pY = temp
        }

        const displayX = xDirection === 'x+' ? originX + pX * displayGridWidth : originX - pX * displayGridWidth
        const displayY = yDirection === 'y+' ? originY + pY * displayGridWidth : originY - pY * displayGridWidth

        const color = FIXTURE_COLORS[point.fixtureId]
        
        if (color) {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(displayX, displayY, 5, 0, Math.PI * 2)
            ctx.fill()
            
            const containsRareItem = doContainsRareItem(rewardToShow)
             if (containsRareItem) {
                ctx.strokeStyle = 'red'
                ctx.beginPath()
                ctx.arc(displayX, displayY, 5, 0, Math.PI * 2)
                ctx.stroke()
            } else {
                ctx.strokeStyle = 'black'
                ctx.beginPath()
                ctx.arc(displayX, displayY, 5, 0, Math.PI * 2)
                ctx.stroke()
            }
            
            // Display reward popup with filtered reward
            createRewardPopup(rewardToShow, displayX + displayGridWidth * 0.4, displayY + displayGridWidth * 0.4, displayX, displayY, containsRareItem, reverseXY)
        } else {
             ctx.fillStyle = 'black'
             ctx.font = '12px Arial'
             ctx.fillText('?', displayX - 3, displayY + 4)
        }
    })
    
    adjustItemListPositions()
}

function createRewardPopup(reward: any, x: number, y: number, anchorX: number, anchorY: number, ifContainRareItem: boolean, reverseXY: boolean) {
    if (!popupContainerRef.value) return
    
    const itemList = document.createElement('div')
    // Compact styling: reduced padding
    itemList.className = 'absolute bg-black/40 backdrop-blur-sm rounded-md p-0.5 text-[10px] text-left w-max max-w-[120px] pointer-events-none z-10 flex gap-0.5 items-end shadow-md border border-white/10'
    itemList.classList.add('item-list-popup') 
    
    itemList.dataset.anchorX = String(anchorX)
    itemList.dataset.anchorY = String(anchorY)

    // Position setup
    if (reverseXY) {
        itemList.style.left = `${x}px`
        itemList.style.top = `${y - 10}px`
    } else {
        itemList.style.left = `${x}px`
        itemList.style.top = `${y}px`
    }
    
    if (ifContainRareItem || reward.hasOwnProperty("mysekai_music_record")) {
        if (doContainsRareItem(reward, true)) {
            itemList.style.backgroundColor = 'rgba(220, 38, 38, 0.6)'
            itemList.style.borderColor = 'rgba(254, 202, 202, 0.5)'
        } else {
            itemList.style.backgroundColor = 'rgba(37, 99, 235, 0.6)'
            itemList.style.borderColor = 'rgba(191, 219, 254, 0.5)'
        }
    }

    const allItems: { texture: string, quantity: number, isRecord?: boolean, isRare?: boolean }[] = []

    for (const category in reward) {
        if (!reward.hasOwnProperty(category)) continue
        for (const itemIdStr in reward[category]) {
            if (!reward[category].hasOwnProperty(itemIdStr)) continue
            
            const quantity = reward[category][itemIdStr]
            const texture = ITEM_TEXTURES[category]?.[itemIdStr] || ''
            const itemId = parseInt(itemIdStr)
            
            // Check if rare
            let isRare = false
            if (RARE_ITEM[category]?.includes(itemId) || SUPER_RARE_ITEM[category]?.includes(itemId)) {
                isRare = true
            }

            if (texture) {
                 allItems.push({ texture, quantity, isRare })
            } else if (category === "mysekai_music_record") {
                 allItems.push({ 
                     texture: '/img/mysekai/icon/Texture2D/item_surplus_music_record.png',
                     quantity,
                     isRecord: true,
                     isRare: true // Treat records as rare for sorting priority
                 })
            }
        }
    }

    if (allItems.length === 0) return

    // Sort: Rare items first
    allItems.sort((a, b) => {
        if (a.isRare && !b.isRare) return -1
        if (!a.isRare && b.isRare) return 1
        return 0
    })

    const mainItem = allItems[0]
    if (!mainItem) return // Should not happen due to length check above

    const subItems = allItems.slice(1)

    // Create Main Item Container
    const mainContainer = document.createElement('div')
    mainContainer.className = 'relative flex-shrink-0'
    
    const mainImg = document.createElement('img')
    mainImg.src = mainItem.texture
    if (mainItem.isRecord) mainImg.onerror = () => { mainImg.style.display = 'none' }
    // Reduced size: w-6 -> w-4 (16px)
    mainImg.className = 'w-4 h-4 object-contain drop-shadow-sm' 
    
    // Add glow effect for rare items
    if (mainItem.isRare) {
        mainImg.classList.add('rare-glow')
    }
    
    const mainQty = document.createElement('span')
    // Smaller font: text-[9px] -> text-[7px]
    mainQty.className = 'absolute -bottom-1 -right-1 text-[7px] font-bold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'
    mainQty.textContent = mainItem.quantity > 1 ? `x${mainItem.quantity}` : ''
    
    mainContainer.appendChild(mainImg)
    if (mainItem.quantity > 1) mainContainer.appendChild(mainQty)
    itemList.appendChild(mainContainer)

    // Create Sub Items Container
    if (subItems.length > 0) {
        const subContainer = document.createElement('div')
        mainContainer.appendChild(subContainer)
        // Offset adjustments for smaller main item
        subContainer.className = 'absolute -top-1 -right-3 flex flex-col gap-0 items-start pl-0.5'
        
        subItems.forEach(sub => {
             const subWrap = document.createElement('div')
             // Smaller padding
             subWrap.className = 'relative flex items-center bg-black/30 rounded-full pr-0.5 pl-0 mt-0.5 backdrop-blur-[1px]'
             
             const subImg = document.createElement('img')
             subImg.src = sub.texture
             // Reduced size: w-3 -> w-2 (8px), maybe 2.5 (10px)? Let's try w-2.5 h-2.5
             subImg.className = 'w-2.5 h-2.5 object-contain'
             if (sub.isRecord) subImg.onerror = () => { subImg.style.display = 'none' }

             const subQty = document.createElement('span')
             // Smaller font: text-[7px] -> text-[6px]
             subQty.className = 'text-[6px] font-bold text-white ml-0.5 leading-none'
             subQty.textContent = sub.quantity > 1 ? `x${sub.quantity}` : ''
             
             subWrap.appendChild(subImg)
             if (sub.quantity > 1) subWrap.appendChild(subQty)
             
             subContainer.appendChild(subWrap)
        })
    }
    
    if (itemList.hasChildNodes()) {
         popupContainerRef.value.appendChild(itemList)
    }
}

const uploadTime = ref<number | null>(null)

const uploadTimeStr = computed(() => {
    if (!uploadTime.value) return ''
    return new Date(uploadTime.value * 1000).toLocaleString('zh-CN', { hour12: false })
})

const isDataStale = computed(() => {
    if (!uploadTime.value) return false
    const now = new Date()
    
    // Beijing Time logic (UTC+8) assumption: Browsers use local time, user is in UTC+8
    // Calculate valid period start
    const validStart = getValidPeriodStart(now)
    const validStartTs = validStart.getTime() / 1000
    
    return uploadTime.value < validStartTs
})

function getValidPeriodStart(now: Date): Date {
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()
    const h = now.getHours()
    
    let start = new Date(y, m, d, 4, 0, 0) // Default today 04:00
    
    if (h < 4) {
        // Before 04:00, period started yesterday 16:00
        start = new Date(y, m, d - 1, 16, 0, 0)
    } else if (h >= 4 && h < 16) {
        // Between 04:00 and 16:00, start is today 04:00
        start = new Date(y, m, d, 4, 0, 0)
    } else {
        // After 16:00, start is today 16:00
        start = new Date(y, m, d, 16, 0, 0)
    }
    return start
}

// Updated adjustItemListPositions with better collision resolution
function adjustItemListPositions() {
    if (!popupContainerRef.value) return
    const itemLists = Array.from(popupContainerRef.value.querySelectorAll('.item-list-popup')) as HTMLElement[]
    
    // Iterative relaxation
    const iterations = 10
    
    for (let iter = 0; iter < iterations; iter++) {
        let moved = false
        for (let i = 0; i < itemLists.length; i++) {
            const itemI = itemLists[i]
            if (!itemI) continue
            const rect1 = itemI.getBoundingClientRect()
            const x1 = rect1.left + rect1.width / 2
            const y1 = rect1.top + rect1.height / 2
            
            for (let j = i + 1; j < itemLists.length; j++) {
                 const itemJ = itemLists[j]
                 if (!itemJ) continue
                 const rect2 = itemJ.getBoundingClientRect()
                 
                 // Check overlap
                 if (!(rect1.right < rect2.left || 
                       rect1.left > rect2.right || 
                       rect1.bottom < rect2.top || 
                       rect1.top > rect2.bottom)) {
                     
                     // Overlapping
                     const x2 = rect2.left + rect2.width / 2
                     const y2 = rect2.top + rect2.height / 2
                     
                     let dx = x2 - x1
                     let dy = y2 - y1
                     
                     // If exactly same position, jitter
                     if (dx === 0 && dy === 0) {
                         dx = (Math.random() - 0.5) * 5
                         dy = (Math.random() - 0.5) * 5
                     }
                     
                     // Normalize
                     const dist = Math.sqrt(dx * dx + dy * dy)
                     const ndx = dx / dist
                     const ndy = dy / dist
                     
                     // Push amount
                     const moveX = ndx * 2 // Small steps
                     const moveY = ndy * 2
                     
                     const currentLeftJ = parseFloat(itemJ.style.left || '0')
                     const currentTopJ = parseFloat(itemJ.style.top || '0')
                     
                     if (!isNaN(currentLeftJ) && !isNaN(currentTopJ)) {
                         itemJ.style.left = `${currentLeftJ + moveX}px`
                         itemJ.style.top = `${currentTopJ + moveY}px`
                         moved = true
                     }
                 }
            }
        }
        if (!moved) break;
    }

    // Draw connecting lines
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 1.5
    
    itemLists.forEach(item => {
        const anchorX = parseFloat(item.dataset.anchorX || '0')
        const anchorY = parseFloat(item.dataset.anchorY || '0')
        
        const currentLeft = parseFloat(item.style.left || '0')
        const currentTop = parseFloat(item.style.top || '0')
        const width = item.offsetWidth
        const height = item.offsetHeight
        
        // Target (popup) rectangle
        const rectLeft = currentLeft
        const rectTop = currentTop
        const rectRight = currentLeft + width
        const rectBottom = currentTop + height
        
        // Find nearest point on rectangle to anchor
        
        // Default to center if inside? No, point is usually outside.
        // Clamping logic:
        // x = clamp(anchorX, rectLeft, rectRight)
        // y = clamp(anchorY, rectTop, rectBottom)
        // Does this work?
        // If anchor is to the left, x = rectLeft. y = clamped Y.
        // This finds the point on the rectangle closest to the anchor.
        
        const nearestX = Math.max(rectLeft, Math.min(anchorX, rectRight))
        const nearestY = Math.max(rectTop, Math.min(anchorY, rectBottom))
        
        // Draw line from anchor to nearest point
        ctx.beginPath()
        ctx.moveTo(anchorX, anchorY)
        ctx.lineTo(nearestX, nearestY)
        ctx.stroke()
        
        // Draw a small dot at anchor to verify position (already drawn by main loop, but reinforce)
        // Actually main loop draws colored dots. We don't need to redraw.
    })
    
    ctx.restore()
}

// Window resize handling
onMounted(() => {
    window.addEventListener('resize', initCanvas)
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold flex items-center gap-3">
      MySekai 透视
    </h1>

    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex flex-wrap gap-4 items-center mb-4">
             <!-- Account Selection -->
             <div v-if="uploadTimeStr" class="badge badge-lg gap-2" :class="isDataStale ? 'badge-warning' : 'badge-ghost'">
                 更新时间: {{ uploadTimeStr }}
                 <span v-if="isDataStale" class="text-xs font-bold">(数据已过期)</span>
             </div>
             <select
               v-if="accounts.length > 0"
               v-model="currentUserId"
               class="select select-bordered select-sm w-full max-w-xs"
             >
               <option disabled value="">选择账号</option>
               <option v-for="acc in accounts" :key="acc.userId" :value="acc.userId">
                 {{ acc.userId }} - {{ acc.name }}
               </option>
             </select>
             <div v-else class="text-sm text-error">
                请先在个人信息页面添加账号
             </div>

             <!-- Fetch Button -->
             <button 
                class="btn btn-primary btn-sm" 
                :disabled="!currentUserId || isLoading"
                @click="fetchUserData"
             >
                <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
                获取数据
             </button>
             
             <!-- Error Message -->
             <span v-if="errorMsg" class="text-error text-sm">{{ errorMsg }}</span>
        </div>
        
        <div class="flex flex-wrap gap-4 items-center">
            <!-- Scene Selection -->
            <label class="form-control w-full max-w-xs">
              <div class="label">
                <span class="label-text">选择场景</span>
              </div>
              <select v-model="selectedSceneKey" class="select select-bordered select-sm">
                <option v-for="(scene, key) in SCENES" :key="key" :value="key">
                  {{ scene.name }}
                </option>
              </select>
            </label>
        </div>
      </div>
    </div>

     <!-- Resource Filter Legend -->
     <div class="card bg-base-100 shadow-lg" v-if="resourceStats.length > 0">
         <div class="card-body p-4">
             <h3 class="text-sm font-bold mb-2">资源筛选 <span v-if="isFilterActive">({{ visibleResources.size }}/{{ resourceStats.length }})</span><span v-else class="text-xs opacity-50">点击图标筛选</span></h3>
             <div class="flex flex-wrap gap-2">
                 <div 
                    v-for="item in resourceStats" 
                    :key="item.id"
                    class="flex items-center gap-1 px-2 py-1 rounded-full border cursor-pointer select-none transition-all duration-200"
                    :class="[
                        visibleResources.has(item.id) 
                            ? (item.isSuperRare ? 'bg-red-500/20 border-red-500' : (item.isRare ? 'bg-blue-500/20 border-blue-500' : 'bg-base-200 border-base-300')) 
                            : (isFilterActive ? 'bg-transparent border-transparent opacity-40 grayscale' : (item.isSuperRare ? 'bg-red-500/10 border-red-500/30' : (item.isRare ? 'bg-blue-500/10 border-blue-500/30' : 'bg-base-200 border-base-300')))
                    ]"
                    @click="toggleResource(item.id)"
                 >
                     <img :src="item.texture" class="w-4 h-4 object-contain" />
                     <span class="text-xs font-bold">{{ item.count }}</span>
                 </div>
             </div>
         </div>
     </div>

     <!-- Visualization Area -->
    <div class="card bg-base-100 shadow-lg overflow-hidden">
        <div class="card-body p-0 relative w-full overflow-x-auto">
             <!-- Container -->
             <div class="relative inline-block w-full min-w-[800px]">
                 <img 
                    ref="imageRef"
                    :src="selectedScene.imagePath" 
                    class="block w-full h-auto"
                    @load="initCanvas"
                 />
                 <canvas 
                    ref="canvasRef"
                    class="absolute top-0 left-0 w-full h-full pointer-events-none"
                 ></canvas>
                 <!-- Popup container -->
                 <div ref="popupContainerRef" class="absolute top-0 left-0 w-full h-full pointer-events-none"></div>
             </div>
        </div>
    </div>
    
  </div>
</template>

<style>
.item-list-popup {
    transition: all 0.2s ease;
}
.item-list-popup:hover {
    z-index: 100 !important;
    background-color: rgba(100, 100, 100, 0.9) !important;
    transform: scale(1.1);
}

/* Optical Flare Effect */
@keyframes flare-rotate {
  0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 0.8; }
}

@keyframes flare-pulse {
   0% { box-shadow: 0 0 5px #ff5555, 0 0 10px #ff0000; }
   100% { box-shadow: 0 0 10px #ff8888, 0 0 20px #ff2222; }
}

.rare-flare-container {
    position: relative;
}

/* Central strong glow */
.rare-flare-container::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200%;
    height: 200%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(255, 200, 150, 0.6) 0%, rgba(255, 50, 50, 0.2) 40%, transparent 70%);
    mix-blend-mode: screen;
    pointer-events: none;
    z-index: 0;
    animation: flare-rotate 4s infinite linear;
}

/* Cross flare (Horizontal) */
.rare-flare-container::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 10%;
    width: 80%; /* reduced width relative to container to avoid huge spills */
    height: 2px;
    background: linear-gradient(90deg, transparent, #fff, transparent);
    box-shadow: 0 0 4px #ff5555;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 20;
    animation: pulse-width 2s infinite ease-in-out;
    opacity: 0.8;
}

</style>
