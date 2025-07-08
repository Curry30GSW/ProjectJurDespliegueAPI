const embargosModel = require('../models/embargosModel');
const path = require('path');
const fs = require('fs');
const uploadPDF = require('../middlewares/uploadPDF');

const embargosController = {

    listarClientesConEmbargos: async (req, res) => {
        try {
            const embargos = await embargosModel.getAllClienteEmbargos();
            res.json(embargos);
        } catch (error) {
            console.error('Error al obtener los embargos:', error);
            res.status(500).json({ error: 'Error al obtener los embargos' });
        }
    },

    obtenerClientePorCedula: async (req, res) => {
        const { cedula } = req.params;

        try {
            const cliente = await embargosModel.getClientelByCedula(cedula);

            if (!cliente) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            res.json(cliente);
        } catch (error) {
            console.error('Error en el controlador al obtener cliente por cédula:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },

    getEmbargoForEdit: async (req, res) => {
        try {
            const { id_embargos } = req.params;

            if (!id_embargos) {
                return res.status(400).json({ message: 'ID de embargo es requerido' });
            }

            const embargo = await embargosModel.getEmbargoById(id_embargos);

            if (!embargo) {
                return res.status(404).json({ message: 'Embargo no encontrado' });
            }

            res.json(embargo);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener todos los embargos de un cliente (opcional)
    getEmbargosByCliente: async (req, res) => {
        try {
            const { id_cliente } = req.params;

            if (!id_cliente) {
                return res.status(400).json({ message: 'ID de cliente es requerido' });
            }

            const embargos = await embargosModel.getEmbargosByCliente(id_cliente);
            res.json(embargos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Actualizar un embargo específico
    updateEmbargo: async (req, res) => {
        try {
            const { id_embargos } = req.params;
            const embargoData = req.body;

            if (!id_embargos) {
                return res.status(400).json({ message: 'ID de embargo es requerido' });
            }

            // Validación básica de datos
            if (!embargoData.radicado) {
                return res.status(400).json({ message: 'El campo radicado es obligatorio' });
            }

            // Asignar el asesor que realiza la modificación
            embargoData.asesor_embargo = embargoData.nombreUsuario || 'Sistema';

            const updated = await embargosModel.updateEmbargo(id_embargos, embargoData);

            if (!updated) {
                return res.status(404).json({ message: 'No se pudo actualizar el embargo' });
            }

            res.json({
                success: true,
                message: 'Embargo actualizado correctamente',
                id_embargos: id_embargos
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    listarClientesConEmbargosAceptados: async (req, res) => {
        try {
            const embargos = await embargosModel.getAllClienteEmbargosAceptados();
            res.json(embargos);
        } catch (error) {
            console.error('Error al obtener los embargos aceptados:', error);
            res.status(500).json({ error: 'Error al obtener los embargos aceptados' });
        }
    },

    subirDocumento: async (req, res) => {
        try {
            const { id_embargos, estado_embargo } = req.body;

            if (!req.file) {
                return res.status(400).json({ message: 'No se adjuntó ningún archivo.' });
            }

            const rutaDocumento = req.file.storedPath;

            // Obtener fecha actual (restando 5 horas para hora local)
            const ahora = new Date();
            const fechaLocal = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);

            // Fecha del desprendible: ahora
            const fechaDesprendible = fechaLocal.toISOString().slice(0, 19).replace('T', ' ');

            // Fecha de terminación: 4 meses después
            const fechaTerminacionObj = new Date(fechaLocal);
            fechaTerminacionObj.setMonth(fechaTerminacionObj.getMonth() + 4);
            const fechaTerminacion = fechaTerminacionObj.toISOString().slice(0, 19).replace('T', ' ');

            console.log('➡️ Enviando a modelo:', {
                id_embargos,
                rutaDocumento,
                fechaDesprendible,
                fechaTerminacion,
                estado_embargo
            });

            await embargosModel.saveDocumentData(
                id_embargos,
                rutaDocumento,
                fechaDesprendible,
                fechaTerminacion,
                estado_embargo
            );

            res.status(200).json({ message: 'Documento guardado correctamente.' });

        } catch (error) {
            console.error('Error en subirDocumento:', error);
            res.status(500).json({ message: 'Error al guardar el documento.' });
        }
    },

    insertarConValidacion: async (req, res) => {
        const embargoData = req.body;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const existingEmbargos = await EmbargosModel.verificarEmbargosPorCliente(embargoData.id_cliente);

            if (existingEmbargos.length > 0) {
                console.log(`Ya existen ${existingEmbargos.length} embargos para el cliente ${embargoData.id_cliente}`);
            }

            const id_embargo = await EmbargosModel.insertarEmbargo(embargoData);

            await connection.commit();
            res.status(200).json({
                mensaje: existingEmbargos.length > 0
                    ? 'Ya existía embargo. Se creó uno nuevo.'
                    : 'Embargo creado correctamente.',
                id_embargo
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error al insertar embargo:', error);
            res.status(500).json({ error: 'Error al insertar embargo.' });
        } finally {
            connection.release();
        }
    }



};


module.exports = embargosController;