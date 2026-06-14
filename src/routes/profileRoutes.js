const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: API untuk mengelola profil pengguna (memerlukan Bearer Token)
 */

// Semua rute profile WAJIB menyertakan token JWT (login terlebih dahulu)
router.use(authenticateJWT);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Mendapatkan informasi profil pengguna saat ini
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan profil pengguna
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui informasi profil pengguna saat ini
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *               alamat:
 *                 type: string
 *               no_hp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

/**
 * @swagger
 * /profile/change-password:
 *   put:
 *     summary: Mengganti password pengguna saat ini
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *       400:
 *         description: Password lama salah atau input tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.put('/change-password', profileController.changePassword);

module.exports = router;
