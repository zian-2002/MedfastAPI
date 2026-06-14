const express = require('express');
const router = express.Router();
const detailPesananController = require('../controllers/detailPesananController');
const { authenticateJWT } = require('../middlewares/authMiddleware');




router.use(authenticateJWT);


router.post('/', detailPesananController.createDetailPesanan);
router.get('/', detailPesananController.getAllDetailPesanan);


router.get('/:id', detailPesananController.getDetailPesananById);
router.put('/:id', detailPesananController.updateDetailPesanan);
router.delete('/:id', detailPesananController.deleteDetailPesanan);

module.exports = router;
