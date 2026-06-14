const express = require('express');
const router = express.Router();
const obatController = require('../controllers/obatController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   name: Obat
 *   description: API untuk mengelola data obat
 */

/**
 * @swagger
 * /obat:
 *   get:
 *     summary: Mendapatkan semua data obat
 *     tags: [Obat]
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar obat
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Menambah data obat baru (Hanya Admin)
 *     tags: [Obat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama_obat
 *               - kategori
 *               - harga
 *             properties:
 *               nama_obat:
 *                 type: string
 *               kategori:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *               harga:
 *                 type: number
 *               gambar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Obat baru berhasil ditambahkan
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/', obatController.getAllObat);

/**
 * @swagger
 * /obat/{id}:
 *   get:
 *     summary: Mendapatkan data obat berdasarkan ID
 *     tags: [Obat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID obat
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail obat
 *       400:
 *         description: ID obat tidak valid
 *       404:
 *         description: Obat tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui data obat berdasarkan ID (Hanya Admin)
 *     tags: [Obat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID obat
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nama_obat:
 *                 type: string
 *               kategori:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *               harga:
 *                 type: number
 *               gambar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Data obat berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Obat tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus data obat berdasarkan ID (Hanya Admin)
 *     tags: [Obat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID obat
 *     responses:
 *       200:
 *         description: Obat berhasil dihapus
 *       400:
 *         description: ID obat tidak valid
 *       404:
 *         description: Obat tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/:id', obatController.getObatById);

// Endpoint private (Hanya Admin yang bisa menambah, mengubah, dan menghapus)
// `upload.single('gambar')` digunakan untuk menangkap file dari form-data dengan field 'gambar'
router.post('/', authenticateJWT, authorizeAdmin, upload.single('gambar'), obatController.createObat);
router.put('/:id', authenticateJWT, authorizeAdmin, upload.single('gambar'), obatController.updateObat);
router.delete('/:id', authenticateJWT, authorizeAdmin, obatController.deleteObat);

module.exports = router;