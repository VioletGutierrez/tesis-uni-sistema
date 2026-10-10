require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/database');
const { errorHandler } = require('./middlewares/errorHandler');

// Crear carpeta de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Crear carpeta de uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares globales
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Servir archivos estaticos
app.use('/uploads', express.static(uploadsDir));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tesis', require('./routes/tesisRoutes'));
app.use('/api/lineas', require('./routes/lineaRoutes'));

// Ruta raiz
app.get('/', (req, res) => {
  res.json({
    msg: 'API del Sistema de Gestion de Tesis UNI',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tesis: '/api/tesis',
      lineas: '/api/lineas',
      health: '/api/tesis/health'
    }
  });
});

// Manejador de errores (siempre al final)
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] Ejecutando en puerto ${PORT}`);
  console.log(`[SERVER] Entorno: ${process.env.NODE_ENV}`);
  console.log(`[SERVER] URL: http://localhost:${PORT}`);
});