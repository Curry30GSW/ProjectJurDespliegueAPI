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
    }



};


module.exports = embargosController;