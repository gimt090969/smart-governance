const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gyerfzrbfczrdxzbkjyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZXJmenJiZmN6cmR4emJranl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTIwMzYsImV4cCI6MjA5MzAyODAzNn0.CIiQQ-Olt4Jncgh2KDyzch6pLIX453vEzG4pyEk9-30';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getCoords() {
    const { data: roads } = await supabase.from('infra_roads').select('latitude, longitude').not('latitude', 'is', null).limit(1);
    console.log("Road coords:", roads);
    const { data: markers } = await supabase.from('infra_boundary_markers').select('latitude, longitude').not('latitude', 'is', null).limit(1);
    console.log("Marker coords:", markers);
}
getCoords();
