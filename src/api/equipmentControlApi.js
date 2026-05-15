import http from './http'

export const getControllableParameters = equipmentId => {
    return http.get(`/equipments/${equipmentId}/parameters/controllable`)
}

export const updateEquipmentParameter = (equipmentId, paramId, data) => {
    return http.patch(`/equipments/${equipmentId}/parameters/${paramId}`, data)
}