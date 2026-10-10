exports.errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ msg: 'Error de validacion', errors });
  }

  if (err.code === 11000) {
    return res.status(400).json({ msg: 'Registro duplicado' });
  }

  res.status(err.status || 500).json({
    msg: err.message || 'Error interno del servidor'
  });
};