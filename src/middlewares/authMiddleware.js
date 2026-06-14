const jwt = require('jsonwebtoken');


const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
            }
            
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
    }
};


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
