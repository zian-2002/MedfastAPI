require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const supabase = require('./src/config/supabase'); 
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const authRoutes = require('./src/routes/authRoutes');
const obatRoutes = require('./src/routes/obatRoutes');
const apotekRoutes = require('./src/routes/apotekRoutes');
const stokObatRoutes = require('./src/routes/stokObatRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const pesananRoutes = require('./src/routes/pesananRoutes');
const detailPesananRoutes = require('./src/routes/detailPesananRoutes');
const pembayaranRoutes = require('./src/routes/pembayaranRoutes');
const pengirimanRoutes = require('./src/routes/pengirimanRoutes');
const chatRoutes = require('./src/routes/chatRoutes'); 
const keranjangRoutes = require('./src/routes/keranjangRoutes'); 

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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




app.get('/', (req, res) => {
    res.json({
        message: 'API Medfast berhasil jalan 🚀'
    });
});




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


const onlineUsers = new Map(); 
const lastSeenMap = new Map();  


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


app.get('/api/chat/presence/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const isOnline = onlineUsers.has(userId);
    
    
    let lastSeen = lastSeenMap.get(userId) || null;
    if (!isOnline && !lastSeen) {
        const fallbackTime = new Date(Date.now() - 5 * 60 * 1000); 
        lastSeen = fallbackTime.toISOString();
    }
    
    res.json({
        id_user: userId,
        isOnline,
        lastSeen
    });
});

app.use('/api/chat', chatRoutes); 




const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});


app.set('io', io);


io.on('connection', (socket) => {
    console.log(`User terhubung ke Socket: ${socket.id}`);

    
    socket.on('join_orders_updates', (userId) => {
        if (userId) {
            socket.join(`orders_${userId}`);
            console.log(`Socket ${socket.id} bergabung ke pembaruan pesanan user: ${userId}`);
        }
    });

    
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

    
    socket.on('join_room', (chatId) => {
        if (chatId) {
            socket.join(chatId.toString());
            console.log(`Socket ${socket.id} bergabung ke room: ${chatId}`);
        }
    });

    
    socket.on('send_message', async (data) => {
        try {
            const { id_chat, id_pengirim, pesan } = data;

            if (!id_chat || !id_pengirim || !pesan) {
                console.log("Data send_message tidak lengkap:", data);
                return;
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
                console.error("Gagal menyimpan pesan ke Supabase:", error);
                return;
            }

            
            io.to(id_chat.toString()).emit('receive_message', newMsg[0]);
            console.log(`Pesan terkirim di room ${id_chat} oleh user ${id_pengirim}`);

        } catch (err) {
            console.error("Error pada event send_message:", err.message);
        }
    });

    
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




const PORT = process.env.PORT || 3000;


server.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
});