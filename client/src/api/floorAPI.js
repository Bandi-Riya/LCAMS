import axiosInstance from './axiosInstance'

export async function getFloors(params) {
  const res = await axiosInstance.get('/floors', { params })
  return res.data
}

export async function createFloor(data) {
  const res = await axiosInstance.post('/floors', data)
  return res.data
}

export async function updateFloor(id, data) {
  const res = await axiosInstance.put(`/floors/${id}`, data)
  return res.data
}

export async function deleteFloor(id) {
  const res = await axiosInstance.delete(`/floors/${id}`)
  return res.data
}

export async function getFloorRooms(id) {
  const res = await axiosInstance.get(`/floors/${id}/rooms`)
  return res.data
}

