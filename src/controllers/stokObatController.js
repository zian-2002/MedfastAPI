const supabase = require('../config/supabase');

// Mengambil semua stok obat beserta nama obat dan nama apotek
const getAllStokObat = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('stok_obat')
            .select(`
                id_stok,
                jumlah_stok,
                id_apotek,
                id_obat,
                apotek ( nama_apotek ),
                obat ( nama_obat )
            `);

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Menambah stok obat baru (Admin Only)
const createStokObat = async (req, res) => {
    try {
        const { id_apotek, id_obat, jumlah_stok } = req.body;

        const { data, error } = await supabase
            .from('stok_obat')
            .insert([
                {
                    id_apotek,
                    id_obat,
                    jumlah_stok: parseInt(jumlah_stok)
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({
            message: 'Stok obat berhasil ditambahkan',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mengupdate stok obat (Admin Only)
const updateStokObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_apotek, id_obat, jumlah_stok } = req.body;
        
        const { data, error } = await supabase
            .from('stok_obat')
            .update({
                id_apotek,
                id_obat,
                jumlah_stok: parseInt(jumlah_stok)
            })
            .eq('id_stok', id)
            .select();

        if (error) throw error;

        res.status(200).json({
            message: 'Stok obat berhasil diupdate',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Menghapus stok obat (Admin Only)
const deleteStokObat = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('stok_obat')
            .delete()
            .eq('id_stok', id);

        if (error) throw error;

        res.status(200).json({ message: 'Stok obat berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllStokObat,
    createStokObat,
    updateStokObat,
    deleteStokObat
};
