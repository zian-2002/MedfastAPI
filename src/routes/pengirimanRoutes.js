const express = require('express');
const router = express.Router();
const pengirimanController = require('../controllers/pengirimanController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Pengiriman
 *   description: API untuk mengelola status pengiriman pesanan (memerlukan Bearer Token)
 */

// Semua rute pengiriman wajib menyertakan token JWT
router.use(authenticateJWT);

/**
 * @swagger
 * /pengiriman:
 *   post:
 *     summary: Membuat catatan pengiriman baru
 *     tags: [Pengiriman]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_pesanan
 *               - kurir
 *               - no_resi
 *             properties:
 *               id_pesanan:
 *                 type: integer
 *               kurir:
 *                 type: string
 *               no_resi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pengiriman berhasil dicatat
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   get:
 *     summary: Mendapatkan semua catatan pengiriman
 *     tags: [Pengiriman]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pengiriman
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/', pengirimanController.createPengiriman);
router.get('/', pengirimanController.getAllPengiriman);

/**
 * @swagger
 * /pengiriman/{id}:
 *   get:
 *     summary: Mendapatkan detail pengiriman berdasarkan ID pengiriman
 *     tags: [Pengiriman]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengiriman
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pengiriman
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Catatan pengiriman tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui status/catatan pengiriman berdasarkan ID pengiriman
 *     tags: [Pengiriman]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengiriman
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status_pengiriman:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status pengiriman berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Catatan pengiriman tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus catatan pengiriman berdasarkan ID pengiriman (Hanya Admin)
 *     tags: [Pengiriman]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengiriman
 *     responses:
 *       200:
 *         description: Catatan pengiriman berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Catatan pengiriman tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/:id', pengirimanController.getPengirimanById);
router.put('/:id', pengirimanController.updatePengiriman);

// Hanya admin yang dapat menghapus catatan pengiriman
router.delete('/:id', authorizeAdmin, pengirimanController.deletePengiriman);

module.exports = router;
