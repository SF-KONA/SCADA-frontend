import http from './http'

export const createUser = userData => {
    return http.post('/users', userData)
}