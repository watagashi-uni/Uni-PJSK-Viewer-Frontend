import axios from 'axios'

export const masterApiBaseUrl = (import.meta.env.VITE_MASTER_API_BASE_URL || 'https://jp-master.unipjsk.com').replace(/\/+$/, '')

// Content-Encoding: br is decoded by the browser before Axios parses JSON.
export const masterApiClient = axios.create({
    baseURL: masterApiBaseUrl,
    timeout: 30000,
})
