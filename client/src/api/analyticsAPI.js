import axiosInstance from './axiosInstance'

export async function getSummary() {
  const res = await axiosInstance.get('/analytics/summary')
  return res.data
}

