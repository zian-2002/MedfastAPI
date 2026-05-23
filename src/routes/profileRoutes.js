const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Semua rute profile WAJIB menyertakan token JWT (login terlebih dahulu)
router.use(authenticateJWT);

// Endpoint profile
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/change-password', profileController.changePassword);

module.exports = router;
