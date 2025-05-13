const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Primero: usa memoryStorage para leer todo el form-data (incluyendo tipo y cedula)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG o PDF.'), false);
        }
    }
}).single('file');

router.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        try {
            if (err instanceof multer.MulterError) throw new Error(`Multer error: ${err.message}`);
            if (err) throw err;

            const { tipo, cedula } = req.body;

            if (!tipo || !cedula) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan datos requeridos: tipo o cedula'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se subió ningún archivo'
                });
            }

            const ext = path.extname(req.file.originalname);
            const fileName = `${tipo}-${cedula}${ext}`;
            const destFolder = path.join(__dirname, '..', 'uploads', tipo);

            if (!fs.existsSync(destFolder)) {
                fs.mkdirSync(destFolder, { recursive: true });
            }

            const finalPath = path.join(destFolder, fileName);

            // Guarda el archivo desde memoria al disco
            fs.writeFileSync(finalPath, req.file.buffer);

            const fileUrl = `/uploads/${tipo}/${fileName}`;

            return res.json({
                success: true,
                url: fileUrl,
                filename: fileName,
                originalname: req.file.originalname,
                size: req.file.size
            });

        } catch (error) {
            console.error('Error en la subida:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
});

module.exports = router;
