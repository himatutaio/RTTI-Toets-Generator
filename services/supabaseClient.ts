import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ieshxvcwuekhukwlajxc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllc2h4dmN3dWVraHVrd2xhanhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY3MDgsImV4cCI6MjA4MDMyMjcwOH0._toxPmboYTgUesN7ucfXNIEhGC9ArI8kNFD-5q641R0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);