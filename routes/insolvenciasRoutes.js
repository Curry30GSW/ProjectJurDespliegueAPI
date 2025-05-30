const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const insolvenciaController = require('../controllers/insolvenciasController');


router.get('/clientes-insolvencias', insolvenciaController.listarClientesConInsolvencia);


module.exports = router;