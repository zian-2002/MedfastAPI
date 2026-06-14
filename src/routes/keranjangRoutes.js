const express = require('express');
const router = express.Router();
const keranjangController = require('../controllers/keranjangController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Keranjang
 *   description: API untuk mengelola keranjang belanja obat (memerlukan Bearer Token)
 */

// Seluruh endpoint keranjang wajib terotentikasi menggunakan token JWT
router.use(authenticateJWT);

/**
 * @swagger
 * /keranjang:
 *   get:
 *     summary: Mendapatkan semua item di keranjang belanja pengguna saat ini
 *     tags: [Keranjang]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar keranjang belanja
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Menambahkan produk obat ke keranjang belanja
 *     tags: [Keranjang]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_obat
 *               - jumlah
 *             properties:
 *               id_obat:
 *                 type: integer
 *               jumlah:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Berhasil menambahkan atau memperbarui item di keranjang
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Mengosongkan seluruh isi keranjang belanja pengguna saat ini
 *     tags: [Keranjang]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Keranjang belanja berhasil dikosongkan
 *       400:
 *         description: Gagal mengosongkan keranjang
 *       500:
 *         description: Kesalahan server internal
 */
router.route('/')
    .get(keranjangController.getKeranjang)
    .post(keranjangController.addToKeranjang)
    .delete(keranjangController.clearKeranjang);

/**
 * @swagger
 * /keranjang/{id}:
 *   put:
 *     summary: Memperbarui kuantitas item obat di keranjang belanja
 *     tags: [Keranjang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID baris item keranjang (id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jumlah
 *             properties:
 *               jumlah:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Kuantitas item keranjang berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Item keranjang tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus satu item obat tertentu dari keranjang belanja
 *     tags: [Keranjang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID baris item keranjang (id)
 *     responses:
 *       200:
 *         description: Item keranjang berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Item keranjang tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
router.route('/:id')
    .put(keranjangController.updateKeranjangQuantity)
    .delete(keranjangController.deleteFromKeranjang);

module.exports = router;
