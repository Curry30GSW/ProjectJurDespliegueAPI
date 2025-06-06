const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const insolvenciaController = require('../controllers/insolvenciasController');


router.get('/clientes-insolvencias', insolvenciaController.listarClientesConInsolvencia);

router.put('/actualizar-insolvencias', insolvenciaController.actualizarInsolvencia);

router.get('/insolvencia/cedula/:cedula', insolvenciaController.obtenerInsolvenciaPorCedula);


module.exports = router;