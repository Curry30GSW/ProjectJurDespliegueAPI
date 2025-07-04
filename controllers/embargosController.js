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


};


module.exports = embargosController;