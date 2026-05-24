const supabase = require('../config/supabase');

// 1. Membuat pembayaran baru
const createPembayaran = async (req, res) => {
    try {
        const { id_pesanan, metode_pembayaran, status_pembayaran } = req.body;

        // Validasi input
        if (!id_pesanan || !metode_pembayaran) {
            return res.status(400).json({ message: 'id_pesanan dan metode_pembayaran wajib diisi' });
        }

        // Cek apakah pesanan ada
        const { data: pesanan, error: pesananError } = await supabase
            .from('pesanan')
            .select('*')
            .eq('id_pesanan', id_pesanan)
            .maybeSingle();

        if (pesananError || !pesanan) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }

        const statusBayar = status_pembayaran || 'belum_bayar';
        const tanggalBayar = statusBayar === 'lunas' ? new Date() : null;

        const { data, error } = await supabase
            .from('pembayaran')
            .insert([
                {
                    id_pesanan,
                    metode_pembayaran,
                    status_pembayaran: statusBayar,
                    tanggal_pembayaran: tanggalBayar
                }
            ])
            .select();

        if (error) throw error;

        // Logika Bisnis: Jika pembayaran langsung lunas, update status_pesanan menjadi 'diproses'
        if (statusBayar === 'lunas') {
            await supabase
                .from('pesanan')
                .update({ status_pesanan: 'diproses' })
                .eq('id_pesanan', id_pesanan);
        }

        res.status(201).json({
            message: 'Pembayaran berhasil dicatat',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Mendapatkan daftar pembayaran
// - Admin: Bisa melihat seluruh pembayaran
// - User biasa: Hanya melihat pembayaran miliknya sendiri menggunakan Supabase inner join filter
const getAllPembayaran = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const role = req.user.role;

        let query = supabase
            .from('pembayaran')
            .select('*, pesanan!inner(*)');

        if (role !== 'admin') {
            query = query.eq('pesanan.id_user', id_user);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Mendapatkan detail pembayaran berdasarkan ID
const getPembayaranById = async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.id_user;
        const role = req.user.role;

        const { data, error } = await supabase
            .from('pembayaran')
            .select('*, pesanan(*)')
            .eq('id_pembayaran', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });

        // Keamanan: Cek kepemilikan pembayaran jika bukan admin
        if (role !== 'admin' && data.pesanan.id_user !== id_user) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses ke data pembayaran ini.' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Memperbarui status/metode pembayaran
// (Admin atau pihak sistem payment gateway dapat mengubah status pembayaran)
const updatePembayaran = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_pembayaran, metode_pembayaran } = req.body;

        // Ambil data pembayaran lama
        const { data: currentPayment, error: fetchError } = await supabase
            .from('pembayaran')
            .select('*, pesanan(*)')
            .eq('id_pembayaran', id)
            .maybeSingle();

        if (fetchError || !currentPayment) {
            return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
        }

        const updateData = {};
        if (metode_pembayaran) updateData.metode_pembayaran = metode_pembayaran;
        
        if (status_pembayaran) {
            updateData.status_pembayaran = status_pembayaran;
            // Jika berubah menjadi lunas, set tanggal pembayaran ke saat ini
            if (status_pembayaran === 'lunas' && currentPayment.status_pembayaran !== 'lunas') {
                updateData.tanggal_pembayaran = new Date();
            }
        }

        const { data, error } = await supabase
            .from('pembayaran')
            .update(updateData)
            .eq('id_pembayaran', id)
            .select();

        if (error) throw error;

        // Logika Bisnis: Jika pembayaran diperbarui menjadi lunas, update status_pesanan menjadi 'diproses'
        if (status_pembayaran === 'lunas' && currentPayment.status_pembayaran !== 'lunas') {
            await supabase
                .from('pesanan')
                .update({ status_pesanan: 'diproses' })
                .eq('id_pesanan', currentPayment.id_pesanan);
        }

        res.status(200).json({
            message: 'Data pembayaran berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Menghapus pembayaran (Admin Only)
const deletePembayaran = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        if (role !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat menghapus data pembayaran' });
        }

        const { error } = await supabase
            .from('pembayaran')
            .delete()
            .eq('id_pembayaran', id);

        if (error) throw error;

        res.status(200).json({ message: 'Pembayaran berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPembayaran,
    getAllPembayaran,
    getPembayaranById,
    updatePembayaran,
    deletePembayaran
};
