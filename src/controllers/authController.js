const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { nama, email, password, no_hp, alamat, role } = req.body;

        // Cek apakah email sudah ada
        const { data: cekUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (cekUser) {
            return res.status(400).json({ message: 'Email sudah digunakan' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user baru
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    nama,
                    email,
                    password: hashedPassword,
                    no_hp,
                    alamat,
                    role
                }
            ])
            .select();

        if (error) {
            return res.status(500).json({ message: 'Error server', error });
        }

        res.status(201).json({
            message: 'Register berhasil',
            data: data[0]
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cek user berdasarkan email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user || error) {
            return res.status(400).json({ message: 'Email tidak ditemukan' });
        }

        // Cek validitas password
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Password salah' });
        }

        // Generate token
        const token = jwt.sign(
            {
                id_user: user.id_user,
                role: user.role
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
                role: user.role
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
