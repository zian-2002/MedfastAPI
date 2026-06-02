const express = require('express');
const router = express.Router();
const pembayaranController = require('../controllers/pembayaranController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Pembayaran
 *   description: API untuk mengelola transaksi pembayaran (memerlukan Bearer Token)
 */

// Semua rute pembayaran wajib menyertakan token JWT
router.use(authenticateJWT);

/**
 * @swagger
 * /pembayaran:
 *   post:
 *     summary: Mencatat transaksi pembayaran baru
 *     tags: [Pembayaran]
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
 *               - jumlah_bayar
 *               - metode_pembayaran
 *             properties:
 *               id_pesanan:
 *                 type: integer
 *               jumlah_bayar:
 *                 type: number
 *               metode_pembayaran:
 *                 type: string
 *                 enum: [COD, Transfer]
 *     responses:
 *       201:
 *         description: Transaksi pembayaran berhasil dicatat
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   get:
 *     summary: Mendapatkan daftar semua catatan pembayaran
 *     tags: [Pembayaran]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pembayaran
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/', pembayaranController.createPembayaran);
router.get('/', pembayaranController.getAllPembayaran);

/**
 * @swagger
 * /pembayaran/{id}:
 *   get:
 *     summary: Mendapatkan detail pembayaran berdasarkan ID pembayaran
 *     tags: [Pembayaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pembayaran
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pembayaran
 *       400:
 *         description: ID pembayaran tidak valid
 *       404:
 *         description: Catatan pembayaran tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui status/catatan pembayaran berdasarkan ID pembayaran
 *     tags: [Pembayaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pembayaran
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status_pembayaran:
 *                 type: string
 *     responses:
 *       200:
 *         description: Catatan pembayaran berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Catatan pembayaran tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus catatan pembayaran berdasarkan ID pembayaran (Hanya Admin)
 *     tags: [Pembayaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pembayaran
 *     responses:
 *       200:
 *         description: Catatan pembayaran berhasil dihapus
 *       400:
 *         description: ID pembayaran tidak valid
 *       404:
 *         description: Catatan pembayaran tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/:id', pembayaranController.getPembayaranById);
router.put('/:id', pembayaranController.updatePembayaran);

// Hanya admin yang dapat menghapus catatan pembayaran
router.delete('/:id', authorizeAdmin, pembayaranController.deletePembayaran);

module.exports = router;
