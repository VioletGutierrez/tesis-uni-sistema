const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email invalido']
  },
  password: {
    type: String,
    required: [true, 'La contrasena es obligatoria'],
    minlength: 8,
    select: false
  },
  rol: {
    type: String,
    enum: ['estudiante', 'docente', 'comision', 'admin'],
    default: 'estudiante'
  },
  carnet: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  carrera: { type: String, trim: true },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

// ===== Hash de password antes de guardar =====
// IMPORTANTE: Solo hashea si la password fue modificada y NO parece un hash bcrypt
userSchema.pre('save', async function() {
  // Si la password no fue modificada, no hacer nada
  if (!this.isModified('password')) return;

  // Si la password YA es un hash bcrypt (empieza con $2a$ o $2b$), no hashear de nuevo
  if (this.password && this.password.startsWith('$2')) {
    console.log('[USER] Password ya es un hash, no se hashea de nuevo');
    return;
  }

  // Si es texto plano, hashear
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ===== Metodo para comparar passwords =====
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);