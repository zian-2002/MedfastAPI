const express = require('express');
const router = express.Router();
const stokObatController = require('../controllers/stokObatController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');




router.get('/', stokObatController.getAllStokObat);


router.post('/', authenticateJWT, authorizeAdmin, stokObatController.createStokObat);
router.put('/:id', authenticateJWT, authorizeAdmin, stokObatController.updateStokObat);
router.delete('/:id', authenticateJWT, authorizeAdmin, stokObatController.deleteStokObat);

module.exports = router;
