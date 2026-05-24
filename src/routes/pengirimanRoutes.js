const express = require('express');
const router = express.Router();
const pengirimanController = require('../controllers/pengirimanController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// Semua rute pengiriman wajib menyertakan token JWT
router.use(authenticateJWT);

// CRUD Endpoint Pengiriman
router.post('/', pengirimanController.createPengiriman);
router.get('/', pengirimanController.getAllPengiriman);
router.get('/:id', pengirimanController.getPengirimanById);
router.put('/:id', pengirimanController.updatePengiriman);

// Hanya admin yang dapat menghapus catatan pengiriman
router.delete('/:id', authorizeAdmin, pengirimanController.deletePengiriman);

module.exports = router;
