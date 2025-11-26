import axios from 'axios';
import { toast } from 'react-toastify';

// Configurar base URL
axios.defaults.baseURL = 'http://localhost:3001';

// Interceptor para incluir token em todas as requisições
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas de erro 401 (token expirado)
// Throttle state for 403 toasts
let last403ToastAt = 0;
const PERMISSION_TOAST_INTERVAL = 2000; // 2s

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de acesso negado (403)
    if (error.response?.status === 403) {
      const now = Date.now();
      if (now - last403ToastAt > PERMISSION_TOAST_INTERVAL) {
        last403ToastAt = now;
        toast.error('Nível de permissão insuficiente');
      }
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      const originalRequest = error.config || {};
      const url = originalRequest.url || '';

      // Não redireciona quando é a própria rota de login
      if (url.includes('/api/login')) {
        return Promise.reject(error);
      }

      // Só redireciona se havia uma sessão (token presente)
      const hasToken = !!localStorage.getItem('token');
      if (hasToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;