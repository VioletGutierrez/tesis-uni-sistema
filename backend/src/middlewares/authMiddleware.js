const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.verifyToken = async (req, res, next) => {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ msg: 'Acceso denegado. No hay token' });

  try {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Cargar rol del usuario para permisos
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ msg: 'Usuario no encontrado' });
    req.userRole = user.rol;
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token inválido o expirado' });
  }
};

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ msg: 'No tienes permisos para esta acción' });
    }
    next();
  };
};