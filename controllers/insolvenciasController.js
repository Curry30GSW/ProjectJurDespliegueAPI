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

            const {
                id_cliente,
                cuadernillo,
                radicacion,
                correcciones,
                desprendible,
                tipo_proceso,
                juzgado,
                nombre_liquidador,
                telefono_liquidador,
                correo_liquidador,
                pago_liquidador,
                terminacion,
                motivo_insolvencia,
                asesor_insolvencia
            } = req.body;

            let ruta_pdf = null;

            try {
                // Si se subió el archivo, guardarlo en disco
                if (req.file) {
                    const nombreArchivo = `Acta-ID-${id_cliente}.pdf`;
                    const carpetaDestino = path.join(__dirname, '..', 'uploads', 'acta-aceptacion');
                    if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                    const rutaCompleta = path.join(carpetaDestino, nombreArchivo);
                    fs.writeFileSync(rutaCompleta, req.file.buffer);
                    ruta_pdf = `/uploads/acta-aceptacion/${nombreArchivo}`;
                }

                // 1. Actualizar datos de insolvencia
                const resultado = await insolvenciaModel.updateInsolvenciaData({
                    id_cliente,
                    cuadernillo,
                    radicacion,
                    correcciones,
                    acta_aceptacion: ruta_pdf,
                    desprendible,
                    tipo_proceso,
                    juzgado,
                    nombre_liquidador,
                    telefono_liquidador,
                    correo_liquidador,
                    pago_liquidador,
                    terminacion,
                    motivo_insolvencia,
                    asesor_insolvencia
                });


                // 2. Si se actualizó correctamente, procesar audiencias
                if (resultado.affectedRows > 0 && resultado.id_insolvencia) {
                    const id_insolvencia = resultado.id_insolvencia;

                    let audienciasArray = [];

                    // Intentar parsear audiencias (si llegan como JSON string)
                    if (typeof req.body.audiencias === 'string') {
                        try {
                            audienciasArray = JSON.parse(req.body.audiencias);
                        } catch (e) {
                            console.warn('No se pudo parsear audiencias:', e.message);
                        }
                    } else if (Array.isArray(req.body.audiencias)) {
                        audienciasArray = req.body.audiencias;
                    }

                    // Filtrar y mapear audiencias válidas
                    const audienciasLimpias = audienciasArray
                        .filter(a => a.descripcion && a.fecha)
                        .map(a => ({
                            audiencia: a.descripcion,
                            fecha_audiencias: a.fecha,
                            id_insolvencia
                        }));
                    if (audienciasLimpias.length > 0) {
                        await insolvenciaModel.insertarAudiencias(id_insolvencia, audienciasLimpias);

                    }

                    res.status(200).json({
                        success: true,
                        message: 'Datos de insolvencia y audiencias guardados correctamente.'
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        message: 'No se encontró el cliente para actualizar.'
                    });
                }
            } catch (error) {
                console.error('Error al actualizar insolvencia:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno al actualizar insolvencia.'
                });
            }
        });
    },

    obtenerInsolvenciaPorCedula: async (req, res) => {
        const { cedula } = req.params;

        if (!cedula) {
            return res.status(400).json({ success: false, message: 'La cédula es requerida.' });
        }

        try {
            const datos = await insolvenciaModel.getClienteInsolByCedula(cedula);

            if (!datos) {
                return res.status(404).json({ success: false, message: 'No se encontró información para esta cédula.' });
            }

            res.status(200).json({ success: true, data: datos });
        } catch (error) {
            console.error('Error al obtener insolvencia por cédula:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    },



};

module.exports = insolvenciaController;
