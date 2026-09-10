import axios from 'axios'
import { ensureApiEndpointReady, getActiveApiBaseUrl } from './endpoint'

// API 基础配置
const defaultConfig = {
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
}

const apiClient = axios.create({
    baseURL: getActiveApiBaseUrl(),
    ...defaultConfig,
})

apiClient.interceptors.request.use(async (config) => {
    await ensureApiEndpointReady()
    config.baseURL = getActiveApiBaseUrl()
    return config
})

export default apiClient
