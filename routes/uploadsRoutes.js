const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configuración de almacenamiento mejorada
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tipo = req.body.tipo || 'temp';
        const uploadPath = path.join(__dirname, '..', 'uploads', tipo);

        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG o PDF.'), false);
    }
};

// Configuración de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('file'); // Usamos .single() ya que subiremos un archivo a la vez

// Ruta POST /api/upload (porque en server.js usas app.use('/api', uploadsRoutes))
router.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
        try {
            // Manejar errores de Multer
            if (err instanceof multer.MulterError) {
                throw new Error(`Error al subir archivo: ${err.message}`);
            } else if (err) {
                throw err;
            }

            // Verificar si se subió un archivo
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se subió ningún archivo'
                });
            }

            // Construir la URL pública del archivo
            const fileUrl = `/uploads/${req.body.tipo || 'temp'}/${req.file.filename}`;

            res.json({
                success: true,
                url: fileUrl,
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size
            });

        } catch (error) {
            console.error('Error en la subida:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al procesar el archivo'
            });
        }
    });
});

module.exports = router;