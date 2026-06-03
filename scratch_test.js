const supabase = require('./src/config/supabase');

async function test() {
    try {
        const { data, error } = await supabase
            .from('pesanan')
            .select('*')
            .limit(5);
        if (error) throw error;
        console.log('Pesanan list:', data);
        
        if (data.length > 0) {
            const firstId = data[0].id_pesanan;
            console.log(`Testing status update for id ${firstId} to 'dikirim'...`);
            const { data: updated, error: updateError } = await supabase
                .from('pesanan')
                .update({ status_pesanan: 'dikirim' })
                .eq('id_pesanan', firstId)
                .select();
            if (updateError) {
                console.error('Update error:', updateError);
            } else {
                console.log('Update success:', updated);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

test();
