import api from './index.js'

export const getProcessList = () => api.get('/processes')

export const getPartnerDetail = (stepNo) => api.get(`/processes/${stepNo}/partner`)

export const getEquipmentList = (stepNo) => api.get(`/processes/${stepNo}/equipments`)

export const getEquipmentParameters = (equipmentId, period) =>
  api.get(`/equipments/${equipmentId}/parameters`, { params: { period } })

export const getEquipmentAlarms = (equipmentId, status) =>
  api.get(`/equipments/${equipmentId}/alarms`, { params: { status } })

export const getEquipmentEvents = (equipmentId, page, size) =>
  api.get(`/equipments/${equipmentId}/events`, { params: { page, size } })

export const addEquipmentNote = (equipmentId, noteText) =>
  api.post(`/equipments/${equipmentId}/notes`, { noteText })