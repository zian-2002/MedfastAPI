const supabase = require('../config/supabase');
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// 1. Membuat pembayaran baru
const createPembayaran = async (req, res) => {
    try {
        const { id_pesanan, metode_pembayaran, status_pembayaran } = req.body;

        // Validasi input
        if (!id_pesanan || !metode_pembayaran) {
            return res.status(400).json({ message: 'id_pesanan dan metode_pembayaran wajib diisi' });
        }

        // Cek apakah pesanan ada
        const { data: pesanan, error: pesananError } = await supabase
            .from('pesanan')
            .select('*')
            .eq('id_pesanan', id_pesanan)
            .maybeSingle();

        if (pesananError || !pesanan) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }

        const statusBayar = status_pembayaran || 'belum_bayar';
        const tanggalBayar = statusBayar === 'lunas' ? new Date() : null;

        const { data, error } = await supabase
            .from('pembayaran')
            .insert([
                {
                    id_pesanan,
                    metode_pembayaran,
                    status_pembayaran: statusBayar,
                    tanggal_pembayaran: tanggalBayar
                }
            ])
            .select();

        if (error) throw error;

        // Logika Bisnis: Jika pembayaran langsung lunas, update status_pesanan menjadi 'diproses'
        if (statusBayar === 'lunas') {
            await supabase
                .from('pesanan')
                .update({ status_pesanan: 'diproses' })
                .eq('id_pesanan', id_pesanan);
        }

        res.status(201).json({
            message: 'Pembayaran berhasil dicatat',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Mendapatkan daftar pembayaran
// - Admin: Bisa melihat seluruh pembayaran
// - User biasa: Hanya melihat pembayaran miliknya sendiri menggunakan Supabase inner join filter
const getAllPembayaran = async (req, res) => {
    try {
        const id_user = req.user.id_user;
        const role = req.user.role;

        let query = supabase
            .from('pembayaran')
            .select('*, pesanan!inner(*)');

        if (role !== 'admin') {
            query = query.eq('pesanan.id_user', id_user);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Mendapatkan detail pembayaran berdasarkan ID
const getPembayaranById = async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.id_user;
        const role = req.user.role;

        const { data, error } = await supabase
            .from('pembayaran')
            .select('*, pesanan(*)')
            .eq('id_pembayaran', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });

        // Keamanan: Cek kepemilikan pembayaran jika bukan admin
        if (role !== 'admin' && data.pesanan.id_user !== id_user) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses ke data pembayaran ini.' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Memperbarui status/metode pembayaran
// (Admin atau pihak sistem payment gateway dapat mengubah status pembayaran)
const updatePembayaran = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_pembayaran, metode_pembayaran } = req.body;

        // Ambil data pembayaran lama
        const { data: currentPayment, error: fetchError } = await supabase
            .from('pembayaran')
            .select('*, pesanan(*)')
            .eq('id_pembayaran', id)
            .maybeSingle();

        if (fetchError || !currentPayment) {
            return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
        }

        const updateData = {};
        if (metode_pembayaran) updateData.metode_pembayaran = metode_pembayaran;
        
        if (status_pembayaran) {
            updateData.status_pembayaran = status_pembayaran;
            // Jika berubah menjadi lunas, set tanggal pembayaran ke saat ini
            if (status_pembayaran === 'lunas' && currentPayment.status_pembayaran !== 'lunas') {
                updateData.tanggal_pembayaran = new Date();
            }
        }

        const { data, error } = await supabase
            .from('pembayaran')
            .update(updateData)
            .eq('id_pembayaran', id)
            .select();

        if (error) throw error;

        // Logika Bisnis: Jika pembayaran diperbarui menjadi lunas, update status_pesanan menjadi 'diproses'
        if (status_pembayaran === 'lunas' && currentPayment.status_pembayaran !== 'lunas') {
            await supabase
                .from('pesanan')
                .update({ status_pesanan: 'diproses' })
                .eq('id_pesanan', currentPayment.id_pesanan);
        }

        res.status(200).json({
            message: 'Data pembayaran berhasil diperbarui',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Menghapus pembayaran (Admin Only)
const deletePembayaran = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        if (role !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat menghapus data pembayaran' });
        }

        const { error } = await supabase
            .from('pembayaran')
            .delete()
            .eq('id_pembayaran', id);

        if (error) throw error;

        res.status(200).json({ message: 'Pembayaran berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. Mendapatkan token snap untuk pembayaran Midtrans
const getSnapToken = async (req, res) => {
    try {
        const { id_pesanan } = req.body;

        if (!id_pesanan) {
            return res.status(400).json({ message: 'id_pesanan wajib diisi' });
        }

        // Ambil data pesanan dan join dengan data user
        const { data: pesanan, error: pesananError } = await supabase
            .from('pesanan')
            .select('*, users(*)')
            .eq('id_pesanan', id_pesanan)
            .maybeSingle();

        if (pesananError || !pesanan) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }

        const user = pesanan.users || {};

        // Generate ID transaksi unik untuk Midtrans
        const midtransOrderId = `MEDFAST-ORDER-${id_pesanan}-${Date.now()}`;

        const parameter = {
            transaction_details: {
                order_id: midtransOrderId,
                gross_amount: Math.round(pesanan.total_harga)
            },
            customer_details: {
                first_name: user.nama || 'Pelanggan',
                email: user.email || 'pelanggan@medfast.com',
                phone: user.no_hp || '08123456789'
            }
        };

        // Buat transaksi di Midtrans
        const transaction = await snap.createTransaction(parameter);
        const snapToken = transaction.token;
        const redirectUrl = transaction.redirect_url;

        // Cek apakah data pembayaran untuk pesanan ini sudah ada
        const { data: existingPayment } = await supabase
            .from('pembayaran')
            .select('*')
            .eq('id_pesanan', id_pesanan)
            .maybeSingle();

        if (existingPayment) {
            // Update data pembayaran yang sudah ada
            const { error: updateError } = await supabase
                .from('pembayaran')
                .update({
                    snap_token: snapToken,
                    payment_url: redirectUrl,
                    midtrans_order_id: midtransOrderId,
                    metode_pembayaran: 'Midtrans'
                })
                .eq('id_pembayaran', existingPayment.id_pembayaran);

            if (updateError) throw updateError;
        } else {
            // Buat data pembayaran baru jika belum ada
            const { error: insertError } = await supabase
                .from('pembayaran')
                .insert([
                    {
                        id_pesanan,
                        metode_pembayaran: 'Midtrans',
                        status_pembayaran: 'belum_bayar',
                        snap_token: snapToken,
                        payment_url: redirectUrl,
                        midtrans_order_id: midtransOrderId
                    }
                ]);

            if (insertError) throw insertError;
        }

        res.status(200).json({
            snap_token: snapToken,
            payment_url: redirectUrl
        });

    } catch (error) {
        console.error('Error in getSnapToken:', error);
        res.status(500).json({ message: error.message });
    }
};

// 7. Menangani Webhook Callback Notification dari Midtrans
const handleMidtransNotification = async (req, res) => {
    try {
        const notificationJson = req.body;
        console.log('Received notification body:', notificationJson);

        const statusResponse = await snap.transaction.notification(notificationJson);
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Transaction notification received. Order ID: ${orderId}. Status: ${transactionStatus}. Fraud: ${fraudStatus}`);

        // Ambil id_pesanan dari orderId
        const parts = orderId.split('-');
        const idPesanan = parseInt(parts[2]);

        if (isNaN(idPesanan)) {
            return res.status(400).json({ message: 'Format order ID tidak valid' });
        }

        let pembayaranStatus = 'belum_bayar';
        let pesananStatus = 'menunggu';

        if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
                pembayaranStatus = 'belum_bayar';
                pesananStatus = 'menunggu';
            } else if (fraudStatus === 'accept') {
                pembayaranStatus = 'lunas';
                pesananStatus = 'diproses';
            }
        } else if (transactionStatus === 'settlement') {
            pembayaranStatus = 'lunas';
            pesananStatus = 'diproses';
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            pembayaranStatus = 'gagal';
            pesananStatus = 'dibatalkan';
        } else if (transactionStatus === 'pending') {
            pembayaranStatus = 'belum_bayar';
            pesananStatus = 'menunggu';
        }

        let detailMetode = 'Online';
        if (statusResponse.payment_type) {
            if (statusResponse.payment_type === 'bank_transfer' && statusResponse.va_numbers && statusResponse.va_numbers.length > 0) {
                detailMetode = statusResponse.va_numbers[0].bank.toUpperCase();
            } else {
                detailMetode = statusResponse.payment_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        }

        const updatePembayaran = {
            status_pembayaran: pembayaranStatus,
            metode_pembayaran: detailMetode
        };
        if (pembayaranStatus === 'lunas') {
            updatePembayaran.tanggal_pembayaran = new Date();
        }

        // Update status pembayaran
        const { error: paymentUpdateError } = await supabase
            .from('pembayaran')
            .update(updatePembayaran)
            .eq('id_pesanan', idPesanan);

        if (paymentUpdateError) throw paymentUpdateError;

        // Update status pesanan
        const { error: orderUpdateError } = await supabase
            .from('pesanan')
            .update({ status_pesanan: pesananStatus })
            .eq('id_pesanan', idPesanan);

        if (orderUpdateError) throw orderUpdateError;

        // Emit Socket.io event update secara realtime ke pelanggan
        const io = req.app.get('io');
        if (io) {
            const { data: pesanan } = await supabase
                .from('pesanan')
                .select('id_user')
                .eq('id_pesanan', idPesanan)
                .maybeSingle();

            if (pesanan) {
                console.log(`Emitting realtime status update to user ${pesanan.id_user}`);
                io.to(`orders_${pesanan.id_user}`).emit('order_status_updated', {
                    id_pesanan: idPesanan,
                    status_pesanan: pesananStatus,
                    status_pembayaran: pembayaranStatus
                });
            }
        }

        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('Error in handleMidtransNotification:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPembayaran,
    getAllPembayaran,
    getPembayaranById,
    updatePembayaran,
    deletePembayaran,
    getSnapToken,
    handleMidtransNotification
};
