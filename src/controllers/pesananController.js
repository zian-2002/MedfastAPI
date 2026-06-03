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

        // Pengecekan ketersediaan stok obat sebelum pesanan dibuat
        if (detail_items && Array.isArray(detail_items) && detail_items.length > 0) {
            for (const item of detail_items) {
                const id_obat = item.id_obat;
                const jumlah = parseInt(item.jumlah);

                const { data: stockData, error: stockFetchError } = await supabase
                    .from('stok_obat')
                    .select('id_stok, jumlah_stok')
                    .eq('id_apotek', id_apotek)
                    .eq('id_obat', id_obat)
                    .maybeSingle();

                if (stockFetchError) throw stockFetchError;

                const currentStock = stockData ? (stockData.jumlah_stok || 0) : 0;
                if (currentStock < jumlah) {
                    return res.status(400).json({ 
                        message: `Stok obat tidak mencukupi atau habis! Stok saat ini: ${currentStock}` 
                    });
                }
                
                // Simpan referensi update stok ke item
                item.id_stok = stockData.id_stok;
                item.new_stock = currentStock - jumlah;
            }
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
            
            // Kurangi stok obat di database setelah pemesanan sukses dibuat
            for (const item of detail_items) {
                const { error: stockUpdateError } = await supabase
                    .from('stok_obat')
                    .update({ jumlah_stok: item.new_stock })
                    .eq('id_stok', item.id_stok);

                if (stockUpdateError) throw stockUpdateError;
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
        const id_apotek = req.user.id_apotek;

        let query = supabase
            .from('pesanan')
            .select('*, users(id_user, nama, email), apotek(*)');

        // Batasi query berdasarkan role
        if (role === 'admin') {
            if (id_apotek) {
                query = query.eq('id_apotek', id_apotek);
            }
        } else {
            // Pelanggan hanya melihat pesanan miliknya sendiri
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
        const id_apotek = req.user.id_apotek;

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

        // Keamanan: Pastikan user hanya dapat mengakses pesanannya sendiri
        if (role === 'admin') {
            if (id_apotek && pesanan.id_apotek !== id_apotek) {
                return res.status(403).json({ message: 'Akses ditolak. Pesanan ini milik apotek lain.' });
            }
        } else if (pesanan.id_user !== id_user) {
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
        const id_apotek = req.user.id_apotek;

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
        if (role === 'admin') {
            if (id_apotek && existingPesanan.id_apotek !== id_apotek) {
                return res.status(403).json({ message: 'Akses ditolak. Pesanan ini milik apotek lain.' });
            }
        } else {
            // Pelanggan hanya bisa membatalkan ('dibatalkan') jika status saat ini masih 'pending'
            if (existingPesanan.id_user !== id_user) {
                return res.status(403).json({ message: 'Akses ditolak.' });
            }
            if (status_pesanan !== 'dibatalkan') {
                return res.status(400).json({ message: 'User hanya diperbolehkan membatalkan pesanan' });
            }
            if (existingPesanan.status_pesanan !== 'pending' && existingPesanan.status_pesanan !== 'menunggu') {
                return res.status(400).json({ message: 'Pesanan sudah diproses dan tidak dapat dibatalkan' });
            }
        }

        // Jika status diubah menjadi 'dibatalkan', kembalikan stok obat ke apotek
        if (status_pesanan === 'dibatalkan' && existingPesanan.status_pesanan !== 'dibatalkan') {
            const { data: detailItems, error: detailError } = await supabase
                .from('detail_pesanan')
                .select('id_obat, jumlah')
                .eq('id_pesanan', id);

            if (detailError) throw detailError;

            if (detailItems && detailItems.length > 0) {
                for (const item of detailItems) {
                    const { data: stockData, error: stockFetchError } = await supabase
                        .from('stok_obat')
                        .select('id_stok, jumlah_stok')
                        .eq('id_apotek', existingPesanan.id_apotek)
                        .eq('id_obat', item.id_obat)
                        .maybeSingle();

                    if (stockFetchError) throw stockFetchError;

                    if (stockData) {
                        const newStock = (stockData.jumlah_stok || 0) + parseInt(item.jumlah);
                        const { error: stockUpdateError } = await supabase
                            .from('stok_obat')
                            .update({ jumlah_stok: newStock })
                            .eq('id_stok', stockData.id_stok);

                        if (stockUpdateError) throw stockUpdateError;
                    }
                }
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
