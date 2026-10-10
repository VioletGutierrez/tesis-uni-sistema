const express = require('express');
const router = express.Router();
const tesisController = require('../controllers/tesisController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// ==================== RUTAS PUBLICAS ====================
router.get('/health', tesisController.health);

// ==================== TODAS LAS DEMAS REQUIEREN TOKEN ====================
router.use(verifyToken);

// Listar y ver tesis
router.get('/', tesisController.obtenerTesis);

// Estadisticas (solo comision/admin)
router.get('/estadisticas',
  requireRole('comision', 'admin'),
  tesisController.obtenerEstadisticas
);

// Ver tesis por ID
router.get('/:id', tesisController.obtenerTesisPorId);

// Crear tesis (estudiante/admin) con archivo PDF
router.post('/',
  requireRole('estudiante', 'admin'),
  upload.single('archivo'),
  tesisController.crearTesis
);

// Editar tesis (solo dueño)
router.put('/:id',
  requireRole('estudiante', 'admin'),
  tesisController.actualizarTesis
);

// Subir archivo final (estudiante/admin)
router.post('/:id/archivo-final',
  requireRole('estudiante', 'admin'),
  upload.single('archivo'),
  tesisController.subirArchivoFinal
);

// Asignar tutor oficial (solo comision/admin)
router.put('/:id/asignar-tutor',
  requireRole('comision', 'admin'),
  tesisController.asignarTutor
);

// Cambiar estado (docente/comision/admin)
router.put('/:id/estado',
  requireRole('docente', 'comision', 'admin'),
  tesisController.cambiarEstado
);

// Agregar observacion (docente/comision/admin)
router.post('/:id/observacion',
  requireRole('docente', 'comision', 'admin'),
  tesisController.agregarObservacion
);

// Eliminar tesis (comision/admin)
router.delete('/:id',
  requireRole('comision', 'admin'),
  tesisController.eliminarTesis
);

module.exports = router;