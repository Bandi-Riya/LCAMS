import axiosInstance from './axiosInstance'

export async function getBlocks() {
  const res = await axiosInstance.get('/blocks')
  return res.data
}

export async function getBlockById(id) {
  const res = await axiosInstance.get(`/blocks/${id}`)
  return res.data
}

export async function getBlockFloors(id) {
  const res = await axiosInstance.get(`/blocks/${id}/floors`)
  return res.data
}

export async function createBlock(data) {
  const res = await axiosInstance.post('/blocks', data)
  return res.data
}

export async function updateBlock(id, data) {
  const res = await axiosInstance.put(`/blocks/${id}`, data)
  return res.data
}

export async function deleteBlock(id) {
  const res = await axiosInstance.delete(`/blocks/${id}`)
  return res.data
}

