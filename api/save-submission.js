const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { answers } = req.body || {};
    if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ error: 'Missing answers' });
    }

    const { error } = await supabase
        .from('submissions')
        .insert({ answers });

    if (error) {
        console.error('Supabase error:', error.message);
        return res.status(500).json({ error: 'Failed to save submission' });
    }

    return res.status(200).json({ success: true });
};
