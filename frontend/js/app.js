// ==================== ESTADO GLOBAL ====================
let currentUser = null;

// ==================== INICIALIZACION ====================
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('jwt_token');
  const user = localStorage.getItem('user');

  if (token && user) {
    currentUser = JSON.parse(user);
    mostrarDashboard();
  }

  // Eventos
  document.getElementById('formLogin').addEventListener('submit', handleLogin);
  document.getElementById('formRegister').addEventListener('submit', handleRegister);
  document.getElementById('linkRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.remove('hidden');
  });
  document.getElementById('linkLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
  });
  document.getElementById('btnLogout').addEventListener('click', handleLogout);
  document.getElementById('btnNuevaTesis').addEventListener('click', () => {
    document.getElementById('formTesisContainer').classList.toggle('hidden');
  });
  document.getElementById('btnCancelarTesis').addEventListener('click', () => {
    document.getElementById('formTesisContainer').classList.add('hidden');
  });
  document.getElementById('formTesis').addEventListener('submit', handleCrearTesis);
});

// ==================== AUTENTICACION ====================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const alertBox = document.getElementById('loginAlert');

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    currentUser = data.user;
    mostrarDashboard();
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const carnet = document.getElementById('regCarnet').value;
  const alertBox = document.getElementById('registerAlert');

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password, carnet, rol: 'estudiante' })
    });
    alertBox.textContent = 'Usuario creado. Redirigiendo...';
    alertBox.className = 'p-3 rounded text-sm bg-green-100 text-green-800';
    setTimeout(() => {
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      mostrarDashboard();
    }, 1000);
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
  }
}

function handleLogout() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  currentUser = null;
  document.getElementById('dashboardSection').classList.add('hidden');
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('userInfo').classList.add('hidden');
}

// ==================== DASHBOARD ====================
function mostrarDashboard() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('registerSection').classList.add('hidden');
  document.getElementById('dashboardSection').classList.remove('hidden');
  document.getElementById('userInfo').classList.remove('hidden');
  document.getElementById('userName').textContent = `${currentUser.nombre} (${currentUser.rol})`;
  cargarTesis();
}

async function cargarTesis() {
  try {
    const tesis = await apiFetch('/tesis');
    const tabla = document.getElementById('tablaTesis');
    const empty = document.getElementById('emptyTesis');
    tabla.innerHTML = '';

    if (tesis.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    tesis.forEach(t => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50';
      tr.innerHTML = `
        <td class="p-3 text-sm font-semibold">${escapeHTML(t.titulo)}</td>
        <td class="p-3 text-sm">${t.estudiante ? escapeHTML(t.estudiante.nombre) : 'N/A'}</td>
        <td class="p-3 text-sm">${escapeHTML(t.lineaInvestigacion)}</td>
        <td class="p-3">
          <span class="text-xs px-2 py-1 rounded-full ${colorEstado(t.estado)}">${t.estado}</span>
        </td>
        <td class="p-3">
          <button onclick="eliminarTesis('${t._id}')" class="text-red-600 hover:underline text-xs">Eliminar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar tesis:', error);
  }
}

async function handleCrearTesis(e) {
  e.preventDefault();
  const titulo = document.getElementById('tesisTitulo').value;
  const descripcion = document.getElementById('tesisDescripcion').value;
  const lineaInvestigacion = document.getElementById('tesisLinea').value;
  const alertBox = document.getElementById('tesisAlert');

  try {
    await apiFetch('/tesis', {
      method: 'POST',
      body: JSON.stringify({ titulo, descripcion, lineaInvestigacion })
    });
    alertBox.textContent = 'Tesis creada exitosamente';
    alertBox.className = 'p-3 rounded text-sm bg-green-100 text-green-800';
    document.getElementById('formTesis').reset();
    setTimeout(() => {
      document.getElementById('formTesisContainer').classList.add('hidden');
      alertBox.classList.add('hidden');
    }, 1500);
    cargarTesis();
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
  }
}

async function eliminarTesis(id) {
  if (!confirm('Eliminar esta tesis?')) return;
  try {
    await apiFetch(`/tesis/${id}`, { method: 'DELETE' });
    cargarTesis();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// ==================== UTILIDADES ====================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[tag] || tag));
}

function colorEstado(estado) {
  const colores = {
    'propuesta': 'bg-yellow-100 text-yellow-800',
    'en_revision': 'bg-blue-100 text-blue-800',
    'aprobado': 'bg-green-100 text-green-800',
    'rechazado': 'bg-red-100 text-red-800',
    'finalizado': 'bg-purple-100 text-purple-800'
  };
  return colores[estado] || 'bg-slate-100 text-slate-800';
}