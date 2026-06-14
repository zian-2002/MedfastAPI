const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API untuk fitur chat/komunikasi real-time (memerlukan Bearer Token)
 */

// Proteksi semua endpoint chat menggunakan JWT
router.use(authenticateJWT);

/**
 * @swagger
 * /chat/room:
 *   post:
 *     summary: Mendapatkan atau membuat room chat antara user dan apotek/admin
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_user_1
 *               - id_user_2
 *             properties:
 *               id_user_1:
 *                 type: string
 *               id_user_2:
 *                 type: string
 *     responses:
 *       200:
 *         description: Room chat berhasil ditemukan atau dibuat
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/room', chatController.getOrCreateRoom);

/**
 * @swagger
 * /chat/rooms/{userId}:
 *   get:
 *     summary: Mendapatkan semua daftar room chat milik pengguna tertentu
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pengguna
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar room chat
 *       400:
 *         description: ID tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/rooms/:userId', chatController.getUserRooms);

/**
 * @swagger
 * /chat/messages/{chatId}:
 *   get:
 *     summary: Mendapatkan semua riwayat pesan dari room chat tertentu
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID room chat (chatId)
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan riwayat pesan
 *       400:
 *         description: ID room chat tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/messages/:chatId', chatController.getChatMessages);

/**
 * @swagger
 * /chat/upload:
 *   post:
 *     summary: Mengunggah gambar/foto di dalam chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - gambar
 *             properties:
 *               gambar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Gambar berhasil diunggah dan mengembalikan URL gambar
 *       400:
 *         description: Gagal mengunggah gambar
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/upload', upload.single('gambar'), chatController.uploadChatImage);

/**
 * @swagger
 * /chat/message:
 *   post:
 *     summary: Mengirim pesan baru ke room chat tertentu (dan memancarkan via Socket.io)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_chat
 *               - id_pengirim
 *               - pesan
 *             properties:
 *               id_chat:
 *                 type: integer
 *               id_pengirim:
 *                 type: integer
 *               pesan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pesan berhasil dikirim
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/message', chatController.sendMessage);

module.exports = router;
