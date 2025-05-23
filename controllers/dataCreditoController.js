const dataCreditoModel = require('../models/dataCreditoModel');

const dataCreditoController = {

    // Listar todos los clientes con su información de DataCrédito
    listarClientesConDataCredito: async (req, res) => {
        try {
            const clientes = await dataCreditoModel.getAllClienteData();
            res.status(200).json(clientes);
        } catch (error) {
            console.error('Error en el controlador al listar clientes con DataCrédito:', error);
            res.status(500).json({ error: 'Ocurrió un error al obtener los datos.' });
        }
    },

    subirDocumento: async (req, res) => {
        try {
            const cedula = req.body.cedula;

            if (!req.file) {
                return res.status(400).json({ message: 'No se adjuntó ningún archivo.' });
            }

            const rutaDocumento = req.file.storedPath;
            const ahora = new Date();
            const fechaLocal = new Date(ahora.getTime() - 5 * 60 * 60 * 1000); // Resta 5 horas
            const fechaAdjunto = fechaLocal.toISOString().slice(0, 19).replace('T', ' ');


            await dataCreditoModel.saveDocumentData(cedula, rutaDocumento, fechaAdjunto);

            res.status(200).json({ message: 'Documento guardado correctamente.' });
        } catch (error) {
            console.error('Error en subirDocumento:', error);
            res.status(500).json({ message: 'Error al guardar el documento.' });
        }
    }



};

module.exports = dataCreditoController;
