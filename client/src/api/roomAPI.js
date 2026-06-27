import axiosInstance from './axiosInstance'

export async function getRooms(params) {
  const res = await axiosInstance.get('/rooms', { params })
  return res.data
}

export async function getRoomById(id) {
  const res = await axiosInstance.get(`/rooms/${id}`)
  return res.data
}

export async function getRoomAssets(id) {
  const res = await axiosInstance.get(`/rooms/${id}/assets`)
  return res.data
}

export async function createRoom(data) {
  const res = await axiosInstance.post('/rooms', data)
  return res.data
}

export async function updateRoom(id, data) {
  const res = await axiosInstance.put(`/rooms/${id}`, data)
  return res.data
}

export async function deleteRoom(id) {
  const res = await axiosInstance.delete(`/rooms/${id}`)
  return res.data
}

