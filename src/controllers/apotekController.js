const supabase = require('../config/supabase');

// Mengambil semua data apotek
const getAllApotek = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('apotek')
            .select('*');

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllApotek
};
