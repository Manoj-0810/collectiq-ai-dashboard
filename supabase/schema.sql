-- Call campaigns (a batch run)
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  status text check (status in ('draft','running','paused','completed')) default 'draft',
  total_customers integer default 0,
  completed_calls integer default 0,
  ptp_count integer default 0,
  total_ptp_amount numeric default 0,
  connect_rate integer default 0,
  created_at timestamptz default now()
);

-- Individual call records
create table calls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  borrower_name text not null,
  phone_number text not null,
  loan_account text not null,
  overdue_amount numeric not null,
  due_date date not null,
  call_status text check (call_status in ('queued','initiated','calling','completed','failed','no_answer')) default 'queued',
  call_outcome text check (call_outcome in ('ptp_confirmed','disputed','callback_requested','escalate','no_answer','failed')),
  ptp_date date,
  ptp_amount numeric,
  transcript text,
  summary text,
  sentiment text,
  duration_seconds integer,
  bolna_call_id text,
  created_at timestamptz default now()
);

-- Aggregate metrics per campaign (materialized for dashboard speed)
create or replace view campaign_metrics as
select
  campaign_id,
  count(*) as total_calls,
  count(*) filter (where call_status = 'completed') as completed_calls,
  count(*) filter (where call_outcome = 'ptp_confirmed') as ptp_count,
  coalesce(sum(ptp_amount) filter (where call_outcome = 'ptp_confirmed'), 0) as ptp_amount_total,
  count(*) filter (where call_outcome = 'disputed') as disputes,
  count(*) filter (where call_outcome = 'escalate') as escalations,
  coalesce(round(avg(duration_seconds) filter (where call_status = 'completed')), 0) as avg_duration_seconds
from calls
group by campaign_id;

-- Enable Row Level Security
alter table campaigns enable row level security;
alter table calls enable row level security;

-- Create policies (allow all for demo - in production, restrict by tenant)
create policy "Allow all" on campaigns for all using (true) with check (true);
create policy "Allow all" on calls for all using (true) with check (true);

-- Enable realtime for calls table
alter publication supabase_realtime add table calls;
