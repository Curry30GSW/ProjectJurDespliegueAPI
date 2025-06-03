const insolvenciaModel = require('../models/insolvenciasModel');
const path = require('path');
const fs = require('fs');
const uploadPDF = require('../middlewares/uploadPDF');


const insolvenciaController = {

    listarClientesConInsolvencia: async (req, res) => {
        try {
            const clientes = await insolvenciaModel.getAllClienteInsol();
            res.status(200).json(clientes);
        } catch (error) {
            console.error('Error en el controlador al listar clientes con Insolvencia:', error);
            res.status(500).json({ error: 'Ocurrió un error al obtener los datos.' });
        }
    },


    actualizarInsolvencia: (req, res) => {
        uploadPDF(req, res, async (err) => {
            if (err) {
                console.error('Error en la subida del archivo:', err.message);
                return res.status(400).json({ success: false, message: err.message });
            }

            const { id_cliente, cuadernillo, radicacion, correcciones, acta_aceptacion } = req.body;
            let ruta_pdf = null;

            try {
                if (req.file) {
                    const nombreArchivo = `Acta-ID-${id_cliente}.pdf`;
                    const carpetaDestino = path.join(__dirname, '..', 'uploads', 'acta-aceptacion');
                    if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                    const rutaCompleta = path.join(carpetaDestino, nombreArchivo);
                    fs.writeFileSync(rutaCompleta, req.file.buffer);
                    ruta_pdf = `/uploads/acta-aceptacion/${nombreArchivo}`;
                }

                // Actualizar tabla insolvencia
                const resultado = await insolvenciaModel.updateInsolvenciaData({
                    id_cliente,
                    cuadernillo,
                    radicacion,
                    correcciones,
                    acta_aceptacion: ruta_pdf
                });

                // Si se actualizó correctamente, guardar audiencias
                if (resultado.affectedRows > 0) {
                    const audiencias = [];
                    // Recorre todas las claves del body y busca los campos de audiencia
                    Object.keys(req.body).forEach(key => {
                        const match = key.match(/^audiencias\[(\d+)\]\[(descripcion|fecha)\]$/);
                        if (match) {
                            const index = match[1];
                            const field = match[2];

                            if (!audiencias[index]) audiencias[index] = {};
                            if (field === 'descripcion') audiencias[index].audiencia = req.body[key];
                            if (field === 'fecha') audiencias[index].fecha_audiencias = req.body[key];
                        }
                    });

                    // Limpia nulls/undefineds por si hay huecos
                    const audienciasLimpias = audiencias.filter(a => a && a.audiencia && a.fecha_audiencias);

                    if (audienciasLimpias.length > 0) {
                        await insolvenciaModel.insertarAudiencias(id_cliente, audienciasLimpias);
                    }

                    res.status(200).json({ success: true, message: 'Datos de insolvencia y audiencias guardados correctamente.' });
                } else {
                    res.status(404).json({ success: false, message: 'No se encontró el cliente para actualizar.' });
                }

            } catch (error) {
                console.error('Error al actualizar insolvencia:', error);
                res.status(500).json({ success: false, message: 'Error al actualizar insolvencia.' });
            }
        });
    }

};

module.exports = insolvenciaController;
