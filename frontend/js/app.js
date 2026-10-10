// ===================================================================
// SISTEMA DE GESTION DE TESIS UNI - app.js (CON PANEL ADMIN)
// ===================================================================

// ==================== ESTADO GLOBAL ====================
let currentUser = null;
let docentesCache = [];
let tesisCache = [];
let usuariosCache = [];
let docentesAdminCache = [];
const MAX_INTENTOS = 3;
const BLOQUEO_MINUTOS = 5;

// ==================== INICIALIZACION ====================
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('jwt_token');
  const user = localStorage.getItem('user');

  if (token && user) {
    currentUser = JSON.parse(user);
    mostrarDashboard();
  } else {
    mostrarLogin();
  }

  // ===== Eventos de autenticacion =====
  document.getElementById('formLogin').addEventListener('submit', handleLogin);
  document.getElementById('formRegister').addEventListener('submit', handleRegister);
  document.getElementById('linkRegister').addEventListener('click', (e) => {
    e.preventDefault();
    mostrarRegistro();
  });
  document.getElementById('linkLogin').addEventListener('click', (e) => {
    e.preventDefault();
    mostrarLogin();
  });
  document.getElementById('btnLogout').addEventListener('click', handleLogout);
  document.getElementById('btnAdmin').addEventListener('click', mostrarAdmin);

  // ===== Eventos del dashboard =====
  document.getElementById('btnNuevaTesis').addEventListener('click', () => {
    document.getElementById('formTesisContainer').classList.toggle('hidden');
  });
  document.getElementById('btnCancelarTesis').addEventListener('click', () => {
    document.getElementById('formTesisContainer').classList.add('hidden');
    document.getElementById('formTesis').reset();
    document.getElementById('tesisAlert').classList.add('hidden');
    const textSpan = document.getElementById('tutorDropdownText');
    if (textSpan) {
      textSpan.textContent = '-- Seleccione un docente --';
      textSpan.className = 'text-slate-500';
    }
    const hiddenInput = document.getElementById('tesisTutorPropuesto');
    if (hiddenInput) hiddenInput.value = '';
  });
  document.getElementById('formTesis').addEventListener('submit', handleCrearTesis);

  // ===== Validacion en tiempo real =====
  document.getElementById('regNombre').addEventListener('input', validarNombreRealTime);
  document.getElementById('regEmail').addEventListener('input', validarEmailRealTime);
  document.getElementById('regPassword').addEventListener('input', validarPasswordRealTime);

  // ===== Cambiar linea -> filtrar docentes =====
  const lineaSelect = document.getElementById('tesisLinea');
  if (lineaSelect) {
    lineaSelect.addEventListener('change', (e) => {
      filtrarDocentesPorLinea(e.target.value);
    });
  }

  // ===== Dropdown custom de docentes =====
  const dropdownBtn = document.getElementById('tutorDropdownBtn');
  const dropdownMenu = document.getElementById('tutorDropdownMenu');

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('tutorDropdownWrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });
  }

  // ===== Filtro de estado =====
  const filtroEstado = document.getElementById('filtroEstado');
  if (filtroEstado) {
    filtroEstado.addEventListener('change', () => {
      renderTesisFiltradas();
    });
  }

  // ===== Boton refrescar =====
  const btnRefrescar = document.getElementById('btnRefrescar');
  if (btnRefrescar) {
    btnRefrescar.addEventListener('click', () => {
      cargarTesis();
      if (['docente', 'comision', 'admin'].includes(currentUser?.rol)) {
        cargarEstadisticas();
      }
    });
  }

  // ===== Eventos del panel Admin =====
  const btnVolverTesis = document.getElementById('btnVolverTesis');
  if (btnVolverTesis) btnVolverTesis.addEventListener('click', mostrarDashboard);

  const tabUsuarios = document.getElementById('tabUsuarios');
  if (tabUsuarios) tabUsuarios.addEventListener('click', () => cambiarTabAdmin('usuarios'));

  const tabDocentes = document.getElementById('tabDocentes');
  if (tabDocentes) tabDocentes.addEventListener('click', () => cambiarTabAdmin('docentes'));

  const tabEstadisticas = document.getElementById('tabEstadisticas');
  if (tabEstadisticas) tabEstadisticas.addEventListener('click', () => cambiarTabAdmin('estadisticas'));

  const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
  if (btnNuevoUsuario) btnNuevoUsuario.addEventListener('click', () => abrirModalUsuario());

  const btnNuevoDocente = document.getElementById('btnNuevoDocente');
  if (btnNuevoDocente) btnNuevoDocente.addEventListener('click', () => abrirModalDocente());

  const filtroRolUsuarios = document.getElementById('filtroRolUsuarios');
  if (filtroRolUsuarios) filtroRolUsuarios.addEventListener('change', () => cargarUsuarios());

  const filtroActivoUsuarios = document.getElementById('filtroActivoUsuarios');
  if (filtroActivoUsuarios) filtroActivoUsuarios.addEventListener('change', () => cargarUsuarios());

  const filtroEspecialidadDocentes = document.getElementById('filtroEspecialidadDocentes');
  if (filtroEspecialidadDocentes) filtroEspecialidadDocentes.addEventListener('change', () => cargarDocentesAdmin());
});

// ==================== TRANSICIONES ENTRE SECCIONES ====================
function mostrarSeccion(id) {
  ['loginSection', 'registerSection', 'dashboardSection', 'adminSection'].forEach(sec => {
    const el = document.getElementById(sec);
    if (!el) return;
    if (sec === id) {
      el.classList.remove('hidden-section');
      el.classList.add('animate-fadeIn');
    } else {
      el.classList.add('hidden-section');
      el.classList.remove('animate-fadeIn');
    }
  });
}

function mostrarLogin() {
  mostrarSeccion('loginSection');
  const userInfo = document.getElementById('userInfo');
  userInfo.classList.add('hidden');
  userInfo.classList.remove('flex');

  const statsPanel = document.getElementById('statsPanel');
  const filtrosPanel = document.getElementById('filtrosPanel');
  if (statsPanel) statsPanel.classList.add('hidden-section');
  if (filtrosPanel) filtrosPanel.classList.add('hidden-section');
}

function mostrarRegistro() {
  mostrarSeccion('registerSection');
}

