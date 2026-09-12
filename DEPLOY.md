# DGC Dayworks — Deploy & API Reference

Durable copy of everything needed to deploy or redeploy the public Dandara-facing Dayworks site. Whenever Claude gives Ash Edge Function / API code for this project, it gets saved here too, so it's never only in chat scrollback.

## Live links

- **Public site (send this to Dandara/Kal):** https://dgc-groundworks.github.io/dgc-dayworks-client/
- **Private Job Planner (internal, everything):** https://dgc-groundworks.github.io/dgc-ballasalla/planner/
- **Dayworks tab specifically:** https://dgc-groundworks.github.io/dgc-ballasalla/planner/dayworks.html
- **Repo (this site):** https://github.com/dgc-groundworks/dgc-dayworks-client
- **Repo (Job Planner / internal app):** https://github.com/dgc-groundworks/dgc-ballasalla
- **Supabase project:** `vigdtpcgeqenznuakdwz` (same project backs both the internal Job Planner and this public site)

## Edge Function: `dayworks-client-data`

This is the one server-side piece that lets the public site show only approved hours, without ever giving the public page a key that can read the raw table. Deploy via Supabase Dashboard → Edge Functions → Deploy new function → name it exactly `dayworks-client-data` → paste the code below → Deploy. No CLI needed.

Status as of 12 Sept 2026: **not yet deployed** (site shows "Couldn't load hours" until this is done). This version (updated 12 Sept) fixes a real bug in the first draft — it was returning the database's raw column names (`staff_name`, `work_date`, `start_time`...) but the page's JavaScript expects short names (`name`, `date`, `start`...), so the very first deploy would have shown blank names/dates/photos everywhere even once live. This version also adds `totalPaid`, used for the three totals on the page (due / paid / all-time).

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase
    .from('dgc_dayworks_entries')
    .select('id, staff_name, work_date, site, description, start_time, finish_time, hours, image_path, approved_by, approved_at')
    .not('sent_at', 'is', null)
    .not('approved_by', 'is', null)
    .eq('confirmed', true)
    .eq('flagged', false)
    .is('removed_at', null)
    .order('work_date', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Map raw DB column names to the short names the public page's JS
  // expects, and turn image_path into a full public storage URL.
  const STORAGE_PUBLIC = Deno.env.get('SUPABASE_URL') + '/storage/v1/object/public/dayworks-timesheets/'
  const entries = (data || []).map(r => ({
    id: r.id,
    name: r.staff_name,
    date: r.work_date,
    site: r.site,
    description: r.description,
    start: r.start_time,
    finish: r.finish_time,
    hours: r.hours,
    image: r.image_path ? STORAGE_PUBLIC + r.image_path : null,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
  }))

  // Total paid so far — from a separate table Ash logs each Dandara
  // payment certificate into (see the SQL below). That table may not
  // exist yet, so a missing-table error here just means "no payments
  // logged yet" rather than failing the whole request.
  let totalPaid = 0
  const { data: payments, error: payErr } = await supabase
    .from('dgc_dayworks_payments')
    .select('amount')
  if (!payErr && payments) {
    totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }

  return new Response(JSON.stringify({ entries, totalPaid }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

**After deploying**, the public page will still show £0.00 until at least one batch has been through "Save for client" in the internal Job Planner (that's the step that stamps `approved_by` and `sent_at` on entries — the Edge Function only returns rows where both are set).

## New table needed: `dgc_dayworks_payments`

Backs the "Total paid so far" figure on the public page. Run this once in the Job Planner's Supabase SQL Editor:

```sql
create table if not exists public.dgc_dayworks_payments (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10,2) not null,
  paid_date date not null,
  certificate_ref text,
  note text,
  created_at timestamptz default now()
);
alter table public.dgc_dayworks_payments enable row level security;
create policy "anon read payments" on public.dgc_dayworks_payments for select using (true);
create policy "anon insert payments" on public.dgc_dayworks_payments for insert with check (true);
```

Once that's run, Ash tells Claude about each Dandara payment certificate as it arrives (amount, date, certificate ref) and it gets added as a row here — no UI for this yet, it's a straight insert.

## Database pieces this depends on (already done, confirmed live)

- `dgc_dayworks_entries` has `approved_by text`, `approved_at timestamptz`, `removed_at timestamptz`, `removed_note text` columns — confirmed present.
- `dgc_dayworks_queries` table exists (client-side "Query these hours" writes here) — confirmed present.
- `dgc_dayworks_payments` — **not yet created**, see SQL above.

## Client-side "Query" feature

Already live on the public site right now (works even without the Edge Function, since it writes directly with the anon key): every entry has a Query button, opens a pre-filled form, posts to `dgc_dayworks_queries`. Shows up in the internal Job Planner's homepage queries panel for Ash/PM to action.

## Cross-session note

This site is wired into the same Supabase project and data as the **Job Planner** app (`dgc-ballasalla`), which Ash runs in a separate Claude session. See the coordination note in Obsidian: `DGC Brain/Prompts/DGC Dayworks Client — Integration Coordination.md` — read that before changing anything that touches shared tables (`dgc_dayworks_entries`, `dgc_dayworks_queries`).

*Last updated: 12 Sept 2026*
