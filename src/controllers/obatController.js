const supabase = require('../config/supabase');


const getAllObat = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('obat')
            .select(`
                *,
                stok_obat (
                    jumlah_stok
                )
            `)
            .is('deleted_at', null);

        if (error) throw error;
        
        
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
            .is('deleted_at', null)
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


const uploadToSupabase = async (file) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
        .from('obat')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype
        });

    if (error) throw error;

    
    const { data: publicUrlData } = supabase.storage
        .from('obat')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
};


const createObat = async (req, res) => {
    try {
        const { nama_obat, deskripsi, kategori, harga } = req.body;
        let imageUrl = null;

        
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


const updateObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_obat, deskripsi, kategori, harga } = req.body;
        
        let id_apotek = req.user.id_apotek;
        if (req.user.role === 'admin' && !id_apotek) {
            const { data: userDb } = await supabase
                .from('users')
                .select('id_apotek')
                .eq('id_user', req.user.id_user)
                .single();
            if (userDb) {
                id_apotek = userDb.id_apotek;
            }
        }

        
        if (id_apotek) {
            const { data: stockCheck, error: checkError } = await supabase
                .from('stok_obat')
                .select('id_stok')
                .eq('id_obat', id)
                .eq('id_apotek', id_apotek)
                .maybeSingle();

            if (checkError || !stockCheck) {
                return res.status(403).json({ message: 'Akses ditolak. Obat ini tidak terdaftar di apotek Anda.' });
            }
        }

        
        const { data: existingObat } = await supabase
            .from('obat')
            .select('*')
            .eq('id_obat', id)
            .is('deleted_at', null)
            .maybeSingle();

        if (!existingObat) {
            return res.status(404).json({ message: 'Obat tidak ditemukan' });
        }

        let imageUrl = existingObat.gambar; 

        
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


const deleteObat = async (req, res) => {
    try {
        const { id } = req.params;

        let id_apotek = req.user.id_apotek;
        if (req.user.role === 'admin' && !id_apotek) {
            const { data: userDb } = await supabase
                .from('users')
                .select('id_apotek')
                .eq('id_user', req.user.id_user)
                .single();
            if (userDb) {
                id_apotek = userDb.id_apotek;
            }
        }

        
        if (id_apotek) {
            const { data: stockCheck, error: checkError } = await supabase
                .from('stok_obat')
                .select('id_stok')
                .eq('id_obat', id)
                .eq('id_apotek', id_apotek)
                .maybeSingle();

            if (checkError || !stockCheck) {
                return res.status(403).json({ message: 'Akses ditolak. Obat ini tidak terdaftar di apotek Anda.' });
            }

            
            await supabase
                .from('stok_obat')
                .delete()
                .eq('id_obat', id)
                .eq('id_apotek', id_apotek);

            
            const { data: otherStocks } = await supabase
                .from('stok_obat')
                .select('id_stok')
                .eq('id_obat', id)
                .limit(1);

            if (!otherStocks || otherStocks.length === 0) {
                
                const { error: deleteError } = await supabase
                    .from('obat')
                    .update({ deleted_at: new Date() })
                    .eq('id_obat', id);
                if (deleteError) throw deleteError;
            }
        } else {
            
            await supabase
                .from('stok_obat')
                .delete()
                .eq('id_obat', id);

            const { error: deleteError } = await supabase
                .from('obat')
                .update({ deleted_at: new Date() })
                .eq('id_obat', id);
            if (deleteError) throw deleteError;
        }

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
