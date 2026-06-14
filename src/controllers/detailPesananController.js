const supabase = require('../config/supabase');

// Fungsi pembantu untuk mengupdate total_harga pada pesanan secara otomatis
const updatePesananTotal = async (id_pesanan) => {
    try {
        // Ambil semua detail pesanan untuk pesanan ini
        const { data: details, error } = await supabase
            .from('detail_pesanan')
            .select('subtotal')
            .eq('id_pesanan', id_pesanan);

        if (error) throw error;

        // Hitung total harga baru
        const newTotal = details.reduce((acc, curr) => acc + (parseFloat(curr.subtotal) || 0), 0);

        // Update di tabel pesanan
        const { error: updateError } = await supabase
            .from('pesanan')
            .update({ total_harga: newTotal })
            .eq('id_pesanan', id_pesanan);

        if (updateError) throw updateError;
    } catch (err) {
        console.error('Gagal mengupdate total harga pesanan:', err.message);
    }
};

// 1. Menambahkan item obat ke dalam pesanan yang sudah ada
const createDetailPesanan = async (req, res) => {
    try {
        const { id_pesanan, id_obat, jumlah, harga_satuan } = req.body;

        // Validasi input
        if (!id_pesanan || !id_obat || !jumlah || !harga_satuan) {
            return res.status(400).json({ message: 'Semua field (id_pesanan, id_obat, jumlah, harga_satuan) wajib diisi' });
        }

        const { data, error } = await supabase
            .from('detail_pesanan')
            .insert([
                {
                    id_pesanan,
                    id_obat,
                    jumlah: parseInt(jumlah),
                    harga_satuan: parseFloat(harga_satuan)
                }
            ])
            .select();

        if (error) throw error;

        // Update total_harga di tabel pesanan
        await updatePesananTotal(id_pesanan);

        res.status(201).json({
            message: 'Detail pesanan berhasil ditambahkan',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Mengambil semua detail pesanan
// Opsional: Filter berdasarkan ?id_pesanan=xxx
const getAllDetailPesanan = async (req, res) => {
    try {
        const { id_pesanan } = req.query;

        let query = supabase
            .from('detail_pesanan')
            .select('*, obat(*)');

        if (id_pesanan) {
            query = query.eq('id_pesanan', id_pesanan);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Mengambil satu detail pesanan berdasarkan ID
const getDetailPesananById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('detail_pesanan')
            .select('*, obat(*)')
            .eq('id_detail', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Detail pesanan tidak ditemukan' });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Mengubah jumlah/harga obat dalam detail pesanan
const updateDetailPesanan = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah, harga_satuan } = req.body;

        // Dapatkan data saat ini untuk kalkulasi subtotal baru
        const { data: currentDetail, error: fetchError } = await supabase
            .from('detail_pesanan')
            .select('*')
            .eq('id_detail', id)
            .maybeSingle();

        if (fetchError || !currentDetail) {
            return res.status(404).json({ message: 'Detail pesanan tidak ditemukan' });
        }

        const newJumlah = jumlah !== undefined ? parseInt(jumlah) : currentDetail.jumlah;
        const newHargaSatuan = harga_satuan !== undefined ? parseFloat(harga_satuan) : currentDetail.harga_satuan;

        const { data, error } = await supabase
            .from('detail_pesanan')
            .update({
                jumlah: newJumlah,
                harga_satuan: newHargaSatuan
            })
            .eq('id_detail', id)
            .select();

        if (error) throw error;

        // Update total_harga di tabel pesanan
        await updatePesananTotal(currentDetail.id_pesanan);

        res.status(200).json({
            message: 'Detail pesanan berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Menghapus detail pesanan
const deleteDetailPesanan = async (req, res) => {
    try {
        const { id } = req.params;

        // Dapatkan id_pesanan sebelum dihapus untuk melakukan update total_harga
        const { data: currentDetail, error: fetchError } = await supabase
            .from('detail_pesanan')
            .select('id_pesanan')
            .eq('id_detail', id)
            .maybeSingle();

        if (fetchError || !currentDetail) {
            return res.status(404).json({ message: 'Detail pesanan tidak ditemukan' });
        }

        const { error } = await supabase
            .from('detail_pesanan')
            .delete()
            .eq('id_detail', id);

        if (error) throw error;

        // Update total_harga di tabel pesanan
        await updatePesananTotal(currentDetail.id_pesanan);

        res.status(200).json({ message: 'Detail pesanan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createDetailPesanan,
    getAllDetailPesanan,
    getDetailPesananById,
    updateDetailPesanan,
    deleteDetailPesanan
};
