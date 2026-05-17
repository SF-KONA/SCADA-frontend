import http from './http'

export const getUsers = (params) => http.get('/users', { params })
export const getUser = (userId) => http.get(`/users/${userId}`)
export const createUser = (userData) => http.post('/users', userData)
export const updateUser = (userId, data) => http.put(`/users/${userId}`, data)
export const resetPassword = (userId) => http.post(`/users/${userId}/reset-password`)
export const lockUser = (userId) => http.post(`/users/${userId}/lock`)
export const unlockUser = (userId) => http.post(`/users/${userId}/unlock`)
export const deactivateUser = (userId) => http.post(`/users/${userId}/deactivate`)
export const activateUser = (userId) => http.post(`/users/${userId}/activate`)
export const checkUserId = (userId) => http.get('/users/check-id', { params: { userId } })
export const checkEmail = (email) => http.get('/users/check-email', { params: { email } })
export const getFactories = () => http.get('/factories')