function mostrarDashboard() {
  mostrarSeccion('dashboardSection');
  document.getElementById('userInfo').classList.remove('hidden');
  document.getElementById('userInfo').classList.add('flex');
  document.getElementById('userName').textContent = `${currentUser.nombre} (${currentUser.rol})`;

  // ===== Boton Admin (solo visible para admin) =====
  const btnAdmin = document.getElementById('btnAdmin');
  if (currentUser.rol === 'admin') {
    btnAdmin.classList.remove('hidden');
  } else {
    btnAdmin.classList.add('hidden');
  }

  // ===== Titulo y subtitulo segun rol =====
  const titulo = document.getElementById('dashboardTitle');
  const subtitulo = document.getElementById('dashboardSubtitle');

  const config = {
    'estudiante': {
      titulo: 'Mis Tesis',
      subtitulo: 'Gestiona tus propuestas de tesis y monografias'
    },
    'docente': {
      titulo: 'Tesis Asignadas',
      subtitulo: 'Revisa, aprueba, rechaza y comenta las tesis que te han asignado'
    },
    'comision': {
      titulo: 'Panel de Comision',
      subtitulo: 'Administra todas las tesis y asigna tutores oficiales'
    },
    'admin': {
      titulo: 'Panel de Administracion',
      subtitulo: 'Control total del sistema'
    }
  };

  const cfg = config[currentUser.rol] || config.estudiante;
  titulo.textContent = cfg.titulo;
  subtitulo.textContent = cfg.subtitulo;

  // ===== Boton "Nueva Tesis" (solo estudiante/admin) =====
  const btnNueva = document.getElementById('btnNuevaTesis');
  if (currentUser.rol === 'estudiante' || currentUser.rol === 'admin') {
    btnNueva.style.display = 'flex';
  } else {
    btnNueva.style.display = 'none';
  }

  // ===== Stats y filtros =====
  const statsPanel = document.getElementById('statsPanel');
  const filtrosPanel = document.getElementById('filtrosPanel');
  const statSinTutorCard = document.getElementById('statSinTutorCard');

  if (['docente', 'comision', 'admin'].includes(currentUser.rol)) {
    statsPanel.classList.remove('hidden-section');
    filtrosPanel.classList.remove('hidden-section');

    if (currentUser.rol === 'docente') {
      statSinTutorCard.style.display = 'none';
    } else {
      statSinTutorCard.style.display = 'block';
    }

    cargarEstadisticas();
  } else {
    statsPanel.classList.add('hidden-section');
    filtrosPanel.classList.add('hidden-section');
  }

  if (currentUser.rol === 'estudiante') {
    cargarDocentes();
  }

  cargarTesis();
}

// ==================== BLOQUEO POR INTENTOS ====================
function getIntentos() {
  const data = localStorage.getItem('login_attempts');
  return data ? JSON.parse(data) : { count: 0, blockedUntil: null };
}
function setIntentos(data) {
  localStorage.setItem('login_attempts', JSON.stringify(data));
}
function verificarBloqueo() {
  const intentos = getIntentos();
  if (intentos.blockedUntil && Date.now() < intentos.blockedUntil) {
    return Math.ceil((intentos.blockedUntil - Date.now()) / 1000);
  }
  if (intentos.blockedUntil && Date.now() >= intentos.blockedUntil) {
    setIntentos({ count: 0, blockedUntil: null });
  }
  return 0;
}
function iniciarBloqueo() {
  const bloqueoHasta = Date.now() + BLOQUEO_MINUTOS * 60 * 1000;
  setIntentos({ count: MAX_INTENTOS, blockedUntil: bloqueoHasta });
  return Math.ceil((bloqueoHasta - Date.now()) / 1000);
}

// ==================== LOGIN ====================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const alertBox = document.getElementById('loginAlert');
  const btn = document.getElementById('btnLoginSubmit');
  const spinner = document.getElementById('loginSpinner');
  const btnText = document.getElementById('loginBtnText');

  const restante = verificarBloqueo();
  if (restante > 0) {
    alertBox.textContent = `Cuenta bloqueada. Intenta de nuevo en ${restante} segundos.`;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Ingresando...';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setIntentos({ count: 0, blockedUntil: null });
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    currentUser = data.user;

    showToast(`Bienvenido, ${data.user.nombre}!`, 'success');
    mostrarDashboard();
  } catch (error) {
    const intentos = getIntentos();
    intentos.count = (intentos.count || 0) + 1;

    if (intentos.count >= MAX_INTENTOS) {
      const segundos = iniciarBloqueo();
      alertBox.textContent = `Demasiados intentos fallidos. Cuenta bloqueada por ${Math.ceil(segundos / 60)} minuto(s).`;
      showToast('Cuenta bloqueada temporalmente', 'error');
    } else {
      const restantes = MAX_INTENTOS - intentos.count;
      alertBox.textContent = `${error.message}. Te quedan ${restantes} intento(s).`;
      showToast(error.message, 'error');
    }

    setIntentos(intentos);
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'Ingresar';
  }
}

// ==================== REGISTRO ====================
async function handleRegister(e) {
  e.preventDefault();
  const nombre = document.getElementById('regNombre').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const carnet = document.getElementById('regCarnet').value.trim();
  const rol = document.getElementById('regRol').value;
  const alertBox = document.getElementById('registerAlert');

  if (!validarNombreRealTime() || !validarEmailRealTime() || !validarPasswordRealTime()) {
    alertBox.textContent = 'Corrige los errores del formulario.';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    return;
  }

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password, carnet, rol })
    });

    showToast('Usuario creado exitosamente!', 'success');
    alertBox.textContent = 'Usuario creado. Redirigiendo...';
    alertBox.className = 'p-3 rounded text-sm bg-green-100 text-green-800 animate-fadeIn';
    alertBox.classList.remove('hidden');

    setTimeout(() => {
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      mostrarDashboard();
    }, 1200);
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    showToast(error.message, 'error');
  }
}

// ==================== VALIDACIONES ====================
function validarNombreRealTime() {
  const val = document.getElementById('regNombre').value.trim();
  const err = document.getElementById('errRegNombre');
  if (val.length < 3) {
    err.textContent = 'El nombre debe tener al menos 3 caracteres.';
    err.classList.remove('hidden');
    return false;
  }
  err.classList.add('hidden');
  return true;
}

function validarEmailRealTime() {
  const val = document.getElementById('regEmail').value.trim();
  const err = document.getElementById('errRegEmail');
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(val)) {
    err.textContent = 'Ingresa un correo valido.';
    err.classList.remove('hidden');
    return false;
  }
  err.classList.add('hidden');
  return true;
}

