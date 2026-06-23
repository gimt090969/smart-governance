const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gyerfzrbfczrdxzbkjyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZXJmenJiZmN6cmR4emJranl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTIwMzYsImV4cCI6MjA5MzAyODAzNn0.CIiQQ-Olt4Jncgh2KDyzch6pLIX453vEzG4pyEk9-30';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_column_info', { table_name: 'electric_poles' });
    if (error) {
        console.log("RPC failed, trying raw insert to see error...");
        const payload = {
            pole_code: '123456789012',
            pole_type: '123456789012',
            light_type: '123456789012',
            village_no: '123456789012',
            location_detail: '123456789012',
            lat: 0,
            lng: 0,
            status: '123456789012'
        };
        const { error: insertErr } = await supabase.from('electric_poles').insert([payload]);
        console.log("Insert error:", insertErr);
    } else {
        console.log(data);
    }
}
checkSchema();
