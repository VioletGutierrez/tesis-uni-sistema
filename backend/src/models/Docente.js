const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
  },
  especialidad: { 
    type: String, 
    enum: ['IA', 'Desarrollo Web', 'Redes', 'Base de Datos', 'Seguridad', 'IoT', 'General'],
    default: 'General'
  },
  titulo: { type: String, default: 'MSc.' }, // Dr., MSc., Ing., Lic.
  telefono: { type: String },
  maxTesis: { type: Number, default: 5 }, // Cupo máximo
  activo: { type: Boolean, default: true },
  disponible: { type: Boolean, default: true }
}, { timestamps: true });

// Virtual para contar tesis asignadas
docenteSchema.virtual('tesisAsignadas', {
  ref: 'Tesis',
  localField: '_id',
  foreignField: 'tutorAsignado',
  count: true
});

docenteSchema.set('toJSON', { virtuals: true });
docenteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Docente', docenteSchema);