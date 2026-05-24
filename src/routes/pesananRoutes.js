const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// Semua rute pesanan wajib menyertakan token JWT (login terlebih dahulu)
router.use(authenticateJWT);

// CRUD Endpoint Pesanan
router.post('/', pesananController.createPesanan);
router.get('/', pesananController.getAllPesanan);
router.get('/:id', pesananController.getPesananById);
router.put('/:id', pesananController.updatePesananStatus);

// Hanya admin yang bisa menghapus pesanan
router.delete('/:id', authorizeAdmin, pesananController.deletePesanan);

module.exports = router;
