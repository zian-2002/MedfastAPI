const express = require('express');
const router = express.Router();
const pengirimanController = require('../controllers/pengirimanController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');




router.use(authenticateJWT);


router.post('/', pengirimanController.createPengiriman);
router.get('/', pengirimanController.getAllPengiriman);


router.get('/:id', pengirimanController.getPengirimanById);
router.put('/:id', pengirimanController.updatePengiriman);


router.delete('/:id', authorizeAdmin, pengirimanController.deletePengiriman);

module.exports = router;
