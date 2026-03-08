import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
    const isSupported = ref(false)
    const isSubscribed = ref(false)
    const isChina = ref(false)
    const isAndroid = ref(/android/i.test(navigator.userAgent))
    const isIOS = ref(/iPad|iPhone|iPod/.test(navigator.userAgent))
    const isStandalone = ref(window.matchMedia('(display-mode: standalone)').matches)

    const subscribedTopics = ref<string[]>([])
    const isLoading = ref(true)

    async function checkLocation() {
        try {
            const res = await fetch('/api/location')
            const text = await res.text()
            isChina.value = (text.trim() === '1')
        } catch {
            // 默认非大陆
        }
    }

    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    async function initialize() {
        isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window
        if (!isSupported.value) {
            isLoading.value = false
            return
        }

        await checkLocation()

        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                isSubscribed.value = true
                // 尝试从本地存储恢复 topics（避免重复调用注册 API，或者你可以从后端查询，这里简单用 localStorage）
                const savedTopics = localStorage.getItem('push_topics')
                if (savedTopics) {
                    subscribedTopics.value = JSON.parse(savedTopics)
                } else {
                    // 默认如果订阅了但没记录，给全选
                    subscribedTopics.value = ['vlive', 'music', 'apd']
                }
            }
        } catch (e) {
            console.error('Failed to check push subscription:', e)
        } finally {
            isLoading.value = false
        }
    }

    async function subscribe(topics: string[]) {
        if (!isSupported.value) throw new Error('Push messaging is not supported')

        const registration = await navigator.serviceWorker.ready

        // 获取 VAPID
        const res = await fetch('/api/push/vapid-key')
        if (!res.ok) throw new Error('Failed to get VAPID key')
        const { publicKey } = await res.json()

        // 订阅
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        })

        // 发到后端
        const subscribeRes = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.toJSON().keys?.p256dh,
                    auth: subscription.toJSON().keys?.auth
                },
                topics,
                is_china: isChina.value
            })
        })

        if (!subscribeRes.ok) throw new Error('Failed to save subscription to server')

        isSubscribed.value = true
        subscribedTopics.value = topics
        localStorage.setItem('push_topics', JSON.stringify(topics))
    }

    async function unsubscribe() {
        if (!isSubscribed.value) return

        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            })
            await subscription.unsubscribe()
        }

        isSubscribed.value = false
        subscribedTopics.value = []
        localStorage.removeItem('push_topics')
    }

    async function updateTopics(topics: string[]) {
        if (topics.length === 0) {
            await unsubscribe()
            return
        }
        if (!isSubscribed.value) {
            await subscribe(topics)
        } else {
            // 已经订阅，只更新后端 topics
            await subscribe(topics)
        }
    }

    async function toggleSubscription(topic: string) {
        if (!isSubscribed.value) {
            // First time enabling push notifications
            await subscribe([topic])
            return
        }

        const currentTopics = [...subscribedTopics.value]
        const index = currentTopics.indexOf(topic)

        if (index > -1) {
            currentTopics.splice(index, 1)
        } else {
            currentTopics.push(topic)
        }

        await updateTopics(currentTopics)
    }

    function hasSubscription(topic: string): boolean {
        return subscribedTopics.value.includes(topic)
    }

    async function testNotification() {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (!subscription) throw new Error('Not subscribed')

        await fetch('/api/push/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.toJSON().keys?.p256dh,
                    auth: subscription.toJSON().keys?.auth
                }
            })
        })
    }

    return {
        isSupported,
        isSubscribed,
        isLoading,
        isChina,
        isAndroid,
        isIOS,
        isStandalone,
        subscribedTopics,
        initialize,
        subscribe,
        unsubscribe,
        updateTopics,
        toggleSubscription,
        hasSubscription,
        testNotification
    }
})
