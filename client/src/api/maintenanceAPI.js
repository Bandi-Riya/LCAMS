import axiosInstance from './axiosInstance'

export async function getLogs(params) {
  const res = await axiosInstance.get('/maintenance', { params })
  return res.data
}

export async function getLogById(id) {
  const res = await axiosInstance.get(`/maintenance/${id}`)
  return res.data
}

export async function createLog(data) {
  const res = await axiosInstance.post('/maintenance', data)
  return res.data
}

export async function updateLog(id, data) {
  const res = await axiosInstance.put(`/maintenance/${id}`, data)
  return res.data
}

export async function updateLogStatus(id, data) {
  const res = await axiosInstance.patch(`/maintenance/${id}/status`, data)
  return res.data
}

