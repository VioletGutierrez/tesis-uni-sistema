const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT
const generarToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol, carnet, carrera } = req.body;

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    const user = new User({ nombre, email, password, rol, carnet, carrera });
    await user.save();

    const token = generarToken(user._id);

    res.status(201).json({
      msg: 'Usuario creado exitosamente',
      token,
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    console.error('[AUTH] Error en register:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales invalidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales invalidas' });
    }

    const token = generarToken(user._id);

    res.json({
      token,
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    console.error('[AUTH] Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/auth/profile
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};