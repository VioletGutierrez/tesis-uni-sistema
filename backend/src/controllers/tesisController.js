const Tesis = require('../models/Tesis');

// GET /api/tesis
exports.obtenerTesis = async (req, res) => {
  try {
    const tesis = await Tesis.find()
      .populate('estudiante', 'nombre email carnet')
      .populate('tutor', 'nombre email')
      .sort({ createdAt: -1 });
    res.json(tesis);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/tesis/:id
exports.obtenerTesisPorId = async (req, res) => {
  try {
    const tesis = await Tesis.findById(req.params.id)
      .populate('estudiante', 'nombre email carnet')
      .populate('tutor', 'nombre email');
    if (!tesis) return res.status(404).json({ msg: 'Tesis no encontrada' });
    res.json(tesis);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/tesis
exports.crearTesis = async (req, res) => {
  try {
    const { titulo, descripcion, lineaInvestigacion } = req.body;
    const tesis = new Tesis({
      titulo,
      descripcion,
      lineaInvestigacion,
      estudiante: req.userId
    });
    await tesis.save();
    res.status(201).json(tesis);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// PUT /api/tesis/:id
exports.actualizarTesis = async (req, res) => {
  try {
    const tesis = await Tesis.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tesis) return res.status(404).json({ msg: 'Tesis no encontrada' });
    res.json(tesis);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// DELETE /api/tesis/:id
exports.eliminarTesis = async (req, res) => {
  try {
    const tesis = await Tesis.findByIdAndDelete(req.params.id);
    if (!tesis) return res.status(404).json({ msg: 'Tesis no encontrada' });
    res.json({ msg: 'Tesis eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/tesis/health
exports.health = async (req, res) => {
  try {
    const dbState = require('mongoose').connection.readyState;
    const estados = { 0: 'desconectado', 1: 'conectado', 2: 'conectando', 3: 'desconectando' };
    
    res.json({
      status: dbState === 1 ? 'Healthy' : 'Unhealthy',
      timestamp: new Date().toISOString(),
      database: estados[dbState],
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
      },
      uptime: `${Math.round(process.uptime())} segundos`
    });
  } catch (error) {
    res.status(500).json({ status: 'Unhealthy', error: error.message });
  }
};