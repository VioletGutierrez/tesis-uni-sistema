const mongoose = require('mongoose');

const tesisSchema = new mongoose.Schema({
  // ===== Datos básicos =====
  titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true },
  descripcion: { type: String, required: [true, 'La descripción es obligatoria'] },
  modalidad: { 
    type: String, 
    enum: ['tesis', 'monografia'], 
    default: 'monografia' 
  },
  lineaInvestigacion: { 
    type: String, 
    enum: ['IA', 'Desarrollo Web', 'Redes', 'Base de Datos', 'Seguridad', 'IoT'],
    required: true 
  },

  // ===== Actores =====
  estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Docente propuesto (referencia al catálogo de docentes)
  docentePropuesto: { type: mongoose.Schema.Types.ObjectId, ref: 'Docente' },
  
  // Docente asignado oficialmente por la comisión
  tutorAsignado: { type: mongoose.Schema.Types.ObjectId, ref: 'Docente' },

  // ===== Estado y fechas =====
  estado: { 
    type: String, 
    enum: ['propuesta', 'en_revision', 'aprobado', 'rechazado', 'finalizado'], 
    default: 'propuesta' 
  },
  fechaEnvio: { type: Date, default: Date.now },
  fechaAprobacion: { type: Date },
  fechaFinalizacion: { type: Date },

  // ===== Archivos =====
  archivoUrl: { type: String },
  archivoFinalUrl: { type: String },

  // ===== Versionado =====
  version: { type: Number, default: 1 },

  // ===== Observaciones del tutor/comisión =====
  observaciones: [{
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    texto: String,
    tipo: { type: String, enum: ['comentario', 'correccion', 'aprobacion', 'rechazo'], default: 'comentario' },
    fecha: { type: Date, default: Date.now }
  }],

  // ===== Historial de estados =====
  historialEstados: [{
    estadoAnterior: String,
    estadoNuevo: String,
    cambiadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    motivo: String,
    fecha: { type: Date, default: Date.now }
  }],

  // ===== Calificación final =====
  calificacion: { type: Number, min: 0, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('Tesis', tesisSchema);