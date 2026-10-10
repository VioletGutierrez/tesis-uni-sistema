const User = require('../models/User');
const Docente = require('../models/Docente');
const Tesis = require('../models/Tesis');
const bcrypt = require('bcryptjs');

// ==================== ESTADISTICAS GLOBALES ====================
// GET /api/admin/estadisticas
exports.obtenerEstadisticasGlobales = async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments({ activo: true });
    const totalEstudiantes = await User.countDocuments({ rol: 'estudiante', activo: true });
    const totalDocentes = await User.countDocuments({ rol: 'docente', activo: true });
    const totalComision = await User.countDocuments({ rol: 'comision', activo: true });
    const totalAdmin = await User.countDocuments({ rol: 'admin', activo: true });

    const totalTesis = await Tesis.countDocuments();
    const tesisPropuesta = await Tesis.countDocuments({ estado: 'propuesta' });
    const tesisEnRevision = await Tesis.countDocuments({ estado: 'en_revision' });
    const tesisAprobada = await Tesis.countDocuments({ estado: 'aprobado' });
    const tesisRechazada = await Tesis.countDocuments({ estado: 'rechazado' });
    const tesisFinalizada = await Tesis.countDocuments({ estado: 'finalizado' });

    const docentesCatalogo = await Docente.countDocuments({ activo: true });

    res.json({
      usuarios: {
        total: totalUsuarios,
        estudiantes: totalEstudiantes,
        docentes: totalDocentes,
        comision: totalComision,
        admin: totalAdmin
      },
      tesis: {
        total: totalTesis,
        propuesta: tesisPropuesta,
        enRevision: tesisEnRevision,
        aprobada: tesisAprobada,
        rechazada: tesisRechazada,
        finalizada: tesisFinalizada
      },
      docentesCatalogo
    });
  } catch (error) {
    console.error('[ADMIN] Error estadisticas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== LISTAR USUARIOS ====================
// GET /api/admin/usuarios
exports.obtenerUsuarios = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.rol) filtro.rol = req.query.rol;
    if (req.query.activo === 'true') filtro.activo = true;
    if (req.query.activo === 'false') filtro.activo = false;

    const usuarios = await User.find(filtro)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(usuarios);
  } catch (error) {
    console.error('[ADMIN] Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== OBTENER USUARIO POR ID ====================
// GET /api/admin/usuarios/:id
exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== CREAR USUARIO ====================
// POST /api/admin/usuarios
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, carnet, carrera } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ msg: 'Nombre, email, contrasena y rol son obligatorios' });
    }

    // Verificar email duplicado
    const existeEmail = await User.findOne({ email: email.toLowerCase() });
    if (existeEmail) {
      return res.status(400).json({ msg: 'El email ya esta registrado' });
    }

    // Verificar carnet duplicado
    if (carnet && carnet.trim() !== '') {
      const existeCarnet = await User.findOne({ carnet: carnet.trim() });
      if (existeCarnet) {
        return res.status(400).json({ msg: 'El carnet ya esta registrado' });
      }
    }

    // Validar rol
    const rolesValidos = ['estudiante', 'docente', 'comision', 'admin'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ msg: 'Rol invalido' });
    }

    const userData = {
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      rol
    };

    if (carnet && carnet.trim() !== '') userData.carnet = carnet.trim();
    if (carrera && carrera.trim() !== '') userData.carrera = carrera.trim();

    const usuario = new User(userData);
    await usuario.save();

    const usuarioSinPass = await User.findById(usuario._id).select('-password');
    res.status(201).json({ msg: 'Usuario creado exitosamente', usuario: usuarioSinPass });
  } catch (error) {
    console.error('[ADMIN] Error al crear usuario:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ msg: mensajes.join(', ') });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== ACTUALIZAR USUARIO ====================
// PUT /api/admin/usuarios/:id
exports.actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, rol, carnet, carrera, activo } = req.body;

    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

    // Verificar email duplicado (excluyendo al mismo usuario)
    if (email && email.toLowerCase() !== usuario.email) {
      const existeEmail = await User.findOne({ email: email.toLowerCase() });
      if (existeEmail) {
        return res.status(400).json({ msg: 'El email ya esta en uso' });
      }
      usuario.email = email.toLowerCase().trim();
    }

    // Verificar carnet duplicado
    if (carnet && carnet.trim() !== usuario.carnet) {
      const existeCarnet = await User.findOne({ carnet: carnet.trim() });
      if (existeCarnet) {
        return res.status(400).json({ msg: 'El carnet ya esta en uso' });
      }
      usuario.carnet = carnet.trim();
    }

    if (nombre) usuario.nombre = nombre.trim();
    if (rol) {
      const rolesValidos = ['estudiante', 'docente', 'comision', 'admin'];
      if (rolesValidos.includes(rol)) usuario.rol = rol;
    }
    if (carrera !== undefined) usuario.carrera = carrera.trim();
    if (activo !== undefined) usuario.activo = activo;

    await usuario.save();

    const usuarioSinPass = await User.findById(usuario._id).select('-password');
    res.json({ msg: 'Usuario actualizado', usuario: usuarioSinPass });
  } catch (error) {
    console.error('[ADMIN] Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== RESETEAR PASSWORD ====================
// PUT /api/admin/usuarios/:id/reset-password
exports.resetearPassword = async (req, res) => {
  try {
    const { nuevaPassword } = req.body;

    if (!nuevaPassword || nuevaPassword.length < 8) {
      return res.status(400).json({ msg: 'La contrasena debe tener al menos 8 caracteres' });
    }

    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

    // Asignar la nueva password (el hook pre-save la hasheara)
    usuario.password = nuevaPassword;
    await usuario.save();

    res.json({ msg: 'Contrasena actualizada exitosamente' });
  } catch (error) {
    console.error('[ADMIN] Error al resetear password:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== DESACTIVAR USUARIO ====================
// PUT /api/admin/usuarios/:id/desactivar
exports.desactivarUsuario = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

    // No permitir desactivarse a si mismo
    if (usuario._id.toString() === req.userId) {
      return res.status(400).json({ msg: 'No puedes desactivar tu propia cuenta' });
    }

    usuario.activo = false;
    await usuario.save();

    res.json({ msg: 'Usuario desactivado', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== ACTIVAR USUARIO ====================
// PUT /api/admin/usuarios/:id/activar
exports.activarUsuario = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

    usuario.activo = true;
    await usuario.save();

    res.json({ msg: 'Usuario activado', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== ELIMINAR USUARIO ====================
// DELETE /api/admin/usuarios/:id
exports.eliminarUsuario = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

    if (usuario._id.toString() === req.userId) {
      return res.status(400).json({ msg: 'No puedes eliminar tu propia cuenta' });
    }

    // Verificar si tiene tesis asociadas
    const tesisCount = await Tesis.countDocuments({ estudiante: usuario._id });
    if (tesisCount > 0) {
      return res.status(400).json({
        msg: `No se puede eliminar: el usuario tiene ${tesisCount} tesis asociadas. Desactivalo en lugar de eliminarlo.`
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Usuario eliminado permanentemente' });
  } catch (error) {
    console.error('[ADMIN] Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== DOCENTES: CREAR ====================
// POST /api/admin/docentes
exports.crearDocente = async (req, res) => {
  try {
    const { nombre, email, especialidad, titulo, telefono, maxTesis } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ msg: 'Nombre y email son obligatorios' });
    }

    const existe = await Docente.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ msg: 'El docente ya existe en el catalogo' });
    }

    const docente = new Docente({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      especialidad: especialidad || 'General',
      titulo: titulo || 'MSc.',
      telefono,
      maxTesis: maxTesis || 5
    });

    await docente.save();
    res.status(201).json({ msg: 'Docente agregado al catalogo', docente });
  } catch (error) {
    console.error('[ADMIN] Error al crear docente:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'El docente ya existe' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== DOCENTES: ACTUALIZAR ====================
// PUT /api/admin/docentes/:id
exports.actualizarDocente = async (req, res) => {
  try {
    const docente = await Docente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!docente) return res.status(404).json({ msg: 'Docente no encontrado' });
    res.json({ msg: 'Docente actualizado', docente });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ==================== DOCENTES: ELIMINAR ====================
// DELETE /api/admin/docentes/:id
exports.eliminarDocente = async (req, res) => {
  try {
    await Docente.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ msg: 'Docente desactivado del catalogo' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};