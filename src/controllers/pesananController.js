const supabase = require('../config/supabase');

// 1. Membuat pesanan baru
// Mendukung pembuatan pesanan sekaligus detail_pesanan dalam satu request
const createPesanan = async (req, res) => {
    try {
        const id_user = req.user.id_user; // Diambil dari JWT token
        const { id_apotek, total_harga, status_pesanan, detail_items } = req.body;

        // Validasi sederhana
        if (!id_apotek) {
            return res.status(400).json({ message: 'id_apotek wajib diisi' });
        }
        if (total_harga === undefined || total_harga < 0) {
            return res.status(400).json({ message: 'total_harga tidak valid' });
        }

        // Insert ke tabel pesanan
        const { data: pesananData, error: pesananError } = await supabase
            .from('pesanan')
            .insert([
                {
                    id_user,
                    id_apotek,
                    total_harga: parseFloat(total_harga),
                    status_pesanan: status_pesanan || 'pending',
                    tanggal_pesanan: new Date()
                }
            ])
            .select();

        if (pesananError) throw pesananError;

        const newPesanan = pesananData[0];
        const id_pesanan = newPesanan.id_pesanan;

        let insertedDetails = [];

        // Jika terdapat detail_items, insert juga ke tabel detail_pesanan
        if (detail_items && Array.isArray(detail_items) && detail_items.length > 0) {
            const detailsToInsert = detail_items.map(item => {
                return {
                    id_pesanan,
                    id_obat: item.id_obat,
                    jumlah: parseInt(item.jumlah),
                    harga_satuan: parseFloat(item.harga_satuan)
                };
            });

            const { data: detailsData, error: detailsError } = await supabase
                .from('detail_pesanan')
                .insert(detailsToInsert)
                .select();

            if (detailsError) {
                // Jika gagal memasukkan detail, hapus pesanan yang baru dibuat agar tidak jadi data yatim (rollback manual)
                await supabase.from('pesanan').delete().eq('id_pesanan', id_pesanan);
                throw detailsError;
            }
            insertedDetails = detailsData;
        }

        res.status(201).json({
            message: 'Pesanan berhasil dibuat',
            pesanan: newPesanan,
            detail_pesanan: insertedDetails
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Mengambil semua pesanan (dengan relasi)
// - Admin: melihat semua pesanan
// - User: hanya melihat pesanan miliknya sendiri
const getAllPesanan = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const role = req.user.role;

        let query = supabase
            .from('pesanan')
            .select('*, users(id_user, nama, email), apotek(*)');

        // Jika bukan admin, batasi query hanya untuk user bersangkutan
        if (role !== 'admin') {
            query = query.eq('id_user', id_user);
        }

        const { data, error } = await query.order('tanggal_pesanan', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Mengambil satu pesanan detail berdasarkan ID (relasi lengkap)
const getPesananById = async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.id_user;
        const role = req.user.role;

        const { data: pesanan, error } = await supabase
            .from('pesanan')
            .select(`
                *,
                users(id_user, nama, email, no_hp, alamat),
                apotek(*),
                detail_pesanan(
                    *,
                    obat(*)
                ),
                pembayaran(*),
                pengiriman(*)
            `)
            .eq('id_pesanan', id)
            .maybeSingle();

        if (error) throw error;
        if (!pesanan) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }

        // Keamanan: Pastikan user hanya dapat mengakses pesanannya sendiri (kecuali admin)
        if (role !== 'admin' && pesanan.id_user !== id_user) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses ke pesanan ini.' });
        }

        res.status(200).json(pesanan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Memperbarui status pesanan
const updatePesananStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_pesanan } = req.body;
        const id_user = req.user.id_user;
        const role = req.user.role;

        if (!status_pesanan) {
            return res.status(400).json({ message: 'status_pesanan wajib diisi' });
        }

        // Dapatkan data pesanan saat ini untuk verifikasi keamanan
        const { data: existingPesanan, error: fetchError } = await supabase
            .from('pesanan')
            .select('*')
            .eq('id_pesanan', id)
            .maybeSingle();

        if (fetchError || !existingPesanan) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }

        // Keamanan & Aturan Bisnis:
        // 1. Jika bukan admin, hanya bisa membatalkan ('dibatalkan')
        // 2. Pembatalan oleh user hanya boleh jika status saat ini masih 'pending'
        if (role !== 'admin') {
            if (existingPesanan.id_user !== id_user) {
                return res.status(403).json({ message: 'Akses ditolak.' });
            }
            if (status_pesanan !== 'dibatalkan') {
                return res.status(400).json({ message: 'User hanya diperbolehkan membatalkan pesanan' });
            }
            if (existingPesanan.status_pesanan !== 'pending') {
                return res.status(400).json({ message: 'Pesanan sudah diproses dan tidak dapat dibatalkan' });
            }
        }

        const { data, error } = await supabase
            .from('pesanan')
            .update({ status_pesanan })
            .eq('id_pesanan', id)
            .select();

        if (error) throw error;

        res.status(200).json({
            message: 'Status pesanan berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Menghapus pesanan (Admin Only / Keamanan Tambahan)
const deletePesanan = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        if (role !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat menghapus pesanan' });
        }

        // Hapus detail_pesanan terlebih dahulu (untuk menghindari foreign key constraint error)
        await supabase
            .from('detail_pesanan')
            .delete()
            .eq('id_pesanan', id);

        // Hapus pembayaran & pengiriman terkait jika ada
        await supabase.from('pembayaran').delete().eq('id_pesanan', id);
        await supabase.from('pengiriman').delete().eq('id_pesanan', id);

        // Hapus pesanan utama
        const { error } = await supabase
            .from('pesanan')
            .delete()
            .eq('id_pesanan', id);

        if (error) throw error;

        res.status(200).json({ message: 'Pesanan dan seluruh relasi terkait berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPesanan,
    getAllPesanan,
    getPesananById,
    updatePesananStatus,
    deletePesanan
};
