import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cizkskcvenagvvrnklal.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpemtza2N2ZW5hZ3Z2cm5rbGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDc0MzcsImV4cCI6MjA3NTM4MzQzN30.Yqxe2A514NPDO6RUw6a3HspRmKNV8gW4SkS_U30Wakk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in leads table:', Object.keys(data[0]));
    } else {
        console.log('No leads found in DB');
    }
}

checkLeads();
