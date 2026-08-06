import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8888/mobilecmsapi/v50',
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('currentUser');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return config;
});

export default api;
