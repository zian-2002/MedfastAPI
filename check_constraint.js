const supabase = require('./src/config/supabase');

async function check() {
    const { data: obatSample } = await supabase.from('obat').select('*').limit(1);
    console.log('Obat columns:', obatSample ? Object.keys(obatSample[0] || {}) : 'null');
    
    const { data: stokSample } = await supabase.from('stok_obat').select('*').limit(1);
    console.log('StokObat columns:', stokSample ? Object.keys(stokSample[0] || {}) : 'null');
}
check();
