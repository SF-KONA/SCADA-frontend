import http from './http'

export const getOptimizationHistory = (equipmentId, size = 5) => {
    return http.get('/optimization/history', {
        params: { equipmentId, size },
    })
}
