// Configuracion de la API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://tesis-uni-api.onrender.com/api'; // Cambia esto cuando despliegues

// Helper para peticiones
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Sesion expirada');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || 'Error en la peticion');
  return data;
}