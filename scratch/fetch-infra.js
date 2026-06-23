const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gyerfzrbfczrdxzbkjyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZXJmenJiZmN6cmR4emJranl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTIwMzYsImV4cCI6MjA5MzAyODAzNn0.CIiQQ-Olt4Jncgh2KDyzch6pLIX453vEzG4pyEk9-30';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tables = [
    'infra_roads',
    'infra_water_resources',
    'infra_waterways',
    'infra_drainage_assets',
    'infra_public_lands',
    'infra_boundary_markers'
];

async function checkData() {
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.log(`Error reading ${table}: ${error.message}`);
        } else {
            console.log(`\n--- ${table} (${data.length} records shown) ---`);
            data.forEach(r => console.log(JSON.stringify(r)));
        }
    }
}

checkData();
