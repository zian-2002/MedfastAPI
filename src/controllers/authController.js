const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { nama, email, password, no_hp, alamat, role, kode_apotek } = req.body;

        const { data: cekUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (cekUser) {
            return res.status(400).json({ message: 'Email sudah digunakan' });
        }

        let resolvedIdApotek = null;

        if (role === 'admin') {
            if (!kode_apotek) {
                return res.status(400).json({ message: 'Registrasi admin wajib memasukkan kode apotek' });
            }

            const { data: apotek, error: apotekError } = await supabase
                .from('apotek')
                .select('*')
                .eq('kode_apotek', kode_apotek)
                .single();

            if (apotekError || !apotek) {
                return res.status(400).json({ message: 'Kode apotek tidak valid atau tidak ditemukan' });
            }

            resolvedIdApotek = apotek.id_apotek;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    nama,
                    email,
                    password: hashedPassword,
                    no_hp,
                    alamat,
                    role,
                    id_apotek: resolvedIdApotek
                }
            ])
            .select();

        if (insertError || !newUser || newUser.length === 0) {
            return res.status(500).json({ message: 'Error server saat membuat user', error: insertError });
        }

        res.status(201).json({
            message: 'Register berhasil',
            data: newUser[0]
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user || error) {
            return res.status(400).json({ message: 'Email tidak ditemukan' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Password salah' });
        }

        const token = jwt.sign(
            {
                id_user: user.id_user,
                role: user.role,
                id_apotek: user.id_apotek
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id_user: user.id_user,
                nama: user.nama,
                email: user.email,
                no_hp: user.no_hp,
                alamat: user.alamat,
                role: user.role,
                id_apotek: user.id_apotek
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    register,
    login
};
