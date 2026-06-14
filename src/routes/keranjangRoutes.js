const express = require('express');
const router = express.Router();
const keranjangController = require('../controllers/keranjangController');
const { authenticateJWT } = require('../middlewares/authMiddleware');




router.use(authenticateJWT);


router.route('/')
    .get(keranjangController.getKeranjang)
    .post(keranjangController.addToKeranjang)
    .delete(keranjangController.clearKeranjang);


router.route('/:id')
    .put(keranjangController.updateKeranjangQuantity)
    .delete(keranjangController.deleteFromKeranjang);

module.exports = router;
