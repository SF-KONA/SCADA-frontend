import http from './http'

export const login = loginData => {
    return http.post('/auth/login', loginData)
}

export const refreshAccessToken = refreshToken => {
    return http.post('/auth/refresh', {
        refreshToken,
    })
}

export const logout = () => {
    return http.post('/auth/logout')
}

export const sendEmailCode = emailData => {
    return http.post('/auth/email/send', emailData)
}

export const verifyEmailCode = verifyData => {
    return http.post('/auth/email/verify', verifyData)
}