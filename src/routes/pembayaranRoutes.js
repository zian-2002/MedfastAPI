const express = require('express');
const router = express.Router();
const pembayaranController = require('../controllers/pembayaranController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// Semua rute pembayaran wajib menyertakan token JWT
router.use(authenticateJWT);

// CRUD Endpoint Pembayaran
router.post('/', pembayaranController.createPembayaran);
router.get('/', pembayaranController.getAllPembayaran);
router.get('/:id', pembayaranController.getPembayaranById);
router.put('/:id', pembayaranController.updatePembayaran);

// Hanya admin yang dapat menghapus catatan pembayaran
router.delete('/:id', authorizeAdmin, pembayaranController.deletePembayaran);

module.exports = router;
