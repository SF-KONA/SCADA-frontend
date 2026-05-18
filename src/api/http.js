import axios from 'axios'

const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        error ? reject(error) : resolve(token)
    })
    failedQueue = []
}

// 요청 인터셉터: accessToken 자동 첨부
http.interceptors.request.use(
    config => {
        const accessToken = sessionStorage.getItem('accessToken')
        if (accessToken) {
            config.headers.Authorization = 'Bearer ' + accessToken
        }
        return config
    },
    error => Promise.reject(error),
)

// 응답 인터셉터: 401 시 refreshToken으로 재발급 후 원래 요청 재시도
http.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error)
        }

        const refreshToken = sessionStorage.getItem('refreshToken')
        if (!refreshToken) {
            sessionStorage.clear()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            }).then(token => {
                originalRequest.headers.Authorization = 'Bearer ' + token
                return http(originalRequest)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
            const { data } = await axios.post(
                import.meta.env.VITE_API_BASE_URL + '/auth/refresh',
                { refreshToken },
            )

            const newToken = data.data?.accessToken ?? data.accessToken
            sessionStorage.setItem('accessToken', newToken)
            http.defaults.headers.common.Authorization = 'Bearer ' + newToken

            processQueue(null, newToken)
            originalRequest.headers.Authorization = 'Bearer ' + newToken
            return http(originalRequest)
        } catch (refreshError) {
            processQueue(refreshError, null)
            sessionStorage.clear()
            window.location.href = '/login'
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    },
)

export default http
