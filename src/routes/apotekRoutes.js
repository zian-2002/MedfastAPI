const express = require('express');
const router = express.Router();
const apotekController = require('../controllers/apotekController');

/**
 * @swagger
 * tags:
 *   name: Apotek
 *   description: API untuk mengelola data apotek
 */

/**
 * @swagger
 * /apotek:
 *   get:
 *     summary: Mendapatkan semua data apotek
 *     tags: [Apotek]
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar apotek
 *       400:
 *         description: Request tidak valid
 *       500:
 *         description: Kesalahan server internal
 */
router.get('/', apotekController.getAllApotek);
router.put('/:id', apotekController.updateApotek);

module.exports = router;
