const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/uploadMiddleware');

// Proteksi semua endpoint chat menggunakan JWT
router.use(authenticateJWT);

// Endpoint untuk mendapatkan/membuat room chat
router.post('/room', chatController.getOrCreateRoom);

// Endpoint untuk mendapatkan daftar room chat milik user
router.get('/rooms/:userId', chatController.getUserRooms);

// Endpoint untuk mendapatkan riwayat pesan dalam room chat
router.get('/messages/:chatId', chatController.getChatMessages);

// Endpoint untuk mengupload gambar chat
router.post('/upload', upload.single('gambar'), chatController.uploadChatImage);

module.exports = router;
