const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Todas las rutas de admin requieren token y rol admin
router.use(verifyToken);
router.use(requireRole('admin'));

// ==================== ESTADISTICAS ====================
router.get('/estadisticas', adminController.obtenerEstadisticasGlobales);

// ==================== USUARIOS ====================
router.get('/usuarios', adminController.obtenerUsuarios);
router.get('/usuarios/:id', adminController.obtenerUsuarioPorId);
router.post('/usuarios', adminController.crearUsuario);
router.put('/usuarios/:id', adminController.actualizarUsuario);
router.put('/usuarios/:id/reset-password', adminController.resetearPassword);
router.put('/usuarios/:id/desactivar', adminController.desactivarUsuario);
router.put('/usuarios/:id/activar', adminController.activarUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// ==================== DOCENTES ====================
router.post('/docentes', adminController.crearDocente);
router.put('/docentes/:id', adminController.actualizarDocente);
router.delete('/docentes/:id', adminController.eliminarDocente);

module.exports = router;