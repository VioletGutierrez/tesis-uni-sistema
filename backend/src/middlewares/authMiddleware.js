const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const header = req.header('Authorization');
  if (!header) {
    return res.status(401).json({ msg: 'Acceso denegado. No hay token' });
  }

  try {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token invalido o expirado' });
  }
};

exports.requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      if (!user || !roles.includes(user.rol)) {
        return res.status(403).json({ msg: 'No tiene permisos para esta accion' });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error del servidor' });
    }
  };
};