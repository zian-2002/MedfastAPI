const express = require('express');
const router = express.Router();
const detailPesananController = require('../controllers/detailPesananController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Detail Pesanan
 *   description: API untuk mengelola detail item pesanan (memerlukan Bearer Token)
 */

// Semua rute detail pesanan wajib menyertakan token JWT
router.use(authenticateJWT);

/**
 * @swagger
 * /detail-pesanan:
 *   post:
 *     summary: Membuat item detail pesanan baru
 *     tags: [Detail Pesanan]
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
 *               - id_obat
 *               - jumlah
 *               - harga_satuan
 *             properties:
 *               id_pesanan:
 *                 type: integer
 *               id_obat:
 *                 type: integer
 *               jumlah:
 *                 type: integer
 *               harga_satuan:
 *                 type: number
 *     responses:
 *       201:
 *         description: Detail pesanan berhasil dibuat
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   get:
 *     summary: Mendapatkan semua daftar detail pesanan
 *     tags: [Detail Pesanan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar detail pesanan
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/', detailPesananController.createDetailPesanan);
router.get('/', detailPesananController.getAllDetailPesanan);

/**
 * @swagger
 * /detail-pesanan/{id}:
 *   get:
 *     summary: Mendapatkan detail pesanan berdasarkan ID detail
 *     tags: [Detail Pesanan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID detail pesanan
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pesanan
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Detail pesanan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui detail pesanan berdasarkan ID detail
 *     tags: [Detail Pesanan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID detail pesanan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jumlah:
 *                 type: integer
 *               harga_satuan:
 *                 type: number
 *     responses:
 *       200:
 *         description: Detail pesanan berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Detail pesanan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus detail pesanan berdasarkan ID detail
 *     tags: [Detail Pesanan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID detail pesanan
 *     responses:
 *       200:
 *         description: Detail pesanan berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Detail pesanan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/:id', detailPesananController.getDetailPesananById);
router.put('/:id', detailPesananController.updateDetailPesanan);
router.delete('/:id', detailPesananController.deleteDetailPesanan);

module.exports = router;
