const supabase = require('../config/supabase');



const getAllStokObat = async (req, res) => {
    try {
        const { id_apotek } = req.query;

        let query = supabase
            .from('stok_obat')
            .select(`
                id_stok,
                jumlah_stok,
                id_apotek,
                id_obat,
                apotek ( nama_apotek ),
                obat ( id_obat, nama_obat, harga, deskripsi, gambar, kategori )
            `);

        if (id_apotek) {
            query = query.eq('id_apotek', parseInt(id_apotek));
        }

        const { data, error } = await query;

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const createStokObat = async (req, res) => {
    try {
        const { id_apotek, id_obat, jumlah_stok } = req.body;

        if (!id_apotek || !id_obat || jumlah_stok === undefined) {
            return res.status(400).json({ message: 'id_apotek, id_obat, dan jumlah_stok wajib diisi' });
        }

        
        if (req.user.id_apotek && parseInt(id_apotek) !== parseInt(req.user.id_apotek)) {
            return res.status(403).json({ message: 'Akses ditolak. Anda hanya berwenang menambah stok untuk apotek sendiri.' });
        }

        
        const { data: existingStok, error: fetchError } = await supabase
            .from('stok_obat')
            .select('*')
            .eq('id_apotek', id_apotek)
            .eq('id_obat', id_obat)
            .maybeSingle();

        if (fetchError) throw fetchError;

        let result;
        if (existingStok) {
            
            const { data: updateData, error: updateError } = await supabase
                .from('stok_obat')
                .update({ jumlah_stok: parseInt(jumlah_stok) })
                .eq('id_stok', existingStok.id_stok)
                .select();
            if (updateError) throw updateError;
            result = updateData[0];
        } else {
            
            const { data: insertData, error: insertError } = await supabase
                .from('stok_obat')
                .insert([
                    {
                        id_apotek,
                        id_obat,
                        jumlah_stok: parseInt(jumlah_stok)
                    }
                ])
                .select();
            if (insertError) throw insertError;
            result = insertData[0];
        }

        res.status(201).json({
            message: existingStok ? 'Stok obat berhasil diperbarui' : 'Stok obat berhasil ditambahkan',
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updateStokObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_apotek, id_obat, jumlah_stok } = req.body;

        
        const { data: existing, error: fetchErr } = await supabase
            .from('stok_obat')
            .select('*')
            .eq('id_stok', id)
            .maybeSingle();

        if (fetchErr || !existing) {
            return res.status(404).json({ message: 'Data stok tidak ditemukan' });
        }

        
        if (req.user.id_apotek && parseInt(existing.id_apotek) !== parseInt(req.user.id_apotek)) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak berwenang mengelola stok apotek lain.' });
        }

        const updatePayload = {};
        if (id_apotek !== undefined) updatePayload.id_apotek = id_apotek;
        if (id_obat !== undefined) updatePayload.id_obat = id_obat;
        if (jumlah_stok !== undefined) updatePayload.jumlah_stok = parseInt(jumlah_stok);
        
        const { data, error } = await supabase
            .from('stok_obat')
            .update(updatePayload)
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


const deleteStokObat = async (req, res) => {
    try {
        const { id } = req.params;

        
        const { data: existing, error: fetchErr } = await supabase
            .from('stok_obat')
            .select('*')
            .eq('id_stok', id)
            .maybeSingle();

        if (fetchErr || !existing) {
            return res.status(404).json({ message: 'Data stok tidak ditemukan' });
        }

        
        if (req.user.id_apotek && parseInt(existing.id_apotek) !== parseInt(req.user.id_apotek)) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak berwenang mengelola stok apotek lain.' });
        }

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
