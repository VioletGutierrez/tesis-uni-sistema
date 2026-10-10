// ==================== CONFIGURACION API ====================
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://tesis-uni-api.onrender.com/api';

// ==================== HELPER DE PETICIONES ====================
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      showToast('Sesion expirada. Vuelve a iniciar sesion.', 'warning');
      setTimeout(() => window.location.reload(), 1500);
      throw new Error('Sesion expirada');
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || data.error || 'Error en la peticion');
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar al servidor. Verifica que el backend este activo.');
    }
    throw error;
  }
}

// ==================== SISTEMA DE TOASTS ====================
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const colors = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-sky-500 text-white'
  };

  const icons = {
    success: 'OK',
    error: 'X',
    warning: '!',
    info: 'i'
  };

  const toast = document.createElement('div');
  toast.className = `${colors[type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn`;
  toast.innerHTML = `
    <span class="text-lg font-bold">${icons[type]}</span>
    <span class="flex-1 text-sm">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white text-lg leading-none">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}