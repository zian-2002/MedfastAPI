const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

// ==========================================
// GET PROFILE
// ==========================================
const getProfile = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { data, error } = await supabase
            .from('users')
            .select('id_user, nama, email, no_hp, alamat, role')
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

// ==========================================
// UPDATE PROFILE
// ==========================================
const updateProfile = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { nama, no_hp, alamat } = req.body;

        // ambil role user dulu
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id_user', id_user)
            .single();

        if (userError) throw userError;

        let updateData = {
            nama,
            no_hp
        };

        // kalau pelanggan boleh edit alamat
        if (user.role === 'pelanggan') {
            updateData.alamat = alamat;
        }

        // kalau admin alamat tidak diubah
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id_user', id_user)
            .select('id_user, nama, email, no_hp, alamat, role');

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

// ==========================================
// CHANGE PASSWORD
// ==========================================
const changePassword = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        const { old_password, new_password } = req.body;

        // ambil data user
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

        // cek password lama
        const validPassword = await bcrypt.compare(
            old_password,
            user.password
        );

        if (!validPassword) {
            return res.status(400).json({
                message: 'Password lama salah'
            });
        }

        // hash password baru
        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        // update password
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