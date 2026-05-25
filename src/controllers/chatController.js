const supabase = require('../config/supabase');

// Mendapatkan atau membuat room chat baru antara pelanggan dan apotek
const getOrCreateRoom = async (req, res) => {
    try {
        const { id_pelanggan, id_admin, id_apotek } = req.body;

        if (!id_pelanggan || !id_apotek) {
            return res.status(400).json({ message: 'id_pelanggan dan id_apotek wajib diisi' });
        }

        // Cari apakah room sudah ada untuk pelanggan dan apotek ini
        const { data: existingRoom, error: selectError } = await supabase
            .from('chat')
            .select('*')
            .eq('id_pelanggan', id_pelanggan)
            .eq('id_apotek', id_apotek);

        if (selectError) {
            return res.status(500).json({ message: 'Gagal mengecek room chat', error: selectError });
        }

        if (existingRoom && existingRoom.length > 0) {
            return res.json({
                message: 'Room chat ditemukan',
                data: existingRoom[0]
            });
        }

        // Jika belum ada, buat room baru
        const { data: newRoom, error: insertError } = await supabase
            .from('chat')
            .insert([
                { id_pelanggan, id_admin, id_apotek }
            ])
            .select();

        if (insertError) {
            return res.status(500).json({ message: 'Gagal membuat room chat baru', error: insertError });
        }

        res.status(201).json({
            message: 'Room chat baru berhasil dibuat',
            data: newRoom[0]
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mendapatkan daftar semua room chat milik user tertentu (baik pelanggan maupun admin)
const getUserRooms = async (req, res) => {
    try {
        const { userId } = req.params;

        // Query room chat yang melibatkan userId sebagai pelanggan atau admin
        const { data: rooms, error } = await supabase
            .from('chat')
            .select(`
                *,
                apotek (
                    nama_apotek,
                    alamat
                ),
                pelanggan:users!id_pelanggan (
                    nama,
                    email
                ),
                admin:users!id_admin (
                    nama,
                    email
                )
            `)
            .or(`id_pelanggan.eq.${userId},id_admin.eq.${userId}`)
            .order('tanggal_chat', { ascending: false });

        if (error) {
            return res.status(500).json({ message: 'Gagal mengambil daftar room chat', error });
        }

        res.json({
            message: 'Berhasil mengambil daftar room chat',
            data: rooms
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mendapatkan seluruh riwayat pesan dari room chat tertentu
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        const { data: messages, error } = await supabase
            .from('chat_message')
            .select(`
                *,
                pengirim:users!id_pengirim (
                    nama,
                    role
                )
            `)
            .eq('id_chat', chatId)
            .order('waktu_kirim', { ascending: true });

        if (error) {
            return res.status(500).json({ message: 'Gagal mengambil riwayat pesan', error });
        }

        res.json({
            message: 'Berhasil mengambil riwayat pesan',
            data: messages
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mengunggah gambar ke Supabase Storage (bucket: chat_images)
const uploadChatImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file gambar yang diunggah' });
        }

        const fileName = `${Date.now()}-${req.file.originalname}`;
        const { data, error } = await supabase.storage
            .from('chat_images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype
            });

        if (error) throw error;

        // Dapatkan Public URL untuk disimpan/dikirim di chat
        const { data: publicUrlData } = supabase.storage
            .from('chat_images')
            .getPublicUrl(fileName);

        res.status(200).json({
            message: 'Upload gambar berhasil',
            url: publicUrlData.publicUrl
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getOrCreateRoom,
    getUserRooms,
    getChatMessages,
    uploadChatImage
};
