import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页' },
    },
    {
        path: '/musics',
        name: 'Musics',
        component: () => import('@/views/MusicsView.vue'),
        meta: { title: '歌曲' },
    },
    {
        path: '/musics/search',
        name: 'MusicSearch',
        component: () => import('@/views/MusicsView.vue'),
        meta: { title: '搜索歌曲' },
    },
    {
        path: '/musics/:id',
        name: 'MusicDetail',
        component: () => import('@/views/MusicDetailView.vue'),
        meta: { title: '歌曲详情' },
    },
    {
        path: '/cards',
        name: 'Cards',
        component: () => import('@/views/CardsView.vue'),
        meta: { title: '卡片' },
    },
    {
        path: '/cards/:id',
        name: 'CardDetail',
        component: () => import('@/views/CardDetailView.vue'),
        meta: { title: '卡片详情' },
    },
    {
        path: '/card-collection',
        name: 'CardCollection',
        component: () => import('@/views/CardCollectionView.vue'),
        meta: { title: '图鉴状态' },
    },
    {
        path: '/events',
        name: 'Events',
        component: () => import('@/views/EventsView.vue'),
        meta: { title: '活动' },
    },
    {
        path: '/ranking',
        name: 'EventRanking',
        component: () => import('@/views/EventRankingView.vue'),
        meta: { title: '实时榜况' },
    },
    {
        path: '/events/:id',
        name: 'EventDetail',
        component: () => import('@/views/EventDetailView.vue'),
        meta: { title: '活动详情' },
    },
    {
        path: '/sus2img',
        name: 'Sus2Img',
        component: () => import('@/views/Sus2ImgView.vue'),
        meta: { title: '谱面转图片' },
    },
    {
        path: '/chart-share',
        name: 'ChartShare',
        component: () => import('@/views/ChartShareView.vue'),
        meta: { title: '谱面分享' },
    },
    {
        path: '/sus2img/preview',
        name: 'Sus2ImgPreview',
        component: () => import('@/views/Sus2ImgPreviewView.vue'),
        meta: { title: '谱面预览', fullscreen: true },
    },
    {
        path: '/about',
        name: 'About',
        component: () => import('@/views/AboutView.vue'),
        meta: { title: '关于' },
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '设置' },
    },

    {
        path: '/gachas',
        name: 'Gachas',
        component: () => import('@/views/GachasView.vue'),
        meta: { title: '卡池' },
    },
    {
        path: '/gacha/:id',
        name: 'GachaDetail',
        component: () => import('@/views/GachaDetailView.vue'),
        meta: { title: '卡池详情' },
    },
    {
        path: '/profile',
        name: 'UserProfile',
        component: () => import('@/views/UserProfileView.vue'),
        meta: { title: '个人信息' },
    },
    {
        path: '/never-gonna-give-you-up',
        name: 'MySekai',
        component: () => import('@/views/MySekaiView.vue'),
        meta: { title: 'MySekai 透视' },
    },
    {
        path: '/oauth2/callback/code',
        name: 'OAuthCallback',
        component: () => import('@/views/OAuthCallbackView.vue'),
        meta: { title: 'OAuth 授权回调', fullscreen: true },
    },
    // 兼容旧路由
    {
        path: '/deck-recommend',
        name: 'DeckRecommend',
        component: () => import('@/views/DeckRecommendView.vue'),
        meta: { title: '自动组队' },
    },
    {
        path: '/musics/page/:page',
        redirect: (to) => ({ path: '/musics', query: { page: to.params.page } }),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { top: 0 }
    },
})

// 路由守卫：设置页面标题
router.beforeEach((to, _from, next) => {
    const title = to.meta.title as string
    document.title = title ? `${title} - Uni PJSK Viewer` : 'Uni PJSK Viewer'
    next()
})

export default router
