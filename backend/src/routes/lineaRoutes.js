const express = require('express');
const router = express.Router();
const lineaController = require('../controllers/lineaController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, lineaController.obtenerLineas);
router.post('/', verifyToken, lineaController.crearLinea);
router.put('/:id', verifyToken, lineaController.actualizarLinea);
router.delete('/:id', verifyToken, lineaController.eliminarLinea);

module.exports = router;