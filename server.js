require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http'); // Module HTTP bawaan Node
const { Server } = require('socket.io'); // Socket.io Server
const supabase = require('./src/config/supabase'); // Supabase client untuk simpan chat

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const obatRoutes = require('./src/routes/obatRoutes');
const apotekRoutes = require('./src/routes/apotekRoutes');
const stokObatRoutes = require('./src/routes/stokObatRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const pesananRoutes = require('./src/routes/pesananRoutes');
const detailPesananRoutes = require('./src/routes/detailPesananRoutes');
const pembayaranRoutes = require('./src/routes/pembayaranRoutes');
const pengirimanRoutes = require('./src/routes/pengirimanRoutes');
const chatRoutes = require('./src/routes/chatRoutes'); // Import rute chat

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// TEST API
// ==============================
app.get('/', (req, res) => {
    res.json({
        message: 'API Medfast berhasil jalan 🚀'
    });
});

// ==============================
// ROUTES API
// ==============================
app.use('/api/auth', authRoutes);
app.use('/api/obat', obatRoutes);
app.use('/api/apotek', apotekRoutes);
app.use('/api/stok-obat', stokObatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/pesanan', pesananRoutes);
app.use('/api/detail-pesanan', detailPesananRoutes);
app.use('/api/pembayaran', pembayaranRoutes);
app.use('/api/pengiriman', pengirimanRoutes);
app.use('/api/chat', chatRoutes); // Daftarkan rute chat

// ==============================
// HTTP & SOCKET.IO SERVER SETUP
// ==============================
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Mengizinkan semua domain (misal dari Flutter)
        methods: ["GET", "POST"]
    }
});

// Logika event Socket.io
io.on('connection', (socket) => {
    console.log(`User terhubung ke Socket: ${socket.id}`);

    // Event ketika client masuk ke room chat tertentu
    socket.on('join_room', (chatId) => {
        if (chatId) {
            socket.join(chatId.toString());
            console.log(`Socket ${socket.id} bergabung ke room: ${chatId}`);
        }
    });

    // Event ketika client mengirim pesan
    socket.on('send_message', async (data) => {
        try {
            const { id_chat, id_pengirim, pesan } = data;

            if (!id_chat || !id_pengirim || !pesan) {
                console.log("Data send_message tidak lengkap:", data);
                return;
            }

            // Simpan pesan baru ke database Supabase
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
                console.error("Gagal menyimpan pesan ke Supabase:", error);
                return;
            }

            // Broadcast pesan ke seluruh client di room yang sama
            io.to(id_chat.toString()).emit('receive_message', newMsg[0]);
            console.log(`Pesan terkirim di room ${id_chat} oleh user ${id_pengirim}`);

        } catch (err) {
            console.error("Error pada event send_message:", err.message);
        }
    });

    // Event ketika client disconnect
    socket.on('disconnect', () => {
        console.log(`User terputus dari Socket: ${socket.id}`);
    });
});

// ==============================
// PORT & START SERVER
// ==============================
const PORT = process.env.PORT || 3000;

// Menjalankan HTTP server pembungkus Express + Socket.io
server.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
});