const express = require('express');
const router = express.Router();
const detailPesananController = require('../controllers/detailPesananController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Semua rute detail pesanan wajib menyertakan token JWT
router.use(authenticateJWT);

// CRUD Endpoint Detail Pesanan
router.post('/', detailPesananController.createDetailPesanan);
router.get('/', detailPesananController.getAllDetailPesanan);
router.get('/:id', detailPesananController.getDetailPesananById);
router.put('/:id', detailPesananController.updateDetailPesanan);
router.delete('/:id', detailPesananController.deleteDetailPesanan);

module.exports = router;
