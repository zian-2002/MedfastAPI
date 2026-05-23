const multer = require('multer');

// Konfigurasi Multer untuk menyimpan file di memory
// Berguna sebelum kita upload langsung ke Supabase Storage
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Batasan ukuran file 5MB
    },
    fileFilter: (req, file, cb) => {
        // Filter hanya untuk file gambar
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File yang diupload harus berupa gambar.'), false);
        }
    }
});

module.exports = upload;
