/**
 * Retorna a base URL da API baseada no hostname atual
 * Usa localhost quando acessado localmente, ou o IP da máquina quando acessado via rede
 * 
 * @returns {string} URL base da API (ex: 'http://localhost:3001' ou 'http://192.168.0.3:3001')
 */
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Se for localhost ou 127.0.0.1, usa localhost para evitar problemas de CORS
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Caso contrário, usa o IP do hostname atual
  return `http://${hostname}:3001`;
};

/**
 * Retorna a URL completa para um endpoint da API
 * 
 * @param {string} endpoint - O endpoint da API (ex: '/api/receitas')
 * @returns {string} URL completa (ex: 'http://localhost:3001/api/receitas')
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Remove barra inicial do endpoint se existir para evitar duplicação
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

export default { getApiBaseUrl, getApiUrl };
