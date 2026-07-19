import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hpgqymzqmtgbjgseqouk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZ3F5bXpxbXRnYmpnc2Vxb3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTczMzUsImV4cCI6MjA5NDYzMzMzNX0.IFySz0U-GmUu5jjoJJL0wtS4lL1Wwr742FG9UPbZ434';

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
