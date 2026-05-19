-- Borrower accounts imported from CSV
create table borrowers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  loan_account text not null,
  overdue_amount numeric not null,
  due_date date not null,
  language text default 'hindi',
  bucket text check (bucket in ('0-30','31-60','61-90','90+')) default '0-30',
  created_at timestamptz default now()
);

-- Call campaigns (a batch run)
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text check (status in ('draft','running','paused','completed')) default 'draft',
  total_accounts integer default 0,
  created_at timestamptz default now()
);

-- Individual call records
create table calls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id),
  borrower_id uuid references borrowers(id),
  bolna_call_id text,
  status text check (status in ('queued','calling','completed','failed','no_answer')) default 'queued',
  outcome text check (outcome in ('ptp_confirmed','disputed','callback_requested','escalate','no_answer','failed')),
  ptp_date date,
  ptp_amount numeric,
  transcript text,
  duration_seconds integer,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Aggregate metrics per campaign per day (materialized for dashboard speed)
create view campaign_metrics as
select
  campaign_id,
  count(*) as total_calls,
  count(*) filter (where status = 'completed') as completed_calls,
  count(*) filter (where outcome = 'ptp_confirmed') as ptp_count,
  coalesce(sum(ptp_amount) filter (where outcome = 'ptp_confirmed'), 0) as ptp_amount_total,
  count(*) filter (where outcome = 'disputed') as disputes,
  count(*) filter (where outcome = 'escalate') as escalations,
  round(avg(duration_seconds) filter (where status = 'completed')) as avg_duration_seconds
from calls
group by campaign_id;

-- Enable Row Level Security
alter table borrowers enable row level security;
alter table campaigns enable row level security;
alter table calls enable row level security;

-- Create policies (allow all for demo - in production, restrict by tenant)
create policy "Allow all" on borrowers for all using (true) with check (true);
create policy "Allow all" on campaigns for all using (true) with check (true);
create policy "Allow all" on calls for all using (true) with check (true);

-- Enable realtime for calls table
alter publication supabase_realtime add table calls;
