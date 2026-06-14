const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API untuk registrasi dan login pengguna
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrasi pengguna baru
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - email
 *               - password
 *             properties:
 *               nama:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               alamat:
 *                 type: string
 *               no_hp:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Pengguna berhasil terdaftar
 *       400:
 *         description: Input tidak valid atau email sudah terdaftar
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login pengguna untuk mendapatkan token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil, mengembalikan token JWT
 *       400:
 *         description: Email atau password salah
 *       500:
 *         description: Kesalahan server internal
 */
router.post('/login', authController.login);

module.exports = router;
