const supabase = require('../config/supabase');

// 1. Mengambil seluruh isi keranjang belanja user beserta stoknya
const getKeranjang = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { data, error } = await supabase
            .from('keranjang')
            .select(`
                *,
                obat:obat(
                    *,
                    stok_obat(
                        jumlah_stok
                    )
                )
            `)
            .eq('id_user', id_user)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map data untuk menggabungkan jumlah_stok di dalam objek obat
        const mappedData = data.map(item => {
            if (item.obat) {
                const totalStok = (item.obat.stok_obat || []).reduce((acc, curr) => acc + (curr.jumlah_stok || 0), 0);
                const { stok_obat, ...restObat } = item.obat;
                return {
                    ...item,
                    obat: {
                        ...restObat,
                        jumlah_stok: totalStok
                    }
                };
            }
            return item;
        });

        res.status(200).json(mappedData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Menambah item baru ke keranjang belanja
const addToKeranjang = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const { id_obat, jumlah } = req.body;

        if (!id_obat) {
            return res.status(400).json({ message: 'id_obat wajib diisi' });
        }

        const qty = parseInt(jumlah) || 1;
        if (qty <= 0) {
            return res.status(400).json({ message: 'Jumlah barang harus lebih dari 0' });
        }

        // Cek ketersediaan stok obat terlebih dahulu
        const { data: stockRecords, error: stockErr } = await supabase
            .from('stok_obat')
            .select('jumlah_stok')
            .eq('id_obat', id_obat);

        if (stockErr) throw stockErr;
        const totalStok = (stockRecords || []).reduce((acc, curr) => acc + (curr.jumlah_stok || 0), 0);
        if (totalStok <= 0) {
            return res.status(400).json({ message: 'Stok obat ini habis atau tidak tersedia' });
        }

        // Cek apakah obat tersebut sudah ada di keranjang user
        const { data: existingItem, error: fetchError } = await supabase
            .from('keranjang')
            .select('*')
            .eq('id_user', id_user)
            .eq('id_obat', id_obat)
            .maybeSingle();

        if (fetchError) throw fetchError;

        let result;
        if (existingItem) {
            // Jika sudah ada, update kuantitasnya
            const newJumlah = existingItem.jumlah + qty;
            const { data: updateData, error: updateError } = await supabase
                .from('keranjang')
                .update({ jumlah: newJumlah, updated_at: new Date() })
                .eq('id_keranjang', existingItem.id_keranjang)
                .select();

            if (updateError) throw updateError;
            result = updateData[0];
        } else {
            // Jika belum ada, masukkan data baru
            const { data: insertData, error: insertError } = await supabase
                .from('keranjang')
                .insert([
                    {
                        id_user,
                        id_obat,
                        jumlah: qty
                    }
                ])
                .select();

            if (insertError) throw insertError;
            result = insertData[0];
        }

        res.status(200).json({
            message: 'Barang berhasil ditambahkan ke keranjang',
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Memperbarui kuantitas (jumlah) item di keranjang secara langsung
const updateKeranjangQuantity = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const { id } = req.params; // id_keranjang
        const { jumlah } = req.body;

        if (jumlah === undefined) {
            return res.status(400).json({ message: 'Jumlah wajib disertakan' });
        }

        const qty = parseInt(jumlah);
        if (qty <= 0) {
            return res.status(400).json({ message: 'Jumlah harus lebih besar dari 0' });
        }

        const { data, error } = await supabase
            .from('keranjang')
            .update({ jumlah: qty, updated_at: new Date() })
            .eq('id_keranjang', id)
            .eq('id_user', id_user) // Keamanan: Pastikan milik user yang login
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Item keranjang tidak ditemukan' });
        }

        res.status(200).json({
            message: 'Jumlah keranjang berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Menghapus satu item dari keranjang
const deleteFromKeranjang = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const { id } = req.params; // id_keranjang

        const { data, error } = await supabase
            .from('keranjang')
            .delete()
            .eq('id_keranjang', id)
            .eq('id_user', id_user) // Keamanan: Pastikan milik user yang login
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Item keranjang tidak ditemukan atau bukan milik Anda' });
        }

        res.status(200).json({
            message: 'Barang berhasil dihapus dari keranjang'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Mengosongkan seluruh isi keranjang milik user
const clearKeranjang = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { error } = await supabase
            .from('keranjang')
            .delete()
            .eq('id_user', id_user);

        if (error) throw error;

        res.status(200).json({
            message: 'Keranjang berhasil dikosongkan'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getKeranjang,
    addToKeranjang,
    updateKeranjangQuantity,
    deleteFromKeranjang,
    clearKeranjang
};
