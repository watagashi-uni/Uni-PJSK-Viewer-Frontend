import axios from 'axios'

// API 基础配置
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

export default apiClient
