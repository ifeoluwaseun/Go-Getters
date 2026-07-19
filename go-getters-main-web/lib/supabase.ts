import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hpgqymzqmtgbjgseqouk.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZ3F5bXpxbXRnYmpnc2Vxb3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTczMzUsImV4cCI6MjA5NDYzMzMzNX0.IFySz0U-GmUu5jjoJJL0wtS4lL1Wwr742FG9UPbZ434";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
