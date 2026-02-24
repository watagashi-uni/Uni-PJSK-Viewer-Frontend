import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

import { createHead } from '@unhead/vue/client'

// 创建应用实例
const app = createApp(App)
const head = createHead()

// 使用插件
app.use(createPinia())
app.use(router)
app.use(head)

// 挂载应用
app.mount('#app')
