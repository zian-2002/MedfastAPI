const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

// Mendapatkan profile diri sendiri berdasarkan JWT Token
const getProfile = async (req, res) => {
    try {
        // req.user.id_user didapat dari authMiddleware (authenticateJWT)
        const id_user = req.user.id_user;

        const { data, error } = await supabase
            .from('users')
            .select('id_user, nama, email, no_hp, alamat, role') // Mengecualikan password agar aman
            .eq('id_user', id_user)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'User tidak ditemukan' });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mengupdate profile sendiri (nama, no_hp, alamat)
const updateProfile = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const { nama, no_hp, alamat } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({
                nama,
                no_hp,
                alamat
            })
            .eq('id_user', id_user)
            .select('id_user, nama, email, no_hp, alamat, role'); // Jangan me-return password

        if (error) throw error;

        res.status(200).json({
            message: 'Profile berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mengubah password
const changePassword = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const { old_password, new_password } = req.body;

        // 1. Ambil data user dari database untuk mendapatkan password lama yang sudah di-hash
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id_user', id_user)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        // 2. Bandingkan old_password yang diinput dengan password di database
        const validPassword = await bcrypt.compare(old_password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Password lama salah!' });
        }

        // 3. Hash password baru
        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        // 4. Update password di database
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedNewPassword })
            .eq('id_user', id_user);

        if (updateError) throw updateError;

        res.status(200).json({ message: 'Password berhasil diubah' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};
