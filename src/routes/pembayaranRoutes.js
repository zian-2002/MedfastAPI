const express = require('express');
const router = express.Router();
const pembayaranController = require('../controllers/pembayaranController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');




router.post('/notification', pembayaranController.handleMidtransNotification);


router.use(authenticateJWT);


router.post('/snap-token', pembayaranController.getSnapToken);


router.post('/', pembayaranController.createPembayaran);
router.get('/', pembayaranController.getAllPembayaran);


router.get('/:id', pembayaranController.getPembayaranById);
router.put('/:id', pembayaranController.updatePembayaran);


router.delete('/:id', authorizeAdmin, pembayaranController.deletePembayaran);

module.exports = router;
