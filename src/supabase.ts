import { createClient } from '@supabase/supabase-js';

// Reemplaza esto con tu Project URL
const supabaseUrl ='https://rwzufdpnlfsxhyfwvyvr.supabase.co';

// Reemplaza esto con tu API Key (anon, public)
const supabaseKey = 'sb_publishable_14yPMDCisB2abNx310hWbg_OTHEORSs';

export const supabase = createClient(supabaseUrl, supabaseKey);