const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clientesController');

router.get('/clientes', ClienteController.listarClientes);
router.post('/insert-clientes', ClienteController.agregarCliente);
router.get('/clientes/:cedula', ClienteController.buscarClientePorCedula);

module.exports = router;