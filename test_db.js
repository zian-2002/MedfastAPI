require('dotenv').config({ path: 'c:/SEMESTER 4/PAA/APIPBM/MedfastAPI/.env' });
const supabase = require('./src/config/supabase');

async function test() {
    try {
        const { data: stock, error: stockErr } = await supabase.from('stok_obat').select('*');
        if (stockErr) console.error('Error stock:', stockErr);
        else console.log('STOK OBAT:', JSON.stringify(stock, null, 2));

        const { data: obat, error: obatErr } = await supabase.from('obat').select('*');
        if (obatErr) console.error('Error obat:', obatErr);
        else console.log('OBAT:', JSON.stringify(obat, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
