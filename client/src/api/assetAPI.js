import axiosInstance from './axiosInstance'

export async function getAssets(params) {
  const res = await axiosInstance.get('/assets', { params })
  return res.data
}

export async function getAssetById(id) {
  const res = await axiosInstance.get(`/assets/${id}`)
  return res.data
}

export async function createAsset(data) {
  const res = await axiosInstance.post('/assets', data)
  return res.data
}

export async function updateAsset(id, data) {
  const res = await axiosInstance.put(`/assets/${id}`, data)
  return res.data
}

export async function updateAssetStatus(id, status) {
  const res = await axiosInstance.patch(`/assets/${id}/status`, { status })
  return res.data
}

export async function deleteAsset(id) {
  const res = await axiosInstance.delete(`/assets/${id}`)
  return res.data
}

