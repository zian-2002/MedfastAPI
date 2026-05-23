const express = require('express');
const router = express.Router();
const obatController = require('../controllers/obatController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Endpoint public (Bisa diakses tanpa token)
router.get('/', obatController.getAllObat);
router.get('/:id', obatController.getObatById);

// Endpoint private (Hanya Admin yang bisa menambah, mengubah, dan menghapus)
// `upload.single('gambar')` digunakan untuk menangkap file dari form-data dengan field 'gambar'
router.post('/', authenticateJWT, authorizeAdmin, upload.single('gambar'), obatController.createObat);
router.put('/:id', authenticateJWT, authorizeAdmin, upload.single('gambar'), obatController.updateObat);
router.delete('/:id', authenticateJWT, authorizeAdmin, obatController.deleteObat);

module.exports = router;
