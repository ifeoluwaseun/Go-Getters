import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wztkebclvocsdxnfxmbw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dGtlYmNsdm9jc2R4bmZ4bWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODUzMDYsImV4cCI6MjA5NTY2MTMwNn0.m2-QXglXKGZ8gynTciaR2CaPJ4I1Wqsepr8tTEMBq5s";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
