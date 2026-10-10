require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function verUsuarios() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB\n');

    // ========== VER TODOS LOS USUARIOS ==========
    console.log('========================================');
    console.log('USUARIOS REGISTRADOS');
    console.log('========================================');
    const users = await User.find({}, { email: 1, carnet: 1, rol: 1, _id: 0 });
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`);
      console.log(`   Carnet: ${u.carnet || '(sin carnet)'}`);
      console.log(`   Rol: ${u.rol}`);
      console.log('');
    });
    console.log(`Total: ${users.length} usuarios\n`);

    // ========== VER INDICES ==========
    console.log('========================================');
    console.log('INDICES DE LA COLECCION users');
    console.log('========================================');
    const indexes = await mongoose.connection.db.collection('users').indexes();
    indexes.forEach(i => {
      const unique = i.unique ? '[UNIQUE]' : '';
      const sparse = i.sparse ? '[SPARSE]' : '';
      console.log(`- ${i.name} ${unique} ${sparse}`);
      console.log(`  Key: ${JSON.stringify(i.key)}`);
    });
    console.log('');

    // ========== BUSQUEDA ESPECIFICA ==========
    console.log('========================================');
    console.log('BUSQUEDAS ESPECIFICAS');
    console.log('========================================');
    
    const reyesv = await User.findOne({ email: 'reyesv@uni.edu.ni' });
    console.log('reyesv@uni.edu.ni:', reyesv ? 'YA EXISTE' : 'NO EXISTE');

    const carnet = await User.findOne({ carnet: '2026-0099I' });
    console.log('Carnet 2026-0099I:', carnet ? 'YA EXISTE' : 'NO EXISTE');

    const fernanda = await User.findOne({ email: 'fernanda@uni.edu.ni' });
    console.log('fernanda@uni.edu.ni:', fernanda ? 'YA EXISTE' : 'NO EXISTE');
    console.log('');

    // ========== ARREGLAR INDICE DE CARNET ==========
    console.log('========================================');
    console.log('REVISANDO INDICE DE CARNET');
    console.log('========================================');
    
    try {
      const collection = mongoose.connection.db.collection('users');
      const indices = await collection.indexes();
      const carnetIndex = indices.find(i => i.name === 'carnet_1');

      if (carnetIndex && !carnetIndex.sparse) {
        console.log('PROBLEMA DETECTADO: Indice carnet_1 existe SIN sparse');
        console.log('Eliminando indice mal configurado...');
        await collection.dropIndex('carnet_1');
        console.log('Indice eliminado');
        
        console.log('Recreando con sparse...');
        await collection.createIndex({ carnet: 1 }, { unique: true, sparse: true });
        console.log('Indice recreado correctamente');
        console.log('');
        console.log('*** PROBLEMA RESUELTO ***');
        console.log('Ahora puedes registrar usuarios con o sin carnet');
      } else if (carnetIndex) {
        console.log('OK: Indice carnet_1 ya tiene sparse: true');
      } else {
        console.log('Indice carnet_1 no existe. Creandolo...');
        await collection.createIndex({ carnet: 1 }, { unique: true, sparse: true });
        console.log('Indice creado correctamente');
      }
    } catch (e) {
      console.log('Error al arreglar indice:', e.message);
    }

    await mongoose.disconnect();
    console.log('\n========================================');
    console.log('Desconectado. Proceso terminado.');
    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

verUsuarios();