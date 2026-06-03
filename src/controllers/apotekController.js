const supabase = require('../config/supabase');

// Mengambil semua data apotek
const getAllApotek = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('apotek')
            .select('*');

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Memperbarui data apotek
const updateApotek = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_apotek, alamat, latitude, longitude, jam_operasional } = req.body;

        // Keamanan: Admin hanya boleh memperbarui data apotek miliknya sendiri
        if (req.user.role === 'admin' && req.user.id_apotek && parseInt(id) !== parseInt(req.user.id_apotek)) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak berwenang mengupdate apotek ini.' });
        }

        const updateData = {};
        if (nama_apotek !== undefined) updateData.nama_apotek = nama_apotek;
        if (alamat !== undefined) updateData.alamat = alamat;
        if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
        if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
        if (jam_operasional !== undefined) updateData.jam_operasional = jam_operasional;

        const { data, error } = await supabase
            .from('apotek')
            .update(updateData)
            .eq('id_apotek', parseInt(id))
            .select();

        if (error) throw error;

        res.status(200).json({
            message: 'Apotek berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllApotek,
    updateApotek
};
