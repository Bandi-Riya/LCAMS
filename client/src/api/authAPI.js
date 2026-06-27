import axiosInstance from './axiosInstance'

export async function login(email, password) {
  const response = await axiosInstance.post('/auth/login', { email, password })
  return response.data
}

export async function getMe() {
  const response = await axiosInstance.get('/auth/me')
  return response.data
}

export async function register(userData) {
  const response = await axiosInstance.post('/auth/register', userData)
  return response.data
}

