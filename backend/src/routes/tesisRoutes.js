const express = require('express');
const router = express.Router();
const tesisController = require('../controllers/tesisController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Health check (publico)
router.get('/health', tesisController.health);

// Rutas protegidas
router.get('/', verifyToken, tesisController.obtenerTesis);
router.get('/:id', verifyToken, tesisController.obtenerTesisPorId);
router.post('/', verifyToken, requireRole('estudiante', 'admin'), tesisController.crearTesis);
router.put('/:id', verifyToken, tesisController.actualizarTesis);
router.delete('/:id', verifyToken, requireRole('admin', 'comision'), tesisController.eliminarTesis);

module.exports = router;