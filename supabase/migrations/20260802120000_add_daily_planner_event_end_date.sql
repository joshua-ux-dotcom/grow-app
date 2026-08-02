alter table public.daily_planner_events
  add column end_date date;

alter table public.daily_planner_events
  add constraint daily_planner_events_end_date_not_before_date_check
  check (end_date is null or end_date >= date);

create index if not exists daily_planner_events_user_id_date_idx
  on public.daily_planner_events (user_id, date);

create index if not exists daily_planner_events_user_id_end_date_idx
  on public.daily_planner_events (user_id, end_date)
  where end_date is not null;
