const LineaInvestigacion = require('../models/LineaInvestigacion');

exports.obtenerLineas = async (req, res) => {
  try {
    const lineas = await LineaInvestigacion.find({ activa: true });
    res.json(lineas);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.crearLinea = async (req, res) => {
  try {
    const nuevaLinea = new LineaInvestigacion(req.body);
    await nuevaLinea.save();
    res.status(201).json(nuevaLinea);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'La linea ya existe' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.actualizarLinea = async (req, res) => {
  try {
    const linea = await LineaInvestigacion.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!linea) return res.status(404).json({ msg: 'Linea no encontrada' });
    res.json(linea);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.eliminarLinea = async (req, res) => {
  try {
    await LineaInvestigacion.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Linea eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};