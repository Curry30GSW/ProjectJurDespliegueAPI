const ClienteModel = require('../models/clientesModel');

const ClienteController = {

  listarClientes: async (req, res) => {
    try {
      const clientes = await ClienteModel.getAllClientes();
      res.json(clientes);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  },


  agregarCliente: async (req, res) => {
    try {
      const clienteData = req.body;

      if (!clienteData.nombres || !clienteData.apellidos || !clienteData.cedula) {
        return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
      }

      const result = await ClienteModel.insertCliente(clienteData);

      res.status(201).json({
        mensaje: 'Cliente agregado exitosamente',
        clienteInsertado: result
      });
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  }
};

module.exports = ClienteController;
