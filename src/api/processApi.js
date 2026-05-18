import api from './index.js'

export const getProcessList = () => api.get('/processes')

export const getPartnerDetail = (stepNo) => api.get(`/processes/${stepNo}/partner`)