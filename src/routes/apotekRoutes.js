const express = require('express');
const router = express.Router();
const apotekController = require('../controllers/apotekController');

// Endpoint public (Bisa diakses tanpa token)
router.get('/', apotekController.getAllApotek);

module.exports = router;
