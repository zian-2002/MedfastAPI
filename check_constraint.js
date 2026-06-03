const supabase = require('./src/config/supabase');

async function check() {
    const { data, error } = await supabase
        .from('pesanan')
        .select('status_pesanan');
    if (error) {
        console.error(error);
        return;
    }
    const uniqueStatuses = [...new Set(data.map(d => d.status_pesanan))];
    console.log('Unique statuses in database:', uniqueStatuses);
}
check();
