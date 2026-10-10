const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`[DB] MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Error de conexion: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;