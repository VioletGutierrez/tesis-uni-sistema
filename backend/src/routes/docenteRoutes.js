const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// Cualquier usuario autenticado puede listar/ver docentes
router.get('/', docenteController.obtenerDocentes);
router.get('/:id', docenteController.obtenerDocentePorId);

// Solo admin puede crear/editar/eliminar
router.post('/', requireRole('admin'), docenteController.crearDocente);
router.put('/:id', requireRole('admin'), docenteController.actualizarDocente);
router.delete('/:id', requireRole('admin'), docenteController.eliminarDocente);

module.exports = router;