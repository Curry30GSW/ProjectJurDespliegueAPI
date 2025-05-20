const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clientesController');
const editUpload = require('./uploadsRoutes');

router.get('/clientes', ClienteController.listarClientes);
router.post('/insert-clientes', ClienteController.agregarCliente);
router.get('/clientes/:cedula', ClienteController.buscarClientePorCedula);
router.put('/clientes/:cedula', editUpload, ClienteController.actualizarCliente);

module.exports = router;