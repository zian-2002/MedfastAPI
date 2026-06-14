const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi JWT Token
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        // Format Bearer <token>
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
            }
            // Menyimpan payload user ke request object
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
    }
};

// Middleware untuk membatasi akses hanya untuk Admin
const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Akses ditolak, hanya admin yang diizinkan' });
    }
};

module.exports = {
    authenticateJWT,
    authorizeAdmin
};
