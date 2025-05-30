const insolvenciaModel = require('../models/insolvenciasModel');

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


};

module.exports = insolvenciaController;