const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const embargosController = require('../controllers/embargosController');

router.get('/clientes-embargos', embargosController.listarClientesConEmbargos);

router.get('/cliente-embargos/:cedula', embargosController.obtenerClientePorCedula);


module.exports = router;