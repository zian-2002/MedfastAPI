const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');




router.use(authenticateJWT);


router.post('/', pesananController.createPesanan);
router.get('/', pesananController.getAllPesanan);


router.get('/:id', pesananController.getPesananById);
router.put('/:id', pesananController.updatePesananStatus);


router.delete('/:id', authorizeAdmin, pesananController.deletePesanan);

module.exports = router;
