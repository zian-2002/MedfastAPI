const supabase = require('../config/supabase');


const createPengiriman = async (req, res) => {
    try {
        const { id_pesanan, alamat_tujuan, status_pengiriman } = req.body;

        
        if (!id_pesanan || !alamat_tujuan) {
            return res.status(400).json({ message: 'id_pesanan dan alamat_tujuan wajib diisi' });
        }

        
        const { data: pesanan, error: pesananError } = await supabase
            .from('pesanan')
            .select('*')
            .eq('id_pesanan', id_pesanan)
            .maybeSingle();

        if (pesananError || !pesanan) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }

        const statusKirim = status_pengiriman || 'pending';
        let tanggal_kirim = null;
        let tanggal_sampai = null;

        if (statusKirim === 'dikirim') {
            tanggal_kirim = new Date();
        } else if (statusKirim === 'sampai') {
            tanggal_kirim = new Date();
            tanggal_sampai = new Date();
        }

        const { data, error } = await supabase
            .from('pengiriman')
            .insert([
                {
                    id_pesanan,
                    alamat_tujuan,
                    status_pengiriman: statusKirim,
                    tanggal_kirim,
                    tanggal_sampai
                }
            ])
            .select();

        if (error) throw error;

        
        if (statusKirim === 'dikirim') {
            await supabase.from('pesanan').update({ status_pesanan: 'dikirim' }).eq('id_pesanan', id_pesanan);
        } else if (statusKirim === 'sampai') {
            await supabase.from('pesanan').update({ status_pesanan: 'selesai' }).eq('id_pesanan', id_pesanan);
        }

        res.status(201).json({
            message: 'Pengiriman berhasil dicatat',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




const getAllPengiriman = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const role = req.user.role;

        let query = supabase
            .from('pengiriman')
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


const getPengirimanById = async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.id_user;
        const role = req.user.role;

        const { data, error } = await supabase
            .from('pengiriman')
            .select('*, pesanan(*)')
            .eq('id_pengiriman', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Pengiriman tidak ditemukan' });

        
        if (role !== 'admin' && data.pesanan.id_user !== id_user) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses ke data pengiriman ini.' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updatePengiriman = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_pengiriman, alamat_tujuan } = req.body;

        
        const { data: currentShipment, error: fetchError } = await supabase
            .from('pengiriman')
            .select('*, pesanan(*)')
            .eq('id_pengiriman', id)
            .maybeSingle();

        if (fetchError || !currentShipment) {
            return res.status(404).json({ message: 'Pengiriman tidak ditemukan' });
        }

        const updateData = {};
        if (alamat_tujuan) updateData.alamat_tujuan = alamat_tujuan;

        if (status_pengiriman) {
            updateData.status_pengiriman = status_pengiriman;
            
            
            if (status_pengiriman === 'dikirim' && currentShipment.status_pengiriman !== 'dikirim') {
                updateData.tanggal_kirim = new Date();
            } else if (status_pengiriman === 'sampai' && currentShipment.status_pengiriman !== 'sampai') {
                if (!currentShipment.tanggal_kirim) {
                    updateData.tanggal_kirim = new Date();
                }
                updateData.tanggal_sampai = new Date();
            }
        }

        const { data, error } = await supabase
            .from('pengiriman')
            .update(updateData)
            .eq('id_pengiriman', id)
            .select();

        if (error) throw error;

        
        if (status_pengiriman === 'dikirim' && currentShipment.status_pengiriman !== 'dikirim') {
            await supabase.from('pesanan').update({ status_pesanan: 'dikirim' }).eq('id_pesanan', currentShipment.id_pesanan);
        } else if (status_pengiriman === 'sampai' && currentShipment.status_pengiriman !== 'sampai') {
            await supabase.from('pesanan').update({ status_pesanan: 'selesai' }).eq('id_pesanan', currentShipment.id_pesanan);
        }

        res.status(200).json({
            message: 'Data pengiriman berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const deletePengiriman = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        if (role !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat menghapus data pengiriman' });
        }

        const { error } = await supabase
            .from('pengiriman')
            .delete()
            .eq('id_pengiriman', id);

        if (error) throw error;

        res.status(200).json({ message: 'Pengiriman berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPengiriman,
    getAllPengiriman,
    getPengirimanById,
    updatePengiriman,
    deletePengiriman
};
