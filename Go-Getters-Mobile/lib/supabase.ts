import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xbeyycvhatzyoqilqjqi.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZXl5Y3ZoYXR6eW9xaWxxanFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0OTUyODYsImV4cCI6MjEwMDA3MTI4Nn0.85mnkV7X2q4_JpkyxNID09-s4QOSp1Buqac9sh3qPZc';

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
