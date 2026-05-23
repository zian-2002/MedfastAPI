require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const obatRoutes = require('./src/routes/obatRoutes');
const apotekRoutes = require('./src/routes/apotekRoutes');
const stokObatRoutes = require('./src/routes/stokObatRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// TEST API
// ==============================
app.get('/', (req, res) => {
    res.json({
        message: 'API Medfast berhasil jalan 🚀'
    });
});

// ==============================
// ROUTES API
// ==============================
app.use('/api/auth', authRoutes);
app.use('/api/obat', obatRoutes);
app.use('/api/apotek', apotekRoutes);
app.use('/api/stok-obat', stokObatRoutes);
app.use('/api/profile', profileRoutes);

// ==============================
// PORT
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
});