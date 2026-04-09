import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msoatedxeubwfpmthpqb.supabase.co';
const supabaseAnonKey = 'sb_publishable_eIhPpMvrcNiglbYetpv1Rg_jdFxOEBV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
