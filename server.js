require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http'); // Module HTTP bawaan Node
const { Server } = require('socket.io'); // Socket.io Server
const supabase = require('./src/config/supabase'); // Supabase client untuk simpan chat
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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
const keranjangRoutes = require('./src/routes/keranjangRoutes'); // Import rute keranjang

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Medfast API',
            version: '1.0.0',
            description: 'Dokumentasi API Medfast',
        },
        servers: [
            {
                url: 'https://medfastapi-production.up.railway.app/api',
                description: 'Server Railway'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: [require('path').join(__dirname, './src/routes/*.js').replace(/\\/g, '/')]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
app.use('/api/keranjang', keranjangRoutes);
const fs = require('fs');
const path = require('path');
const presenceFilePath = path.join(__dirname, 'presence.json');

// In-memory presence tracking maps
const onlineUsers = new Map(); // userId -> socketId
const lastSeenMap = new Map();  // userId -> ISO String

// Load presence from file on startup
try {
    if (fs.existsSync(presenceFilePath)) {
        const rawData = fs.readFileSync(presenceFilePath, 'utf8');
        const parsed = JSON.parse(rawData);
        for (const [key, value] of Object.entries(parsed)) {
            lastSeenMap.set(parseInt(key), value);
        }
        console.log('Presence data loaded from file.');
    }
} catch (err) {
    console.error('Error loading presence file:', err.message);
}

// Function to save presence data
function savePresenceToFile() {
    try {
        const obj = {};
        for (const [key, value] of lastSeenMap.entries()) {
            obj[key] = value;
        }
        fs.writeFileSync(presenceFilePath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving presence file:', err.message);
    }
}

// Endpoint presence check (Public, no JWT required)
app.get('/api/chat/presence/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const isOnline = onlineUsers.has(userId);
    
    // Fallback to 5 minutes ago if no last seen data exists
    let lastSeen = lastSeenMap.get(userId) || null;
    if (!isOnline && !lastSeen) {
        const fallbackTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
        lastSeen = fallbackTime.toISOString();
    }
    
    res.json({
        id_user: userId,
        isOnline,
        lastSeen
    });
});

app.use('/api/chat', chatRoutes); // Daftarkan rute chat setelah rute public presence

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

// Pasang io ke objek app agar bisa diakses di controller
app.set('io', io);

// Logika event Socket.io
io.on('connection', (socket) => {
    console.log(`User terhubung ke Socket: ${socket.id}`);

    // Event bergabung untuk mendapatkan pembaruan status pesanan realtime
    socket.on('join_orders_updates', (userId) => {
        if (userId) {
            socket.join(`orders_${userId}`);
            console.log(`Socket ${socket.id} bergabung ke pembaruan pesanan user: ${userId}`);
        }
    });

    // Event mendaftarkan presence
    socket.on('register_presence', (userId) => {
        if (userId) {
            const uid = parseInt(userId);
            socket.userId = uid;
            onlineUsers.set(uid, socket.id);
            const now = new Date().toISOString();
            lastSeenMap.set(uid, now);
            savePresenceToFile();
            console.log(`User ${uid} terdaftar online presence.`);
            io.emit('user_presence_change', {
                userId: uid,
                isOnline: true
            });
        }
    });

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
        if (socket.userId) {
            const uid = socket.userId;
            onlineUsers.delete(uid);
            const now = new Date().toISOString();
            lastSeenMap.set(uid, now);
            savePresenceToFile();
            console.log(`User ${uid} sekarang offline. Terakhir dilihat: ${now}`);
            io.emit('user_presence_change', {
                userId: uid,
                isOnline: false,
                lastSeen: now
            });
        }
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