function validarPasswordRealTime() {
  const val = document.getElementById('regPassword').value;
  const err = document.getElementById('errRegPassword');
  if (val.length < 8) {
    err.textContent = 'Minimo 8 caracteres.';
    err.classList.remove('hidden');
    return false;
  }
  if (!/[A-Z]/.test(val)) {
    err.textContent = 'Debe contener al menos una mayuscula.';
    err.classList.remove('hidden');
    return false;
  }
  if (!/\d/.test(val)) {
    err.textContent = 'Debe contener al menos un numero.';
    err.classList.remove('hidden');
    return false;
  }
  err.classList.add('hidden');
  return true;
}

// ==================== LOGOUT ====================
function handleLogout() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  currentUser = null;
  docentesCache = [];
  tesisCache = [];
  usuariosCache = [];
  docentesAdminCache = [];
  showToast('Sesion cerrada correctamente', 'info');
  mostrarLogin();
}

// ==================== CARGAR DOCENTES ====================
async function cargarDocentes() {
  try {
    const docentes = await apiFetch('/docentes');
    docentesCache = docentes;
    llenarDropdownDocentes(docentesCache);
  } catch (error) {
    console.error('Error al cargar docentes:', error);
    showToast('No se pudieron cargar los docentes', 'error');
  }
}

function llenarDropdownDocentes(docentes) {
  const menu = document.getElementById('tutorDropdownMenu');
  if (!menu) return;

  menu.innerHTML = '';

  const sinTutor = document.createElement('div');
  sinTutor.className = 'dropdown-item text-slate-500 italic';
  sinTutor.dataset.value = '';
  sinTutor.textContent = '-- Sin tutor propuesto --';
  sinTutor.onclick = () => seleccionarDocente('', '-- Seleccione un docente --');
  menu.appendChild(sinTutor);

  docentes.forEach(d => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.dataset.value = d._id;
    item.textContent = `${d.titulo || ''} ${d.nombre} (${d.especialidad})`;
    item.onclick = () => seleccionarDocente(d._id, `${d.titulo || ''} ${d.nombre} (${d.especialidad})`);
    menu.appendChild(item);
  });
}

function seleccionarDocente(id, texto) {
  const input = document.getElementById('tesisTutorPropuesto');
  const textSpan = document.getElementById('tutorDropdownText');
  const menu = document.getElementById('tutorDropdownMenu');
  if (!input || !textSpan || !menu) return;

  input.value = id;
  textSpan.textContent = texto;
  textSpan.className = id ? 'text-slate-800' : 'text-slate-500';

  menu.querySelectorAll('.dropdown-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.value === id);
  });
  menu.classList.add('hidden');
}

function filtrarDocentesPorLinea(linea) {
  if (!linea) {
    llenarDropdownDocentes(docentesCache);
    return;
  }
  const filtrados = docentesCache.filter(d =>
    d.especialidad === linea || d.especialidad === 'General'
  );
  llenarDropdownDocentes(filtrados);

  const inputActual = document.getElementById('tesisTutorPropuesto');
  if (inputActual && inputActual.value) {
    const sigueDisponible = filtrados.some(d => d._id === inputActual.value);
    if (!sigueDisponible) {
      seleccionarDocente('', '-- Seleccione un docente --');
    }
  }
}

// ==================== CARGAR ESTADISTICAS ====================
async function cargarEstadisticas() {
  try {
    const stats = await apiFetch('/tesis/estadisticas');
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statPropuesta').textContent = stats.propuesta;
    document.getElementById('statEnRevision').textContent = stats.enRevision;
    document.getElementById('statAprobado').textContent = stats.aprobado;
    document.getElementById('statRechazado').textContent = stats.rechazado;
    document.getElementById('statSinTutor').textContent = stats.sinTutor || 0;
  } catch (error) {
    console.error('Error al cargar estadisticas:', error);
  }
}

// ==================== CARGAR TESIS ====================
async function cargarTesis() {
  const tabla = document.getElementById('tablaTesis');
  const empty = document.getElementById('emptyTesis');

  tabla.innerHTML = `
    <tr><td colspan="7" class="p-8 text-center">
      <div class="inline-block animate-spin h-6 w-6 border-2 border-uniPrimary border-t-transparent rounded-full"></div>
      <p class="text-slate-400 text-sm mt-2">Cargando tesis...</p>
    </td></tr>
  `;

  try {
    const tesis = await apiFetch('/tesis');
    tesisCache = tesis;
    renderTesisFiltradas();
  } catch (error) {
    tabla.innerHTML = `
      <tr><td colspan="7" class="p-8 text-center text-red-500 text-sm">
        Error al cargar tesis: ${escapeHTML(error.message)}
      </td></tr>
    `;
    showToast('Error al cargar las tesis', 'error');
  }
}

