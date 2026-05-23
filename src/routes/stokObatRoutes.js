const express = require('express');
const router = express.Router();
const stokObatController = require('../controllers/stokObatController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// Endpoint public (Bisa diakses tanpa token)
router.get('/', stokObatController.getAllStokObat);

// Endpoint private (Hanya Admin yang bisa menambah, mengubah, dan menghapus)
router.post('/', authenticateJWT, authorizeAdmin, stokObatController.createStokObat);
router.put('/:id', authenticateJWT, authorizeAdmin, stokObatController.updateStokObat);
router.delete('/:id', authenticateJWT, authorizeAdmin, stokObatController.deleteStokObat);

module.exports = router;
