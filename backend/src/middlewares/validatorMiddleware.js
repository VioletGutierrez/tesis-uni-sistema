const { validationResult } = require('express-validator');

exports.validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: 'Errores de validacion', errors: errors.array() });
  }
  next();
};