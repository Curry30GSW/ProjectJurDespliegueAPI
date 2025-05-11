require('dotenv').config();
const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const clienteRoutes = require('./routes/clientesRoutes');

// Middleware para parsear JSON
app.use(express.json());

// Configurar almacenamiento de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Configurar carpeta donde se guardarán los archivos
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Cambiar el nombre del archivo para evitar conflictos
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Configuración de multer
const upload = multer({ storage: storage });

// Middleware para aceptar multipart/form-data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API conectada correctamente');
});

// Rutas del módulo cliente
app.use('/api', clienteRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
