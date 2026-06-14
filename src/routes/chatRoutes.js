const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');




router.use(authenticateJWT);


router.post('/room', chatController.getOrCreateRoom);


router.get('/rooms/:userId', chatController.getUserRooms);


router.get('/messages/:chatId', chatController.getChatMessages);


router.post('/upload', upload.single('gambar'), chatController.uploadChatImage);


router.post('/message', chatController.sendMessage);

module.exports = router;
