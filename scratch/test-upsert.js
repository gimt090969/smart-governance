const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gyerfzrbfczrdxzbkjyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZXJmenJiZmN6cmR4emJranl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTIwMzYsImV4cCI6MjA5MzAyODAzNn0.CIiQQ-Olt4Jncgh2KDyzch6pLIX453vEzG4pyEk9-30';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpsert() {
    const payload1 = { pole_code: 'TEST_01', pole_type: 'Test', village_no: '1', light_type: 'Test', status: 'normal' };
    const payload2 = { pole_code: 'TEST_01', pole_type: 'Test Update', village_no: '1', light_type: 'Test', status: 'normal' };
    
    console.log("Upserting payload1...");
    let res1 = await supabase.from('electric_poles').upsert([payload1], { onConflict: 'pole_code' });
    console.log(res1.error);
    
    console.log("Upserting payload2...");
    let res2 = await supabase.from('electric_poles').upsert([payload2], { onConflict: 'pole_code' });
    console.log(res2.error);
    
    console.log("Deleting test record...");
    await supabase.from('electric_poles').delete().eq('pole_code', 'TEST_01');
}
testUpsert();
