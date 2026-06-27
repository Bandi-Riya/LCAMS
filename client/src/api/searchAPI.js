import axiosInstance from './axiosInstance'

export async function search(q) {
  const res = await axiosInstance.get('/search', { params: { q } })
  return res.data
}

