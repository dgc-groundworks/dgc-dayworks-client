// Public config for the DGC Dayworks client site.
// The anon key here can only ever reach the low-sensitivity "queries"
// table (submitting a query) — it is never used to read dgc_dayworks_entries
// directly. All hours/photo data comes from the dayworks-client-data
// Edge Function instead, which filters server-side with the service-role
// key before anything reaches this page.
const SUPABASE_URL = 'https://vigdtpcgeqenznuakdwz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZ2R0cGNnZXFlbnpudWFrZHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTI1MzQsImV4cCI6MjEwMjk4ODUzNH0.9hjdS6ATFVaYwwKcZQqTpQxbIuSDrxbO07r4MmXXadQ';
