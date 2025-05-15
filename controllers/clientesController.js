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
      // 1. Manejo seguro de referencias
      let referencias_personales = [];
      let referencias_familiares = [];

      try {
        referencias_personales = req.body.referencias_personales
          ? typeof req.body.referencias_personales === 'string'
            ? JSON.parse(req.body.referencias_personales)
            : req.body.referencias_personales
          : [];

        referencias_familiares = req.body.referencias_familiares
          ? typeof req.body.referencias_familiares === 'string'
            ? JSON.parse(req.body.referencias_familiares)
            : req.body.referencias_familiares
          : [];
      } catch (parseError) {
        console.error('Error parseando referencias:', parseError);
        throw new Error('Formato incorrecto en referencias');
      }

      // 2. Validación mejorada del campo laboral
      let laboral = 0; // Valor por defecto
      if (req.body.trabaja) {
        laboral = (req.body.trabaja === '1' || req.body.trabaja === 'ACTIVO') ? 1 : 0;
      } else if (req.body.laboral) {
        laboral = parseInt(req.body.laboral) === 1 ? 1 : 0;
      }

      // 3. Validación de campos numéricos
      const salario = parseInt(req.body.ingresos?.toString().replace(/\D/g, '')) || 0;

      // 4. Construcción segura del objeto cliente
      const clienteData = {
        ...req.body,
        asesor: req.body.asesor || 'Asesor no asignado',
        salario: salario,
        laboral: laboral,
        empresa: laboral === 1 ? (req.body.empresa || 'NO ESPECIFICADO') : 'NO APLICA',
        cargo: laboral === 1 ? (req.body.cargo || 'NO ESPECIFICADO') : 'NO APLICA',
        pagaduria: laboral === 0 ? (req.body.pagaduria || 'NO ESPECIFICADO') : 'NO APLICA',
        estado_civil: req.body.estadoCivil || 'N/A',
        cedula_pdf: req.body.archivoPDFUrl || null,
        foto_perfil: req.body.fotoPerfilUrl || null,
        desprendible: req.body.desprendibleUrl || null,
        data_credito_pdf: req.body.dataCreditoPdfUrl || null,
        bienes_inmuebles: req.body.bienesInmueblesUrls ? 'si' : 'no',
        data_credito: req.body.dataCreditoPdfUrl ? 'si' : 'no',
        referencias_personales,
        referencias_familiares
      };

      console.log('Datos a insertar:', clienteData); // Para debugging

      // 5. Inserción en la base de datos
      const result = await ClienteModel.insertCliente(clienteData);

      // 6. Respuesta consistente
      res.status(201).json({
        success: true,
        id: result.id_cliente,
        message: 'Cliente creado exitosamente',
        data: {
          nombre: `${req.body.nombre} ${req.body.apellidos}`,
          cedula: req.body.cedula
        }
      });

    } catch (err) {
      console.error('Error detallado al insertar cliente:', {
        message: err.message,
        stack: err.stack,
        bodyReceived: req.body
      });

      // Si el error es por cédula duplicada
      if (err.message.includes('Ya existe un cliente con esa cédula')) {
        return res.status(400).json({
          success: false,
          message: err.message // Esto se mostrará en el frontend
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }

  },

  buscarClientePorCedula: async (req, res) => {
    try {
      const cedula = req.params.cedula;
      const cliente = await ClienteModel.buscarPorCedula(cedula);

      if (cliente) {
        res.json(cliente);
      } else {
        res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }
    } catch (error) {
      console.error('Error al buscar cliente por cédula:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  }
};


module.exports = ClienteController;