// ==================== RENDERIZAR TESIS ====================
function renderTesisFiltradas() {
  const tabla = document.getElementById('tablaTesis');
  const empty = document.getElementById('emptyTesis');
  const filtro = document.getElementById('filtroEstado')?.value || '';

  let tesisFiltradas = tesisCache;
  if (filtro) {
    tesisFiltradas = tesisCache.filter(t => t.estado === filtro);
  }

  tabla.innerHTML = '';

  if (!tesisFiltradas || tesisFiltradas.length === 0) {
    empty.classList.remove('hidden');
    if (currentUser.rol === 'docente') {
      empty.textContent = filtro
        ? `No tienes tesis con estado "${filtro.replace('_', ' ')}"`
        : 'No tienes tesis asignadas aun';
    } else {
      empty.textContent = filtro
        ? `No hay tesis con estado "${filtro.replace('_', ' ')}"`
        : 'No hay tesis registradas';
    }
    return;
  }
  empty.classList.add('hidden');

  tesisFiltradas.forEach(t => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors duration-150';

    const puedeEliminar = ['propuesta', 'rechazado'].includes(t.estado) &&
                          (currentUser.rol === 'admin' || currentUser.rol === 'comision' ||
                           (t.estudiante && t.estudiante._id === currentUser.id));

    let tutorHTML = '<span class="text-slate-400 italic text-xs">Sin asignar</span>';

    if (t.tutorAsignado && t.tutorAsignado.nombre) {
      tutorHTML = `
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-emerald-700">${escapeHTML(t.tutorAsignado.titulo || '')} ${escapeHTML(t.tutorAsignado.nombre)}</span>
          <span class="text-[10px] text-emerald-600 font-bold uppercase">Oficial</span>
        </div>
      `;
    } else if (t.docentePropuesto && t.docentePropuesto.nombre) {
      tutorHTML = `
        <div class="flex flex-col">
          <span class="text-sm text-slate-700">${escapeHTML(t.docentePropuesto.titulo || '')} ${escapeHTML(t.docentePropuesto.nombre)}</span>
          <span class="text-[10px] text-amber-600 font-bold uppercase">Propuesto</span>
        </div>
      `;
    }

    let acciones = '<div class="flex flex-wrap gap-1">';

    if (t.archivoUrl) {
      acciones += `<a href="${API_URL.replace('/api', '')}${t.archivoUrl}" target="_blank"
        class="text-blue-600 hover:underline text-xs inline-flex items-center gap-1" title="Ver PDF">
        <svg class="icon" viewBox="0 0 24 24" width="12" height="12">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        PDF
      </a>`;
    }

    if (['docente', 'comision', 'admin'].includes(currentUser.rol)) {
      acciones += `<button onclick="abrirModalGestion('${t._id}')"
        class="text-uniPrimary hover:underline text-xs inline-flex items-center gap-1" title="Gestionar">
        <svg class="icon" viewBox="0 0 24 24" width="12" height="12">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        Gestionar
      </button>`;
    }

    if (['comision', 'admin'].includes(currentUser.rol) && !t.tutorAsignado) {
      acciones += `<button onclick="abrirModalAsignar('${t._id}')"
        class="text-amber-600 hover:underline text-xs inline-flex items-center gap-1" title="Asignar tutor">
        <svg class="icon" viewBox="0 0 24 24" width="12" height="12">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        Asignar
      </button>`;
    }

    if (puedeEliminar) {
      acciones += `<button onclick="eliminarTesis('${t._id}')"
        class="text-red-600 hover:underline text-xs inline-flex items-center gap-1" title="Eliminar">
        <svg class="icon" viewBox="0 0 24 24" width="12" height="12">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Eliminar
      </button>`;
    }

    acciones += '</div>';

    tr.innerHTML = `
      <td class="p-3 text-sm font-semibold">${escapeHTML(t.titulo)}</td>
      <td class="p-3 text-sm">${t.estudiante ? escapeHTML(t.estudiante.nombre) : 'N/A'}</td>
      <td class="p-3 text-sm">${escapeHTML(t.lineaInvestigacion || 'N/A')}</td>
      <td class="p-3 text-sm capitalize">${escapeHTML(t.modalidad || 'monografia')}</td>
      <td class="p-3">
        <span class="text-xs px-2 py-1 rounded-full ${colorEstado(t.estado)}">
          ${(t.estado || '').replace('_', ' ')}
        </span>
      </td>
      <td class="p-3">${tutorHTML}</td>
      <td class="p-3">${acciones}</td>
    `;
    tabla.appendChild(tr);
  });
}

