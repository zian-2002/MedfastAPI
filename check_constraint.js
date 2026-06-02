const supabase = require('./src/config/supabase');

async function check() {
    const { data, error } = await supabase.rpc('get_constraints_info'); // if rpc exists
    console.log('RPC check:', data, error);
    
    // Let's query information_schema via query or see if we can read table structure
    const { data: cols, error: err2 } = await supabase.from('pesanan').select('*').limit(1);
    console.log('Columns sample:', cols, err2);
    
    // Let's try to insert different status values to see what fails and what passes
    const statuses = ['pending', 'PENDING', 'Diproses', 'DIPROSES', 'dikirim', 'DIKIRIM', 'selesai', 'SELESAI', 'dibatalkan', 'DIBATALKAN', 'Menunggu Pembayaran', 'Belum Bayar'];
    for (const status of statuses) {
        const { error: insErr } = await supabase.from('pesanan').insert([{
            id_user: 1, // Let's check a valid user id, maybe user ID 1 exists or not
            id_apotek: 1,
            total_harga: 100,
            status_pesanan: status,
            tanggal_pesanan: new Date()
        }]);
        console.log(`Status "${status}":`, insErr ? insErr.message : 'SUCCESS');
    }
}
check();
