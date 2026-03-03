import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cizkskcvenagvvrnklal.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpemtza2N2ZW5hZ3Z2cm5rbGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDc0MzcsImV4cCI6MjA3NTM4MzQzN30.Yqxe2A514NPDO6RUw6a3HspRmKNV8gW4SkS_U30Wakk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLeads() {
    const { data, error, count } = await supabase
        .from('leads')
        .select('id, name, user_id', { count: 'exact' });

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Total leads in DB: ${count}`);
    console.log('Leads names and user_ids:');
    data.forEach(l => console.log(`- ${l.name} (user_id: ${l.user_id})`));
}

checkLeads();
