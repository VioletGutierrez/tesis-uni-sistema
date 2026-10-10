const mongoose = require('mongoose');

const tesisSchema = new mongoose.Schema({
  titulo: { type: String, required: [true, 'El titulo es obligatorio'], trim: true },
  descripcion: { type: String, required: true },
  estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lineaInvestigacion: { 
    type: String, 
    enum: ['IA', 'Desarrollo Web', 'Redes', 'Base de Datos', 'Seguridad', 'IoT'],
    required: true 
  },
  estado: { 
    type: String, 
    enum: ['propuesta', 'en_revision', 'aprobado', 'rechazado', 'finalizado'], 
    default: 'propuesta' 
  },
  archivoUrl: { type: String },
  observaciones: [{
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    texto: String,
    fecha: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Tesis', tesisSchema);