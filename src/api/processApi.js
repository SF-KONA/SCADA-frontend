import http from './http.js'

export const getProcessList = () => http.get('/processes')

export const getPartnerDetail = (stepNo) => http.get(`/processes/${stepNo}/partner`)

export const getEquipmentList = (stepNo) => http.get(`/processes/${stepNo}/equipments`)

export const getEquipmentParameters = (equipmentId, period) =>
  http.get(`/equipments/${equipmentId}/parameters`, { params: { period } })

export const getEquipmentAlarms = (equipmentId, status) =>
  http.get(`/equipments/${equipmentId}/alarms`, { params: { status } })

export const getEquipmentEvents = (equipmentId, page, size) =>
  http.get(`/equipments/${equipmentId}/events`, { params: { page, size } })

export const addEquipmentNote = (equipmentId, noteText) =>
  http.post(`/equipments/${equipmentId}/notes`, { noteText })