require('dotenv').config();
const mongoose = require('mongoose');
const Docente = require('../models/Docente');

const docentesIniciales = [
  { nombre: 'Walter José Quintero Acevedo', email: 'walter.quintero@uni.edu.ni', especialidad: 'Desarrollo Web', titulo: 'MSc.' },
  { nombre: 'María Fernanda López Ruiz', email: 'maria.lopez@uni.edu.ni', especialidad: 'IA', titulo: 'Dra.' },
  { nombre: 'Carlos Alberto Méndez', email: 'carlos.mendez@uni.edu.ni', especialidad: 'Redes', titulo: 'Ing.' },
  { nombre: 'Ana Patricia Gutiérrez', email: 'ana.gutierrez@uni.edu.ni', especialidad: 'Base de Datos', titulo: 'MSc.' },
  { nombre: 'Roberto José Castillo', email: 'roberto.castillo@uni.edu.ni', especialidad: 'Seguridad', titulo: 'MSc.' },
  { nombre: 'Lucía del Carmen Rivas', email: 'lucia.rivas@uni.edu.ni', especialidad: 'IoT', titulo: 'Dra.' },
  { nombre: 'Pedro Antonio Solís', email: 'pedro.solis@uni.edu.ni', especialidad: 'General', titulo: 'MSc.' },
  { nombre: 'Elena María Morales', email: 'elena.morales@uni.edu.ni', especialidad: 'IA', titulo: 'MSc.' },
  { nombre: 'Jorge Luis Ramírez', email: 'jorge.ramirez@uni.edu.ni', especialidad: 'Desarrollo Web', titulo: 'Ing.' },
  { nombre: 'Sofía Isabel Herrera', email: 'sofia.herrera@uni.edu.ni', especialidad: 'Base de Datos', titulo: 'MSc.' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    await Docente.deleteMany({});
    console.log('🗑️  Docentes anteriores eliminados');

    const result = await Docente.insertMany(docentesIniciales);
    console.log(`✅ ${result.length} docentes insertados`);

    await mongoose.disconnect();
    console.log('🔌 Desconectado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();