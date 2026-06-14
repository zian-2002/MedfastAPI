const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');




const getProfile = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { data, error } = await supabase
            .from('users')
            .select('id_user, nama, email, no_hp, alamat, role, id_apotek')
            .eq('id_user', id_user)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                message: 'User tidak ditemukan'
            });
        }

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};




const updateProfile = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { nama, no_hp, alamat } = req.body;

        
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id_user', id_user)
            .single();

        if (userError) throw userError;

        let updateData = {};
        if (nama !== undefined) updateData.nama = nama;
        if (no_hp !== undefined) updateData.no_hp = no_hp;

        
        if (user.role === 'pelanggan' && alamat !== undefined) {
            updateData.alamat = alamat;
        }

        
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id_user', id_user)
            .select('id_user, nama, email, no_hp, alamat, role, id_apotek');

        if (error) throw error;

        res.status(200).json({
            message: 'Profile berhasil diperbarui',
            data: data[0]
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};




const changePassword = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { old_password, new_password } = req.body;

        
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id_user', id_user)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({
                message: 'User tidak ditemukan'
            });
        }

        
        const validPassword = await bcrypt.compare(
            old_password,
            user.password
        );

        if (!validPassword) {
            return res.status(400).json({
                message: 'Password lama salah'
            });
        }

        
        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedNewPassword
            })
            .eq('id_user', id_user);

        if (updateError) throw updateError;

        res.status(200).json({
            message: 'Password berhasil diubah'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};