const express = require('express');
const router = express.Router();
const stokObatController = require('../controllers/stokObatController');
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Stok Obat
 *   description: API untuk mengelola stok obat di apotek
 */

/**
 * @swagger
 * /stok-obat:
 *   get:
 *     summary: Mendapatkan data semua stok obat
 *     tags: [Stok Obat]
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar stok obat
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   post:
 *     summary: Menambah data stok obat baru (Hanya Admin)
 *     tags: [Stok Obat]
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
 *               - id_obat
 *               - stok
 *             properties:
 *               id_apotek:
 *                 type: integer
 *               id_obat:
 *                 type: integer
 *               stok:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Stok obat berhasil ditambahkan
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/', stokObatController.getAllStokObat);

/**
 * @swagger
 * /stok-obat/{id}:
 *   put:
 *     summary: Memperbarui data stok obat berdasarkan ID (Hanya Admin)
 *     tags: [Stok Obat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID data stok obat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stok:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Data stok obat berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Data stok tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus data stok obat berdasarkan ID (Hanya Admin)
 *     tags: [Stok Obat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID data stok obat
 *     responses:
 *       200:
 *         description: Data stok obat berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Data stok tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/', authenticateJWT, authorizeAdmin, stokObatController.createStokObat);
router.put('/:id', authenticateJWT, authorizeAdmin, stokObatController.updateStokObat);
router.delete('/:id', authenticateJWT, authorizeAdmin, stokObatController.deleteStokObat);

module.exports = router;
