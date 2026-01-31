create table if not exists query_history (
  id bigserial primary key,
  user_email text not null,
  query_execution_id text not null,
  sql_text text not null,
  status text not null,
  submitted_at timestamptz not null,
  completed_at timestamptz,
  error_message text,
  scanned_bytes bigint,
  queue_time_ms bigint,
  execution_time_ms bigint,
  estimated_cost_usd numeric(18,6),
  output_location text,
  workgroup text,
  catalog text,
  database_name text,
  is_partial boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_email, query_execution_id)
);

create index if not exists query_history_user_idx on query_history (user_email);
create index if not exists query_history_query_id_idx on query_history (query_execution_id);
create index if not exists query_history_status_idx on query_history (status);
create index if not exists query_history_submitted_at_idx on query_history (submitted_at);
