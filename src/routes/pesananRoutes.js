const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Pesanan
 *   description: API untuk mengelola transaksi pesanan (memerlukan Bearer Token)
 */

// Semua rute pesanan wajib menyertakan token JWT (login terlebih dahulu)
router.use(authenticateJWT);

/**
 * @swagger
 * /pesanan:
 *   post:
 *     summary: Membuat pesanan baru
 *     tags: [Pesanan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_apotek
 *               - total_harga
 *               - detail_items
 *             properties:
 *               id_apotek:
 *                 type: integer
 *               total_harga:
 *                 type: number
 *               status_pesanan:
 *                 type: string
 *                 default: menunggu
 *               detail_items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_obat
 *                     - jumlah
 *                     - harga_satuan
 *                   properties:
 *                     id_obat:
 *                       type: integer
 *                     jumlah:
 *                       type: integer
 *                     harga_satuan:
 *                       type: number
 *     responses:
 *       201:
 *         description: Pesanan berhasil dibuat
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   get:
 *     summary: Mendapatkan semua daftar pesanan pengguna saat ini
 *     tags: [Pesanan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pesanan
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/', pesananController.createPesanan);
router.get('/', pesananController.getAllPesanan);

/**
 * @swagger
 * /pesanan/{id}:
 *   get:
 *     summary: Mendapatkan detail pesanan berdasarkan ID
 *     tags: [Pesanan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pesanan
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pesanan
 *       400:
 *         description: ID pesanan tidak valid
 *       404:
 *         description: Pesanan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui status pesanan berdasarkan ID
 *     tags: [Pesanan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pesanan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status_pesanan
 *             properties:
 *               status_pesanan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status pesanan berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Pesanan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus pesanan berdasarkan ID (Hanya Admin)
 *     tags: [Pesanan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pesanan
 *     responses:
 *       200:
 *         description: Pesanan berhasil dihapus
 *       400:
 *         description: ID pesanan tidak valid
 *       404:
 *         description: Pesanan tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/:id', pesananController.getPesananById);
router.put('/:id', pesananController.updatePesananStatus);

// Hanya admin yang bisa menghapus pesanan
router.delete('/:id', authorizeAdmin, pesananController.deletePesanan);

module.exports = router;