// ==================== MODAL GESTION TESIS ====================
async function abrirModalGestion(id) {
  const modal = document.getElementById('modalGestion');
  const content = document.getElementById('modalContent');
  modal.classList.remove('hidden');
  content.innerHTML = '<div class="text-center py-8"><div class="inline-block animate-spin h-8 w-8 border-2 border-uniPrimary border-t-transparent rounded-full"></div></div>';

  try {
    const t = await apiFetch(`/tesis/${id}`);
    const puedeAsignar = ['comision', 'admin'].includes(currentUser.rol) && !t.tutorAsignado;

    content.innerHTML = `
      <div class="space-y-3">
        <div>
          <label class="text-xs font-bold text-slate-500 uppercase">Titulo</label>
          <p class="font-semibold">${escapeHTML(t.titulo)}</p>
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500 uppercase">Estudiante</label>
          <p>${escapeHTML(t.estudiante.nombre)} (${escapeHTML(t.estudiante.carnet || 'N/A')})</p>
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500 uppercase">Descripcion</label>
          <p class="text-sm text-slate-700">${escapeHTML(t.descripcion)}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase">Linea</label>
            <p>${escapeHTML(t.lineaInvestigacion)}</p>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase">Modalidad</label>
            <p class="capitalize">${escapeHTML(t.modalidad)}</p>
          </div>
        </div>
        <div>
          <label class="text-xs font-bold text-slate-500 uppercase">Estado actual</label>
          <p><span class="text-xs px-2 py-1 rounded-full ${colorEstado(t.estado)}">${t.estado.replace('_', ' ')}</span></p>
        </div>
        ${t.tutorAsignado ? `
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase">Tutor Oficial</label>
            <p class="text-emerald-700 font-semibold">${escapeHTML(t.tutorAsignado.titulo || '')} ${escapeHTML(t.tutorAsignado.nombre)}</p>
          </div>
        ` : t.docentePropuesto ? `
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase">Tutor Propuesto</label>
            <p class="text-amber-700">${escapeHTML(t.docentePropuesto.titulo || '')} ${escapeHTML(t.docentePropuesto.nombre)}</p>
          </div>
        ` : ''}
        <div class="flex flex-wrap gap-2">
          ${t.archivoUrl ? `<a href="${API_URL.replace('/api', '')}${t.archivoUrl}" target="_blank" class="inline-block bg-sky-100 text-sky-800 px-3 py-1 rounded text-sm hover:bg-sky-200">Ver anteproyecto PDF</a>` : ''}
          ${puedeAsignar ? `<button onclick="cerrarModal(); abrirModalAsignar('${t._id}')" class="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded text-sm hover:bg-amber-200">Asignar Tutor Oficial</button>` : ''}
        </div>
      </div>

      <hr class="my-4">

      <div>
        <label class="block text-sm font-bold mb-2">Cambiar Estado</label>
        <select id="modalNuevoEstado" class="w-full px-3 py-2 border rounded-lg mb-2">
          <option value="en_revision" ${t.estado === 'en_revision' ? 'selected' : ''}>En Revision</option>
          <option value="aprobado" ${t.estado === 'aprobado' ? 'selected' : ''}>Aprobado</option>
          <option value="rechazado" ${t.estado === 'rechazado' ? 'selected' : ''}>Rechazado</option>
          <option value="finalizado" ${t.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
        </select>
        <textarea id="modalMotivo" placeholder="Motivo del cambio (opcional)" rows="2"
          class="w-full px-3 py-2 border rounded-lg mb-2"></textarea>
        <button onclick="cambiarEstadoTesis('${t._id}')"
          class="w-full bg-uniPrimary hover:bg-blue-900 text-white py-2 rounded-lg font-semibold">
          Actualizar Estado
        </button>
      </div>

      <hr class="my-4">

      <div>
        <label class="block text-sm font-bold mb-2">Agregar Observacion</label>
        <select id="modalTipoObs" class="w-full px-3 py-2 border rounded-lg mb-2">
          <option value="comentario">Comentario</option>
          <option value="correccion">Correccion</option>
          <option value="aprobacion">Aprobacion</option>
          <option value="rechazo">Rechazo</option>
        </select>
        <textarea id="modalTextoObs" placeholder="Escribe tus observaciones..." rows="3"
          class="w-full px-3 py-2 border rounded-lg mb-2"></textarea>
        <button onclick="agregarObservacion('${t._id}')"
          class="w-full bg-uniSecondary hover:bg-sky-700 text-white py-2 rounded-lg font-semibold">
          Enviar Observacion
        </button>
      </div>

      ${t.observaciones && t.observaciones.length > 0 ? `
        <hr class="my-4">
        <div>
          <label class="text-sm font-bold mb-2">Historial de Observaciones (${t.observaciones.length})</label>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            ${t.observaciones.map(o => `
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 ${o.tipo === 'rechazo' ? 'border-red-500' : o.tipo === 'aprobacion' ? 'border-green-500' : o.tipo === 'correccion' ? 'border-amber-500' : 'border-sky-500'}">
                <div class="flex justify-between text-xs text-slate-500 mb-1">
                  <span class="font-semibold">${o.autor ? escapeHTML(o.autor.nombre) : 'Anonimo'} (${o.autor ? o.autor.rol : '?'})</span>
                  <span>${new Date(o.fecha).toLocaleString('es-NI')}</span>
                </div>
                <p class="text-sm">${escapeHTML(o.texto)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${t.historialEstados && t.historialEstados.length > 0 ? `
        <hr class="my-4">
        <div>
          <label class="text-sm font-bold mb-2">Historial de Estados</label>
          <div class="space-y-1 max-h-40 overflow-y-auto text-xs">
            ${t.historialEstados.slice().reverse().map(h => `
              <div class="bg-slate-50 p-2 rounded flex justify-between">
                <span>
                  <span class="font-semibold">${h.estadoAnterior || 'inicio'}</span>
                  <span class="text-slate-400"> → </span>
                  <span class="font-semibold text-uniPrimary">${h.estadoNuevo}</span>
                </span>
                <span class="text-slate-500">${new Date(h.fecha).toLocaleDateString('es-NI')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  } catch (error) {
    content.innerHTML = `<p class="text-red-500">Error: ${escapeHTML(error.message)}</p>`;
  }
}

function cerrarModal() {
  document.getElementById('modalGestion').classList.add('hidden');
}

// ==================== MODAL ASIGNAR TUTOR ====================
async function abrirModalAsignar(id) {
  const modal = document.getElementById('modalGestion');
  const content = document.getElementById('modalContent');
  modal.classList.remove('hidden');

  try {
    const docentes = await apiFetch('/docentes');
    content.innerHTML = `
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-uniPrimary">Asignar Tutor Oficial</h3>
        <p class="text-sm text-slate-600">Selecciona el docente que dirigira esta tesis. Al asignarlo, el estado cambiara a "En Revision".</p>
        <select id="selectTutorAsignar" class="w-full px-3 py-2 border rounded-lg">
          <option value="">-- Seleccione un docente --</option>
          ${docentes.map(d => `<option value="${d._id}">${d.titulo || ''} ${escapeHTML(d.nombre)} (${d.especialidad})</option>`).join('')}
        </select>
        <div class="flex gap-2">
          <button onclick="confirmarAsignarTutor('${id}')"
            class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold">
            Asignar Tutor
          </button>
          <button onclick="cerrarModal()"
            class="flex-1 bg-slate-300 hover:bg-slate-400 py-2 rounded-lg font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<p class="text-red-500">Error: ${escapeHTML(error.message)}</p>`;
  }
}

async function confirmarAsignarTutor(id) {
  const docenteId = document.getElementById('selectTutorAsignar').value;
  if (!docenteId) {
    showToast('Debes seleccionar un docente', 'warning');
    return;
  }
  try {
    await apiFetch(`/tesis/${id}/asignar-tutor`, {
      method: 'PUT',
      body: JSON.stringify({ docenteId })
    });
    showToast('Tutor asignado exitosamente', 'success');
    cerrarModal();
    cargarTesis();
    if (['docente', 'comision', 'admin'].includes(currentUser.rol)) {
      cargarEstadisticas();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==================== CAMBIAR ESTADO ====================
async function cambiarEstadoTesis(id) {
  const nuevoEstado = document.getElementById('modalNuevoEstado').value;
  const motivo = document.getElementById('modalMotivo').value.trim();

  try {
    await apiFetch(`/tesis/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ nuevoEstado, motivo })
    });
    showToast('Estado actualizado', 'success');
    cerrarModal();
    cargarTesis();
    if (['docente', 'comision', 'admin'].includes(currentUser.rol)) {
      cargarEstadisticas();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==================== AGREGAR OBSERVACION ====================
async function agregarObservacion(id) {
  const texto = document.getElementById('modalTextoObs').value.trim();
  const tipo = document.getElementById('modalTipoObs').value;

  if (!texto) {
    showToast('Escribe una observacion', 'warning');
    return;
  }

  try {
    await apiFetch(`/tesis/${id}/observacion`, {
      method: 'POST',
      body: JSON.stringify({ texto, tipo })
    });
    showToast('Observacion enviada', 'success');
    cerrarModal();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==================== CREAR TESIS ====================
async function handleCrearTesis(e) {
  e.preventDefault();

  const titulo = document.getElementById('tesisTitulo').value.trim();
  const descripcion = document.getElementById('tesisDescripcion').value.trim();
  const lineaInvestigacion = document.getElementById('tesisLinea').value;
  const modalidad = document.getElementById('tesisModalidad').value;
  const docentePropuesto = document.getElementById('tesisTutorPropuesto').value;
  const archivoInput = document.getElementById('tesisArchivo');
  const archivo = archivoInput.files[0];

  const alertBox = document.getElementById('tesisAlert');
  const btn = e.target.querySelector('button[type="submit"]');
  const spinner = document.getElementById('tesisSpinner');
  const btnText = document.getElementById('tesisBtnText');

  if (!titulo || !descripcion || !lineaInvestigacion || !modalidad) {
    alertBox.textContent = 'Todos los campos obligatorios deben estar completos.';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    showToast('Completa los campos obligatorios', 'warning');
    return;
  }

  if (!archivo) {
    alertBox.textContent = 'Debes subir el anteproyecto en PDF.';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    showToast('Falta el archivo PDF', 'warning');
    return;
  }

  if (archivo.type !== 'application/pdf') {
    alertBox.textContent = 'Solo se permiten archivos PDF.';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    showToast('Solo se permiten PDFs', 'error');
    return;
  }

  if (archivo.size > 10 * 1024 * 1024) {
    alertBox.textContent = 'El archivo supera los 10 MB.';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    showToast('Archivo demasiado grande', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('descripcion', descripcion);
  formData.append('lineaInvestigacion', lineaInvestigacion);
  formData.append('modalidad', modalidad);
  formData.append('docentePropuesto', docentePropuesto || '');
  formData.append('archivo', archivo);

  btn.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Enviando...';

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_URL}/tesis`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || data.error || 'Error al crear la tesis');
    }

    showToast('Propuesta enviada exitosamente!', 'success');
    alertBox.textContent = 'Propuesta registrada.';
    alertBox.className = 'p-3 rounded text-sm bg-green-100 text-green-800 animate-fadeIn';
    alertBox.classList.remove('hidden');

    document.getElementById('formTesis').reset();

    const textSpan = document.getElementById('tutorDropdownText');
    if (textSpan) {
      textSpan.textContent = '-- Seleccione un docente --';
      textSpan.className = 'text-slate-500';
    }
    const hiddenInput = document.getElementById('tesisTutorPropuesto');
    if (hiddenInput) hiddenInput.value = '';

    document.querySelectorAll('#tutorDropdownMenu .dropdown-item').forEach(el => {
      el.classList.remove('selected');
    });

    setTimeout(() => {
      document.getElementById('formTesisContainer').classList.add('hidden');
      alertBox.classList.add('hidden');
    }, 2000);

    cargarTesis();
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800 animate-fadeIn';
    alertBox.classList.remove('hidden');
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'Enviar Propuesta';
  }
}

// ==================== ELIMINAR TESIS ====================
async function eliminarTesis(id) {
  if (!confirm('Estas seguro de eliminar esta tesis? Esta accion no se puede deshacer.')) return;

  try {
    await apiFetch(`/tesis/${id}`, { method: 'DELETE' });
    showToast('Tesis eliminada correctamente', 'success');
    cargarTesis();
    if (['docente', 'comision', 'admin'].includes(currentUser.rol)) {
      cargarEstadisticas();
    }
  } catch (error) {
    showToast('Error al eliminar: ' + error.message, 'error');
  }
}

// ===================================================================
// ==================== PANEL DE ADMINISTRACION ======================
// ===================================================================

// ==================== MOSTRAR ADMIN ====================
function mostrarAdmin() {
  if (currentUser.rol !== 'admin') {
    showToast('No tienes permisos de administrador', 'error');
    return;
  }

  mostrarSeccion('adminSection');

  // Cargar datos iniciales
  cargarUsuarios();
  cargarDocentesAdmin();
  cargarEstadisticasAdmin();

  // Activar tab por defecto
  cambiarTabAdmin('usuarios');
}

// ==================== CAMBIAR TAB ADMIN ====================
function cambiarTabAdmin(tab) {
  const tabs = ['usuarios', 'docentes', 'estadisticas'];

  // Actualizar estilos de los botones
  tabs.forEach(t => {
    const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const content = document.getElementById(`contenido${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (t === tab) {
      btn.classList.add('tab-btn-active');
      btn.classList.remove('tab-btn');
      content.classList.remove('hidden');
    } else {
      btn.classList.remove('tab-btn-active');
      btn.classList.add('tab-btn');
      content.classList.add('hidden');
    }
  });

  // Recargar datos segun tab
  if (tab === 'usuarios') cargarUsuarios();
  if (tab === 'docentes') cargarDocentesAdmin();
  if (tab === 'estadisticas') cargarEstadisticasAdmin();
}

// ==================== CARGAR USUARIOS ====================
async function cargarUsuarios() {
  const tabla = document.getElementById('tablaUsuarios');
  const empty = document.getElementById('emptyUsuarios');

  tabla.innerHTML = `
    <tr><td colspan="6" class="p-8 text-center">
      <div class="inline-block animate-spin h-6 w-6 border-2 border-uniPrimary border-t-transparent rounded-full"></div>
    </td></tr>
  `;

  try {
    const filtroRol = document.getElementById('filtroRolUsuarios')?.value || '';
    const filtroActivo = document.getElementById('filtroActivoUsuarios')?.value || '';

    let url = '/admin/usuarios?';
    if (filtroRol) url += `rol=${filtroRol}&`;
    if (filtroActivo) url += `activo=${filtroActivo}`;

    const usuarios = await apiFetch(url);
    usuariosCache = usuarios;
    tabla.innerHTML = '';

    if (!usuarios || usuarios.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';

      const colorRol = {
        'estudiante': 'bg-blue-100 text-blue-800',
        'docente': 'bg-purple-100 text-purple-800',
        'comision': 'bg-amber-100 text-amber-800',
        'admin': 'bg-rose-100 text-rose-800'
      };

      tr.innerHTML = `
        <td class="p-3 text-sm font-semibold">${escapeHTML(u.nombre)}</td>
        <td class="p-3 text-sm">${escapeHTML(u.email)}</td>
        <td class="p-3 text-sm">${escapeHTML(u.carnet || '-')}</td>
        <td class="p-3">
          <span class="text-xs px-2 py-1 rounded-full ${colorRol[u.rol] || 'bg-slate-100'}">${u.rol}</span>
        </td>
        <td class="p-3">
          ${u.activo
            ? '<span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Activo</span>'
            : '<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">Inactivo</span>'}
        </td>
        <td class="p-3">
          <div class="flex gap-1 flex-wrap">
            <button onclick="abrirModalUsuario('${u._id}')" class="text-uniPrimary hover:underline text-xs" title="Editar">Editar</button>
            <button onclick="abrirModalReset('${u._id}', '${escapeHTML(u.nombre)}')" class="text-amber-600 hover:underline text-xs" title="Reset password">Password</button>
            ${u.activo
              ? `<button onclick="desactivarUsuario('${u._id}')" class="text-slate-600 hover:underline text-xs">Desactivar</button>`
              : `<button onclick="activarUsuario('${u._id}')" class="text-emerald-600 hover:underline text-xs">Activar</button>`}
            <button onclick="eliminarUsuario('${u._id}')" class="text-red-600 hover:underline text-xs">Eliminar</button>
          </div>
        </td>
      `;
      tabla.appendChild(tr);
    });
  } catch (error) {
    tabla.innerHTML = `
      <tr><td colspan="6" class="p-8 text-center text-red-500 text-sm">
        Error: ${escapeHTML(error.message)}
      </td></tr>
    `;
  }
}

// ==================== CARGAR DOCENTES ADMIN ====================
async function cargarDocentesAdmin() {
  const tabla = document.getElementById('tablaDocentes');
  const empty = document.getElementById('emptyDocentes');

  tabla.innerHTML = `
    <tr><td colspan="6" class="p-8 text-center">
      <div class="inline-block animate-spin h-6 w-6 border-2 border-uniPrimary border-t-transparent rounded-full"></div>
    </td></tr>
  `;

  try {
    const especialidad = document.getElementById('filtroEspecialidadDocentes')?.value || '';
    let url = '/docentes?';
    if (especialidad) url += `especialidad=${especialidad}`;

    const docentes = await apiFetch(url);
    docentesAdminCache = docentes;
    tabla.innerHTML = '';

    if (!docentes || docentes.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    docentes.forEach(d => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';

      tr.innerHTML = `
        <td class="p-3 text-sm">${escapeHTML(d.titulo || '')}</td>
        <td class="p-3 text-sm font-semibold">${escapeHTML(d.nombre)}</td>
        <td class="p-3 text-sm">${escapeHTML(d.email)}</td>
        <td class="p-3">
          <span class="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-800">${escapeHTML(d.especialidad)}</span>
        </td>
        <td class="p-3">
          ${d.activo
            ? '<span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Activo</span>'
            : '<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">Inactivo</span>'}
        </td>
        <td class="p-3">
          <div class="flex gap-1">
            <button onclick="abrirModalDocente('${d._id}')" class="text-uniPrimary hover:underline text-xs">Editar</button>
            <button onclick="eliminarDocenteAdmin('${d._id}')" class="text-red-600 hover:underline text-xs">Desactivar</button>
          </div>
        </td>
      `;
      tabla.appendChild(tr);
    });
  } catch (error) {
    tabla.innerHTML = `
      <tr><td colspan="6" class="p-8 text-center text-red-500 text-sm">
        Error: ${escapeHTML(error.message)}
      </td></tr>
    `;
  }
}

// ==================== CARGAR ESTADISTICAS ADMIN ====================
async function cargarEstadisticasAdmin() {
  try {
    const stats = await apiFetch('/admin/estadisticas');

    document.getElementById('adminStatUsuarios').textContent = stats.usuarios.total;
    document.getElementById('adminStatEstudiantes').textContent = stats.usuarios.estudiantes;
    document.getElementById('adminStatDocentes').textContent = stats.usuarios.docentes;
    document.getElementById('adminStatComision').textContent = stats.usuarios.comision;
    document.getElementById('adminStatAdmin').textContent = stats.usuarios.admin;

    document.getElementById('adminStatTesisTotal').textContent = stats.tesis.total;
    document.getElementById('adminStatTesisPropuesta').textContent = stats.tesis.propuesta;
    document.getElementById('adminStatTesisRevision').textContent = stats.tesis.enRevision;
    document.getElementById('adminStatTesisAprobada').textContent = stats.tesis.aprobada;
    document.getElementById('adminStatTesisRechazada').textContent = stats.tesis.rechazada;
    document.getElementById('adminStatTesisFinalizada').textContent = stats.tesis.finalizada;

    document.getElementById('adminStatDocentesCatalogo').textContent = stats.docentesCatalogo;
  } catch (error) {
    console.error('Error al cargar estadisticas admin:', error);
    showToast('Error al cargar estadisticas', 'error');
  }
}

// ==================== MODAL USUARIO ====================
async function abrirModalUsuario(id = null) {
  const modal = document.getElementById('modalUsuario');
  const titulo = document.getElementById('modalUsuarioTitulo');
  const passwordField = document.getElementById('passwordField');
  const alertBox = document.getElementById('usuarioAlert');

  modal.classList.remove('hidden');
  alertBox.classList.add('hidden');
  document.getElementById('usuarioId').value = '';
  document.getElementById('usuarioNombre').value = '';
  document.getElementById('usuarioEmail').value = '';
  document.getElementById('usuarioPassword').value = '';
  document.getElementById('usuarioCarnet').value = '';
  document.getElementById('usuarioRol').value = 'estudiante';

  if (id) {
    titulo.textContent = 'Editar Usuario';
    passwordField.classList.add('hidden');

    try {
      const u = await apiFetch(`/admin/usuarios/${id}`);
      document.getElementById('usuarioId').value = u._id;
      document.getElementById('usuarioNombre').value = u.nombre;
      document.getElementById('usuarioEmail').value = u.email;
      document.getElementById('usuarioCarnet').value = u.carnet || '';
      document.getElementById('usuarioRol').value = u.rol;
    } catch (error) {
      showToast('Error al cargar usuario: ' + error.message, 'error');
      cerrarModalUsuario();
    }
  } else {
    titulo.textContent = 'Nuevo Usuario';
    passwordField.classList.remove('hidden');
  }
}

function cerrarModalUsuario() {
  document.getElementById('modalUsuario').classList.add('hidden');
}

async function guardarUsuario() {
  const id = document.getElementById('usuarioId').value;
  const nombre = document.getElementById('usuarioNombre').value.trim();
  const email = document.getElementById('usuarioEmail').value.trim();
  const password = document.getElementById('usuarioPassword').value;
  const carnet = document.getElementById('usuarioCarnet').value.trim();
  const rol = document.getElementById('usuarioRol').value;
  const alertBox = document.getElementById('usuarioAlert');

  if (!nombre || !email || !rol) {
    alertBox.textContent = 'Nombre, email y rol son obligatorios';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
    alertBox.classList.remove('hidden');
    return;
  }

  if (!id && !password) {
    alertBox.textContent = 'La contrasena es obligatoria para nuevos usuarios';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
    alertBox.classList.remove('hidden');
    return;
  }

  try {
    const body = { nombre, email, rol, carnet };

    if (id) {
      await apiFetch(`/admin/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      showToast('Usuario actualizado', 'success');
    } else {
      body.password = password;
      await apiFetch('/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showToast('Usuario creado', 'success');
    }

    cerrarModalUsuario();
    cargarUsuarios();
    cargarEstadisticasAdmin();
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
    alertBox.classList.remove('hidden');
    showToast(error.message, 'error');
  }
}

// ==================== RESET PASSWORD ====================
function abrirModalReset(id, nombre) {
  const modal = document.getElementById('modalResetPassword');
  modal.classList.remove('hidden');
  document.getElementById('resetUserId').value = id;
  document.getElementById('resetUserName').textContent = nombre;
  document.getElementById('resetPassword').value = '';
  document.getElementById('resetAlert').classList.add('hidden');
}

function cerrarModalReset() {
  document.getElementById('modalResetPassword').classList.add('hidden');
}

async function confirmarResetPassword() {
  const id = document.getElementById('resetUserId').value;
  const nuevaPassword = document.getElementById('resetPassword').value;
  const alertBox = document.getElementById('resetAlert');

  if (!nuevaPassword || nuevaPassword.length < 8) {
    alertBox.textContent = 'La contrasena debe tener al menos 8 caracteres';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
    alertBox.classList.remove('hidden');
    return;
  }

  try {
    await apiFetch(`/admin/usuarios/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ nuevaPassword })
    });
    showToast('Contrasena actualizada', 'success');
    cerrarModalReset();
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
    alertBox.classList.remove('hidden');
    showToast(error.message, 'error');
  }
}

// ==================== DESACTIVAR / ACTIVAR / ELIMINAR USUARIO ====================
async function desactivarUsuario(id) {
  if (!confirm('Desactivar este usuario? No podra iniciar sesion.')) return;
  try {
    await apiFetch(`/admin/usuarios/${id}/desactivar`, { method: 'PUT' });
    showToast('Usuario desactivado', 'success');
    cargarUsuarios();
    cargarEstadisticasAdmin();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function activarUsuario(id) {
  try {
    await apiFetch(`/admin/usuarios/${id}/activar`, { method: 'PUT' });
    showToast('Usuario activado', 'success');
    cargarUsuarios();
    cargarEstadisticasAdmin();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function eliminarUsuario(id) {
  if (!confirm('Eliminar PERMANENTEMENTE este usuario? Esta accion no se puede deshacer.')) return;
  try {
    await apiFetch(`/admin/usuarios/${id}`, { method: 'DELETE' });
    showToast('Usuario eliminado', 'success');
    cargarUsuarios();
    cargarEstadisticasAdmin();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==================== MODAL DOCENTE ====================
async function abrirModalDocente(id = null) {
  const modal = document.getElementById('modalDocente');
  const titulo = document.getElementById('modalDocenteTitulo');
  const alertBox = document.getElementById('docenteAlert');

  modal.classList.remove('hidden');
  alertBox.classList.add('hidden');
  document.getElementById('docenteId').value = '';
  document.getElementById('docenteTitulo').value = 'MSc.';
  document.getElementById('docenteNombre').value = '';
  document.getElementById('docenteEmail').value = '';
  document.getElementById('docenteEspecialidad').value = 'General';
  document.getElementById('docenteTelefono').value = '';
  document.getElementById('docenteMaxTesis').value = '5';

  if (id) {
    titulo.textContent = 'Editar Docente';
    try {
      const d = await apiFetch(`/docentes/${id}`);
      document.getElementById('docenteId').value = d._id;
      document.getElementById('docenteTitulo').value = d.titulo || 'MSc.';
      document.getElementById('docenteNombre').value = d.nombre;
      document.getElementById('docenteEmail').value = d.email;
      document.getElementById('docenteEspecialidad').value = d.especialidad || 'General';
      document.getElementById('docenteTelefono').value = d.telefono || '';
      document.getElementById('docenteMaxTesis').value = d.maxTesis || 5;
    } catch (error) {
      showToast('Error al cargar docente: ' + error.message, 'error');
      cerrarModalDocente();
    }
  } else {
    titulo.textContent = 'Nuevo Docente';
  }
}

function cerrarModalDocente() {
  document.getElementById('modalDocente').classList.add('hidden');
}

async function guardarDocente() {
  const id = document.getElementById('docenteId').value;
  const nombre = document.getElementById('docenteNombre').value.trim();
  const email = document.getElementById('docenteEmail').value.trim();
  const titulo = document.getElementById('docenteTitulo').value;
  const especialidad = document.getElementById('docenteEspecialidad').value;
  const telefono = document.getElementById('docenteTelefono').value.trim();
  const maxTesis = parseInt(document.getElementById('docenteMaxTesis').value) || 5;
  const alertBox = document.getElementById('docenteAlert');

  if (!nombre || !email) {
    alertBox.textContent = 'Nombre y email son obligatorios';
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
    alertBox.classList.remove('hidden');
    return;
  }

  const body = { nombre, email, titulo, especialidad, telefono, maxTesis };

  try {
    if (id) {
      await apiFetch(`/admin/docentes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      showToast('Docente actualizado', 'success');
    } else {
      await apiFetch('/admin/docentes', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showToast('Docente agregado', 'success');
    }

    cerrarModalDocente();
    cargarDocentesAdmin();
    cargarEstadisticasAdmin();
  } catch (error) {
    alertBox.textContent = error.message;
    alertBox.className = 'p-3 rounded text-sm bg-red-100 text-red-800';
    alertBox.classList.remove('hidden');
    showToast(error.message, 'error');
  }
}

async function eliminarDocenteAdmin(id) {
  if (!confirm('Desactivar este docente del catalogo?')) return;
  try {
    await apiFetch(`/admin/docentes/${id}`, { method: 'DELETE' });
    showToast('Docente desactivado', 'success');
    cargarDocentesAdmin();
    cargarEstadisticasAdmin();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==================== UTILIDADES ====================
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
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