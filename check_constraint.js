const supabase = require('./src/config/supabase');

async function check() {
    const { data: chatSample } = await supabase.from('chat').select('*').limit(1);
    console.log('Chat columns:', chatSample ? Object.keys(chatSample[0] || {}) : 'null');
    
    const { data: msgSample } = await supabase.from('chat_message').select('*').limit(1);
    console.log('ChatMessage columns:', msgSample ? Object.keys(msgSample[0] || {}) : 'null');
}
check();
