import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tscvzrxnxadnvgnsdrqx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY';

// Create the Supabase client with explicit configuration
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: "10",
    },
  },
});

// Verify the client is properly created
console.log('Supabase client created:', !!supabaseClient);
console.log('Supabase auth available:', !!supabaseClient.auth);
console.log('Supabase getSession available:', typeof supabaseClient.auth.getSession);

// Export the client
export const supabase = supabaseClient;
export default supabase;