const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
  email: { 
    type: String, 
    required: [true, 'El email es obligatorio'], 
    unique: true, 
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email invalido']
  },
  password: { type: String, required: [true, 'La contrasena es obligatoria'], minlength: 8, select: false },
  rol: { 
    type: String, 
    enum: ['estudiante', 'docente', 'comision', 'admin'], 
    default: 'estudiante' 
  },
  carnet: { type: String, unique: true, sparse: true },
  carrera: { type: String },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

// Hash de password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Metodo para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);