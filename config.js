// Public config for the DGC Dayworks client site.
// The anon key here can only ever reach the low-sensitivity "queries"
// table (submitting a query) — it is never used to read dgc_dayworks_entries
// directly. All hours/photo data comes from the dayworks-client-data
// Edge Function instead, which filters server-side with the service-role
// key before anything reaches this page.
const SUPABASE_URL = 'https://vigdtpcgeqenznuakdwz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nUG65QtsU2p1-hWpdUuaSQ_bF4G1EGQ';
