import http from './http'

export const getDashboardStatus = () => http.get('/dashboard/kpi')
export const getOeeSummary = (period = 'today') => http.get('/dashboard/oee', { params: { period } })
export const getDefectRate = (period = 'today') => http.get('/dashboard/defect-rate', { params: { period } })
export const getYieldSummary = (period = 'today') => http.get('/dashboard/yield', { params: { period } })
export const getDashboardEquipments = (params = {}) => http.get('/dashboard/equipments', { params })
