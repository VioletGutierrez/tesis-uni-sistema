const mongoose = require('mongoose');

const lineaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  codigo: { type: String, required: true, unique: true },
  descripcion: { type: String },
  activa: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('LineaInvestigacion', lineaSchema);