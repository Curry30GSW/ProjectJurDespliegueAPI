// controllers/notificacionController.js
const Notificacion = require('../models/notificacionesModel');

const notificacionController = {
    crearNotificacion: async (req, res) => {
        try {
            const { fecha_notificacion, observaciones, asesor_noticacion, id_embargos } = req.body;

            // Validación básica
            if (!fecha_notificacion || !observaciones || !id_embargos) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos'
                });
            }

            const id_notificacion = await Notificacion.create(
                fecha_notificacion,
                observaciones,
                asesor_noticacion || 'Sistema', // Valor por defecto si no viene
                id_embargos
            );

            res.status(201).json({
                success: true,
                message: 'Notificación creada exitosamente',
                data: { id_notificacion }
            });
        } catch (error) {
            console.error('Error en crearNotificacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear notificación',
                error: error.message
            });
        }
    },

    obtenerNotificacionesPorEmbargo: async (req, res) => {
        try {
            const { id_embargos } = req.params;

            const notificaciones = await Notificacion.findByEmbargoId(id_embargos);

            res.status(200).json({
                success: true,
                data: notificaciones
            });
        } catch (error) {
            console.error('Error en obtenerNotificacionesPorEmbargo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones',
                error: error.message
            });
        }
    },

    obtenerTodasLasNotificaciones: async (req, res) => {
        try {
            const notificaciones = await Notificacion.findAll();
            res.status(200).json({
                success: true,
                data: notificaciones
            });
        } catch (error) {
            console.error('Error en obtenerTodasLasNotificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones',
                error: error.message
            });
        }
    }
};

module.exports = notificacionController;