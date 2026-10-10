const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validarCampos } = require('../middlewares/validatorMiddleware');

// POST /api/auth/register
router.post('/register', [
  body('nombre').trim().isLength({ min: 3 }).withMessage('Nombre minimo 3 caracteres'),
  body('email').isEmail().withMessage('Email invalido'),
  body('password').isLength({ min: 8 }).withMessage('Password minimo 8 caracteres')
    .matches(/\d/).withMessage('Password debe contener al menos un numero')
    .matches(/[A-Z]/).withMessage('Password debe contener al menos una mayuscula'),
  validarCampos
], authController.register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email invalido'),
  body('password').notEmpty().withMessage('Password requerido'),
  validarCampos
], authController.login);

// GET /api/auth/profile
router.get('/profile', verifyToken, authController.profile);

module.exports = router;