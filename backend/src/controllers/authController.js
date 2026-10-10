const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT
const generarToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  });
};

// ==================== REGISTRO ====================
// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    console.log('===== NUEVO REGISTRO =====');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));

    const { nombre, email, password, rol, carnet, carrera } = req.body;

    // Validar campos basicos
    if (!nombre || !email || !password) {
      console.log('Faltan campos obligatorios');
      return res.status(400).json({ msg: 'Nombre, email y contrasena son obligatorios' });
    }

    // Verificar email duplicado
    const existeEmail = await User.findOne({ email: email.toLowerCase() });
    if (existeEmail) {
      console.log('Email ya existe:', email);
      return res.status(400).json({ msg: 'El email ya esta registrado' });
    }

    // Verificar carnet duplicado (solo si se proporciono)
    if (carnet && carnet.trim() !== '') {
      const existeCarnet = await User.findOne({ carnet: carnet.trim() });
      if (existeCarnet) {
        console.log('Carnet ya existe:', carnet);
        return res.status(400).json({ msg: 'El carnet ya esta registrado' });
      }
    }

    // Validar rol
    const rolesValidos = ['estudiante', 'docente', 'comision', 'admin'];
    const rolFinal = rolesValidos.includes(rol) ? rol : 'estudiante';
    console.log('Rol recibido:', rol, '| Rol final:', rolFinal);

    // Preparar datos del usuario
    const userData = {
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      rol: rolFinal
    };

    if (carnet && carnet.trim() !== '') {
      userData.carnet = carnet.trim();
    }

    if (carrera && carrera.trim() !== '') {
      userData.carrera = carrera.trim();
    }

    console.log('Creando usuario con:', JSON.stringify(userData, null, 2));

    const user = new User(userData);
    await user.save();

    console.log('Usuario guardado:', user.email);

    const token = generarToken(user._id);

    res.status(201).json({
      msg: 'Usuario creado exitosamente',
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('===== ERROR EN REGISTRO =====');
    console.error('Nombre del error:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Codigo:', error.code);
    if (error.errors) {
      console.error('Errores de validacion:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('Stack:', error.stack);
    console.error('==============================');

    // Manejar errores de validacion
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        msg: 'Error de validacion: ' + mensajes.join(', ')
      });
    }

    // Manejar duplicados
    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'campo';
      return res.status(400).json({ msg: `El ${campo} ya esta registrado` });
    }

    res.status(500).json({
      error: 'Error del servidor',
      detalle: error.message
    });
  }
};

// ==================== LOGIN ====================
// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email y contrasena son obligatorios' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
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
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('[AUTH] Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== PERFIL ====================
// GET /api/auth/profile
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};