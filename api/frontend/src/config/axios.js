import axios from 'axios';

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
axios.interceptors.response.use(
  (response) => response,
  (error) => {
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