const Docente = require('../models/Docente');

// GET /api/docentes — Listar docentes (con filtros opcionales)
exports.obtenerDocentes = async (req, res) => {
  try {
    const filtro = { activo: true };
    
    // Filtrar por especialidad si se especifica
    if (req.query.especialidad) {
      filtro.especialidad = req.query.especialidad;
    }
    
    // Filtrar solo disponibles
    if (req.query.disponibles === 'true') {
      filtro.disponible = true;
    }

    const docentes = await Docente.find(filtro).sort({ nombre: 1 });
    res.json(docentes);
  } catch (error) {
    console.error('[DOCENTES] Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/docentes/:id
exports.obtenerDocentePorId = async (req, res) => {
  try {
    const docente = await Docente.findById(req.params.id);
    if (!docente) return res.status(404).json({ msg: 'Docente no encontrado' });
    res.json(docente);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/docentes — Solo admin
exports.crearDocente = async (req, res) => {
  try {
    const nuevo = new Docente(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'El docente ya existe' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// PUT /api/docentes/:id
exports.actualizarDocente = async (req, res) => {
  try {
    const actualizado = await Docente.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!actualizado) return res.status(404).json({ msg: 'Docente no encontrado' });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// DELETE /api/docentes/:id
exports.eliminarDocente = async (req, res) => {
  try {
    await Docente.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ msg: 'Docente desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};