const express = require('express');
const router = express.Router();
const apotekController = require('../controllers/apotekController');




router.get('/', apotekController.getAllApotek);
router.put('/:id', apotekController.updateApotek);

module.exports = router;
