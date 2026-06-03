const supabase = require('../config/supabase');

// Mengambil semua obat beserta jumlah stoknya
const getAllObat = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('obat')
            .select(`
                *,
                stok_obat (
                    jumlah_stok
                )
            `);

        if (error) throw error;
        
        // Map data untuk menyertakan total jumlah_stok ke frontend
        const mappedData = data.map(item => {
            const totalStok = (item.stok_obat || []).reduce((acc, curr) => acc + (curr.jumlah_stok || 0), 0);
            const { stok_obat, ...rest } = item;
            return {
                ...rest,
                jumlah_stok: totalStok
            };
        });
        
        res.status(200).json(mappedData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mengambil satu obat berdasarkan ID beserta jumlah stoknya
const getObatById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('obat')
            .select(`
                *,
                stok_obat (
                    jumlah_stok
                )
            `)
            .eq('id_obat', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Obat tidak ditemukan' });

        const totalStok = (data.stok_obat || []).reduce((acc, curr) => acc + (curr.jumlah_stok || 0), 0);
        const { stok_obat, ...rest } = data;
        const mappedData = {
            ...rest,
            jumlah_stok: totalStok
        };

        res.status(200).json(mappedData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fungsi bantuan untuk upload file ke Supabase Storage
const uploadToSupabase = async (file) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
        .from('obat')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype
        });

    if (error) throw error;

    // Dapatkan Public URL untuk disimpan di database
    const { data: publicUrlData } = supabase.storage
        .from('obat')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
};

// Menambah obat baru (Admin Only)
const createObat = async (req, res) => {
    try {
        const { nama_obat, deskripsi, kategori, harga } = req.body;
        let imageUrl = null;

        // Jika ada file gambar yang diupload
        if (req.file) {
            imageUrl = await uploadToSupabase(req.file);
        }

        const { data, error } = await supabase
            .from('obat')
            .insert([
                {
                    nama_obat,
                    deskripsi,
                    kategori,
                    harga: parseFloat(harga),
                    gambar: imageUrl
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({
            message: 'Obat berhasil ditambahkan',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mengupdate obat (Admin Only)
const updateObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_obat, deskripsi, kategori, harga } = req.body;
        
        // Keamanan: Admin hanya boleh mengupdate obat yang ada di apoteknya sendiri
        if (req.user.id_apotek) {
            const { data: stockCheck, error: checkError } = await supabase
                .from('stok_obat')
                .select('id_stok')
                .eq('id_obat', id)
                .eq('id_apotek', req.user.id_apotek)
                .maybeSingle();

            if (checkError || !stockCheck) {
                return res.status(403).json({ message: 'Akses ditolak. Obat ini tidak terdaftar di apotek Anda.' });
            }
        }

        // Ambil data obat saat ini untuk mengecek gambar lama (opsional jika ingin menghapus gambar lama)
        const { data: existingObat } = await supabase
            .from('obat')
            .select('*')
            .eq('id_obat', id)
            .single();

        if (!existingObat) {
            return res.status(404).json({ message: 'Obat tidak ditemukan' });
        }

        let imageUrl = existingObat.gambar; // default menggunakan gambar lama

        // Jika ada gambar baru yang diupload, ganti URL
        if (req.file) {
            imageUrl = await uploadToSupabase(req.file);
        }

        const { data, error } = await supabase
            .from('obat')
            .update({
                nama_obat,
                deskripsi,
                kategori,
                harga: parseFloat(harga),
                gambar: imageUrl
            })
            .eq('id_obat', id)
            .select();

        if (error) throw error;

        res.status(200).json({
            message: 'Obat berhasil diupdate',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Menghapus obat (Admin Only)
const deleteObat = async (req, res) => {
    try {
        const { id } = req.params;

        // Keamanan: Admin hanya boleh menghapus obat yang ada di apoteknya sendiri
        if (req.user.id_apotek) {
            const { data: stockCheck, error: checkError } = await supabase
                .from('stok_obat')
                .select('id_stok')
                .eq('id_obat', id)
                .eq('id_apotek', req.user.id_apotek)
                .maybeSingle();

            if (checkError || !stockCheck) {
                return res.status(403).json({ message: 'Akses ditolak. Obat ini tidak terdaftar di apotek Anda.' });
            }

            // Hapus relasi stok terlebih dahulu
            await supabase
                .from('stok_obat')
                .delete()
                .eq('id_obat', id)
                .eq('id_apotek', req.user.id_apotek);
        }

        const { error } = await supabase
            .from('obat')
            .delete()
            .eq('id_obat', id);

        if (error) throw error;

        res.status(200).json({ message: 'Obat berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllObat,
    getObatById,
    createObat,
    updateObat,
    deleteObat
};
