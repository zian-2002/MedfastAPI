const supabase = require('../config/supabase');


const getOrCreateRoom = async (req, res) => {
    try {
        const { id_pelanggan, id_admin, id_apotek } = req.body;

        if (!id_pelanggan || !id_apotek) {
            return res.status(400).json({ message: 'id_pelanggan dan id_apotek wajib diisi' });
        }

        
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


const getUserRooms = async (req, res) => {
    try {
        const { userId } = req.params;
        const role = req.user.role;
        let id_apotek = req.user.id_apotek;

        
        if (role === 'admin' && !id_apotek) {
            const { data: userDb } = await supabase
                .from('users')
                .select('id_apotek')
                .eq('id_user', req.user.id_user)
                .single();
            if (userDb) {
                id_apotek = userDb.id_apotek;
            }
        }

        let query = supabase
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
            `);

        
        if (role === 'admin' && id_apotek) {
            query = query.eq('id_apotek', id_apotek);
        } else {
            
            query = query.or(`id_pelanggan.eq.${userId},id_admin.eq.${userId}`);
        }

        const { data: rooms, error } = await query.order('tanggal_chat', { ascending: false });

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


const sendMessage = async (req, res) => {
    try {
        const { id_chat, id_pengirim, pesan } = req.body;

        if (!id_chat || !id_pengirim || !pesan) {
            return res.status(400).json({ message: 'id_chat, id_pengirim, dan pesan wajib diisi' });
        }

        
        const { data: newMsg, error } = await supabase
            .from('chat_message')
            .insert([
                {
                    id_chat: parseInt(id_chat),
                    id_pengirim: parseInt(id_pengirim),
                    pesan: pesan,
                    waktu_kirim: new Date()
                }
            ])
            .select(`
                *,
                pengirim:users!id_pengirim (
                    nama,
                    role
                )
            `);

        if (error) {
            return res.status(500).json({ message: 'Gagal mengirim pesan', error });
        }

        
        const { data: roomCheck } = await supabase
            .from('chat')
            .select('id_admin')
            .eq('id_chat', id_chat)
            .maybeSingle();

        if (roomCheck && !roomCheck.id_admin) {
            const { data: userCheck } = await supabase
                .from('users')
                .select('role')
                .eq('id_user', id_pengirim)
                .maybeSingle();

            if (userCheck && userCheck.role === 'admin') {
                await supabase
                    .from('chat')
                    .update({ id_admin: id_pengirim })
                    .eq('id_chat', id_chat);
            }
        }

        
        const io = req.app.get('io');
        if (io) {
            io.to(id_chat.toString()).emit('receive_message', newMsg[0]);
        }

        res.status(201).json({
            message: 'Pesan berhasil dikirim',
            data: newMsg[0]
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getOrCreateRoom,
    getUserRooms,
    getChatMessages,
    uploadChatImage,
    sendMessage
};
