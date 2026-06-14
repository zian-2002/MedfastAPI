const express = require('express');
const router = express.Router();
const obatController = require('../controllers/obatController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');




router.get('/', obatController.getAllObat);


router.get('/:id', obatController.getObatById);



router.post('/', authenticateJWT, authorizeAdmin, upload.single('gambar'), obatController.createObat);
router.put('/:id', authenticateJWT, authorizeAdmin, upload.single('gambar'), obatController.updateObat);
router.delete('/:id', authenticateJWT, authorizeAdmin, obatController.deleteObat);

module.exports = router;