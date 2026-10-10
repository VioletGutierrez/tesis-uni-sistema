require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/database');
const { errorHandler } = require('./middlewares/errorHandler');

// ==================== CREAR CARPETAS ====================
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

// ==================== CONECTAR A MONGODB ====================
connectDB();

// ==================== MIDDLEWARES GLOBALES ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Permitir cargar PDFs desde Vercel
}));

// CORS dinamico: acepta multiples origenes separados por coma
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5500')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl)
    if (!origin) return callback(null, true);

    // Permitir si esta en la lista o si es wildcard
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Bloqueado origen: ${origin}`);
    callback(new Error('CORS no permitido'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ==================== SERVIR ARCHIVOS ESTATICOS ====================
app.use('/uploads', express.static(uploadsDir));

// ==================== RUTAS ====================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tesis', require('./routes/tesisRoutes'));
app.use('/api/lineas', require('./routes/lineaRoutes'));
app.use('/api/docentes', require('./routes/docenteRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ==================== RUTA RAIZ ====================
app.get('/', (req, res) => {
  res.json({
    msg: 'API del Sistema de Gestion de Tesis UNI',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      tesis: '/api/tesis',
      lineas: '/api/lineas',
      docentes: '/api/docentes',
      admin: '/api/admin',
      health: '/api/tesis/health'
    }
  });
});

// ==================== MANEJADOR DE ERRORES ====================
app.use(errorHandler);

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] Ejecutando en puerto ${PORT}`);
  console.log(`[SERVER] Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] CORS permitidos: ${corsOrigins.join(', ')}`);
  console.log(`[SERVER] URL: http://localhost:${PORT}`);
});