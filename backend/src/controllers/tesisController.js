const Tesis = require('../models/Tesis');
const Docente = require('../models/Docente');

// ==================== LISTAR TESIS ====================
// GET /api/tesis
exports.obtenerTesis = async (req, res) => {
  try {
    let filtro = {};

    if (req.userRole === 'estudiante') {
      // Estudiante: solo sus propias tesis
      filtro.estudiante = req.userId;
    } else if (req.userRole === 'docente') {
      // Docente: tesis donde esta asignado oficialmente O propuesto
      const docente = await Docente.findOne({ email: req.user.email });
      if (docente) {
        filtro.$or = [
          { tutorAsignado: docente._id },
          { docentePropuesto: docente._id }
        ];
      } else {
        // Si no existe en el catalogo de Docentes, no ve nada
        filtro._id = null;
      }
    }
    // comision y admin ven todas

    const tesis = await Tesis.find(filtro)
      .populate('estudiante', 'nombre email carnet carrera')
      .populate('tutorAsignado', 'nombre email titulo especialidad')
      .populate('docentePropuesto', 'nombre email titulo especialidad')
      .sort({ createdAt: -1 });

    res.json(tesis);
  } catch (error) {
    console.error('[TESIS] Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== ESTADISTICAS ====================
// GET /api/tesis/estadisticas
exports.obtenerEstadisticas = async (req, res) => {
  try {
    let filtroBase = {};

    // Si es docente, solo cuenta las suyas
    if (req.userRole === 'docente') {
      const docente = await Docente.findOne({ email: req.user.email });
      if (docente) {
        filtroBase.$or = [
          { tutorAsignado: docente._id },
          { docentePropuesto: docente._id }
        ];
      } else {
        filtroBase._id = null;
      }
    }

    const total = await Tesis.countDocuments(filtroBase);
    const propuesta = await Tesis.countDocuments({ ...filtroBase, estado: 'propuesta' });
    const enRevision = await Tesis.countDocuments({ ...filtroBase, estado: 'en_revision' });
    const aprobado = await Tesis.countDocuments({ ...filtroBase, estado: 'aprobado' });
    const rechazado = await Tesis.countDocuments({ ...filtroBase, estado: 'rechazado' });
    const finalizado = await Tesis.countDocuments({ ...filtroBase, estado: 'finalizado' });

    // Solo para comision/admin: cuantas tesis sin tutor oficial
    let sinTutor = 0;
    if (['comision', 'admin'].includes(req.userRole)) {
      sinTutor = await Tesis.countDocuments({
        estado: 'propuesta',
        tutorAsignado: null
      });
    }

    res.json({
      total,
      propuesta,
      enRevision,
      aprobado,
      rechazado,
      finalizado,
      sinTutor
    });
  } catch (error) {
    console.error('[TESIS] Error estadisticas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== OBTENER TESIS POR ID ====================
// GET /api/tesis/:id
exports.obtenerTesisPorId = async (req, res) => {
  try {
    const tesis = await Tesis.findById(req.params.id)
      .populate('estudiante', 'nombre email carnet carrera')
      .populate('tutorAsignado', 'nombre email titulo especialidad')
      .populate('docentePropuesto', 'nombre email titulo especialidad')
      .populate('observaciones.autor', 'nombre rol')
      .populate('historialEstados.cambiadoPor', 'nombre rol');

    if (!tesis) return res.status(404).json({ msg: 'Tesis no encontrada' });

    // Verificar permisos
    if (req.userRole === 'estudiante' && tesis.estudiante._id.toString() !== req.userId) {
      return res.status(403).json({ msg: 'No tienes permiso' });
    }

    if (req.userRole === 'docente') {
      const docente = await Docente.findOne({ email: req.user.email });
      const esSuTesis = docente && (
        (tesis.tutorAsignado && tesis.tutorAsignado._id.toString() === docente._id.toString()) ||
        (tesis.docentePropuesto && tesis.docentePropuesto._id.toString() === docente._id.toString())
      );
      if (!esSuTesis) {
        return res.status(403).json({ msg: 'No tienes permiso para ver esta tesis' });
      }
    }

    res.json(tesis);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== CREAR TESIS ====================
// POST /api/tesis
exports.crearTesis = async (req, res) => {
  try {
    const {
      titulo, descripcion, lineaInvestigacion,
      modalidad, docentePropuesto
    } = req.body;

    const nuevaTesis = new Tesis({
      titulo,
      descripcion,
      lineaInvestigacion,
      modalidad: modalidad || 'monografia',
      docentePropuesto: docentePropuesto || null,
      estudiante: req.userId,
      archivoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      historialEstados: [{
        estadoAnterior: null,
        estadoNuevo: 'propuesta',
        cambiadoPor: req.userId,
        motivo: 'Creacion inicial de la propuesta'
      }]
    });

    await nuevaTesis.save();
    await nuevaTesis.populate('estudiante', 'nombre email carnet');
    await nuevaTesis.populate('docentePropuesto', 'nombre email titulo');

    res.status(201).json(nuevaTesis);
  } catch (error) {
    console.error('[TESIS] Error al crear:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== ACTUALIZAR TESIS ====================
// PUT /api/tesis/:id
exports.actualizarTesis = async (req, res) => {
  try {
    const tesis = await Tesis.findById(req.params.id);
    if (!tesis) return res.status(404).json({ msg: 'Tesis no encontrada' });

    if (tesis.estudiante.toString() !== req.userId) {
      return res.status(403).json({ msg: 'No puedes editar esta tesis' });
    }
    if (!['propuesta', 'rechazado'].includes(tesis.estado)) {
      return res.status(400).json({ msg: 'No puedes editar una tesis en revision o aprobada' });
    }

    const actualizada = await Tesis.findByIdAndUpdate(
      req.params.id,
      { ...req.body, version: tesis.version + 1 },
      { new: true, runValidators: true }
    );

    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== ASIGNAR TUTOR (comision/admin) ====================
// PUT /api/tesis/:id/asignar-tutor
exports.asignarTutor = async (req, res) => {
  try {
    const { docenteId } = req.body;

    if (!docenteId) {
      return res.status(400).json({ msg: 'Debes seleccionar un docente' });
    }

    const docente = await Docente.findById(docenteId);
    if (!docente) {
      return res.status(404).json({ msg: 'Docente no encontrado' });
    }

    const tesis = await Tesis.findById(req.params.id);
    if (!tesis) {
      return res.status(404).json({ msg: 'Tesis no encontrada' });
    }

    const estadoAnterior = tesis.estado;
    tesis.tutorAsignado = docenteId;

    if (tesis.estado === 'propuesta') {
      tesis.estado = 'en_revision';
    }

    tesis.historialEstados.push({
      estadoAnterior,
      estadoNuevo: tesis.estado,
      cambiadoPor: req.userId,
      motivo: `Tutor asignado: ${docente.titulo} ${docente.nombre}`
    });

    await tesis.save();
    await tesis.populate('tutorAsignado', 'nombre email titulo especialidad');
    await tesis.populate('estudiante', 'nombre email');

    res.json({ msg: 'Tutor asignado exitosamente', tesis });
  } catch (error) {
    console.error('[TESIS] Error al asignar tutor:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== CAMBIAR ESTADO (docente/comision/admin) ====================
// PUT /api/tesis/:id/estado
exports.cambiarEstado = async (req, res) => {
  try {
    const { nuevoEstado, motivo, calificacion } = req.body;

    if (!nuevoEstado) {
      return res.status(400).json({ msg: 'Debes indicar el nuevo estado' });
    }

    const estadosValidos = ['propuesta', 'en_revision', 'aprobado', 'rechazado', 'finalizado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ msg: 'Estado invalido' });
    }

    const tesis = await Tesis.findById(req.params.id);
    if (!tesis) {
      return res.status(404).json({ msg: 'Tesis no encontrada' });
    }

    // Si es docente, solo puede cambiar el estado de SUS tesis
    if (req.userRole === 'docente') {
      const docente = await Docente.findOne({ email: req.user.email });
      const esSuTesis = docente && tesis.tutorAsignado &&
        tesis.tutorAsignado.toString() === docente._id.toString();
      if (!esSuTesis) {
        return res.status(403).json({ msg: 'Solo puedes gestionar tesis que te han sido asignadas oficialmente' });
      }
    }

    const estadoAnterior = tesis.estado;
    tesis.estado = nuevoEstado;

    if (nuevoEstado === 'aprobado') tesis.fechaAprobacion = new Date();
    if (nuevoEstado === 'finalizado') {
      tesis.fechaFinalizacion = new Date();
      if (calificacion) tesis.calificacion = calificacion;
    }

    tesis.historialEstados.push({
      estadoAnterior,
      estadoNuevo: nuevoEstado,
      cambiadoPor: req.userId,
      motivo: motivo || 'Sin motivo especificado'
    });

    await tesis.save();
    await tesis.populate('estudiante', 'nombre email');
    await tesis.populate('tutorAsignado', 'nombre');

    res.json({ msg: 'Estado actualizado', tesis });
  } catch (error) {
    console.error('[TESIS] Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== AGREGAR OBSERVACION ====================
// POST /api/tesis/:id/observacion
exports.agregarObservacion = async (req, res) => {
  try {
    const { texto, tipo } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ msg: 'Debes escribir una observacion' });
    }

    const tesis = await Tesis.findById(req.params.id);
    if (!tesis) return res.status(404).json({ msg: 'Tesis no encontrada' });

    // Si es docente, solo puede observar SUS tesis
    if (req.userRole === 'docente') {
      const docente = await Docente.findOne({ email: req.user.email });
      const esSuTesis = docente && tesis.tutorAsignado &&
        tesis.tutorAsignado.toString() === docente._id.toString();
      if (!esSuTesis) {
        return res.status(403).json({ msg: 'Solo puedes observar tesis que te han sido asignadas' });
      }
    }

    tesis.observaciones.push({
      autor: req.userId,
      texto: texto.trim(),
      tipo: tipo || 'comentario'
    });

    await tesis.save();
    await tesis.populate('observaciones.autor', 'nombre rol');
    res.json(tesis);
  } catch (error) {
    console.error('[TESIS] Error al agregar observacion:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== SUBIR ARCHIVO FINAL ====================
// POST /api/tesis/:id/archivo-final
exports.subirArchivoFinal = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No se subio ningun archivo' });

    const tesis = await Tesis.findById(req.params.id);
    if (!tesis) return res.status(404).json({ msg: 'Tesis no encontrada' });

    tesis.archivoFinalUrl = `/uploads/${req.file.filename}`;
    await tesis.save();

    res.json({ msg: 'Archivo final subido', archivoFinalUrl: tesis.archivoFinalUrl });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== ELIMINAR TESIS ====================
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

// ==================== HEALTH CHECK ====================
// GET /api/tesis/health
exports.health = async (req, res) => {
  const dbState = require('mongoose').connection.readyState;
  const estados = { 0: 'desconectado', 1: 'conectado', 2: 'conectando', 3: 'desconectando' };
  res.json({
    status: dbState === 1 ? 'Healthy' : 'Unhealthy',
    timestamp: new Date().toISOString(),
    database: estados[dbState],
    uptime: `${Math.round(process.uptime())} segundos`
  });
};