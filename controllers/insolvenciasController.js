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
                fecha_cuadernillo,
                radicacion,
                fecha_radicacion,
                correcciones,
                tipo_proceso,
                juzgado,
                nombre_liquidador,
                telefono_liquidador,
                correo_liquidador,
                pago_liquidador,
                terminacion,
                motivo_insolvencia,
                asesor_insolvencia,
                datos_desprendible
            } = req.body;

            let ruta_pdf = null;
            let desprendibleData = {};

            try {
                if (req.files) {
                    // Procesar archivoPDF (Acta de aceptación)
                    if (req.files['archivoPDF'] && req.files['archivoPDF'][0]) {
                        const archivo = req.files['archivoPDF'][0];
                        const nombreArchivo = `Acta-ID-${id_cliente}.pdf`;
                        const carpetaDestino = path.join(__dirname, '..', 'uploads', 'acta-aceptacion');
                        if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                        const rutaCompleta = path.join(carpetaDestino, nombreArchivo);
                        fs.writeFileSync(rutaCompleta, archivo.buffer);
                        ruta_pdf = `/uploads/acta-aceptacion/${nombreArchivo}`;
                    }

                    // Procesar desprendiblePDF
                    if (req.files['desprendiblePDF'] && req.files['desprendiblePDF'][0]) {
                        const desprendible = req.files['desprendiblePDF'][0];
                        const nombreDesprendible = `Desprendible-ID-${id_cliente}.pdf`;
                        const carpetaDestino = path.join(__dirname, '..', 'uploads', 'desprendibles');
                        if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                        const rutaCompleta = path.join(carpetaDestino, nombreDesprendible);
                        fs.writeFileSync(rutaCompleta, desprendible.buffer);

                        // Parsear datos_desprendible si existe
                        try {
                            desprendibleData = datos_desprendible ? JSON.parse(datos_desprendible) : {};
                            desprendibleData.desprendible = `/uploads/desprendibles/${nombreDesprendible}`;
                        } catch (e) {
                            console.error('Error al parsear datos_desprendible:', e);
                        }
                    }
                }

                // 1. Actualizar datos de insolvencia
                const resultado = await insolvenciaModel.updateInsolvenciaData({
                    id_cliente,
                    cuadernillo,
                    fecha_cuadernillo,
                    radicacion,
                    fecha_radicacion,
                    correcciones,
                    acta_aceptacion: ruta_pdf,
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

                // 2. Si se actualizó correctamente, procesar audiencias y desprendibles
                if (resultado.affectedRows > 0 && resultado.id_insolvencia) {
                    const id_insolvencia = resultado.id_insolvencia;

                    // AUDIENCIAS
                    let audienciasArray = [];
                    if (typeof req.body.audiencias === 'string') {
                        try {
                            audienciasArray = JSON.parse(req.body.audiencias);
                        } catch (e) {
                            console.warn('No se pudo parsear audiencias:', e.message);
                        }
                    } else if (Array.isArray(req.body.audiencias)) {
                        audienciasArray = req.body.audiencias;
                    }

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

                    // DESPRENDIBLES (usando los datos procesados)
                    if (Object.keys(desprendibleData).length > 0) {
                        const desprendibleLimpio = {
                            estado_desprendible: desprendibleData.estado || '',
                            desprendible: desprendibleData.desprendible || null,
                            obs_desprendible: desprendibleData.obs_desprendible || '',
                            cuota_pagar: desprendibleData.datos_parcial?.cuota_pagar || ''
                        };

                        await insolvenciaModel.insertarDesprendibles(id_insolvencia, [desprendibleLimpio]);
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Datos de insolvencia, audiencias y desprendibles guardados correctamente.'
                    });
                } else {
                    return res.status(404).json({
                        success: false,
                        message: 'No se encontró el cliente para actualizar.'
                    });
                }
            } catch (error) {
                console.error('Error al actualizar insolvencia:', error);
                return res.status(500).json({
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
