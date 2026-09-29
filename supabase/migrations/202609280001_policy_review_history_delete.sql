-- Review history belongs to its policy, like policy_status_history.
-- Financial ledger and clawback references deliberately remain restrictive.
begin;
alter table public.policy_review_history
  drop constraint policy_review_history_policy_id_fkey;
alter table public.policy_review_history
  add constraint policy_review_history_policy_id_fkey
  foreign key (policy_id) references public.policies(id) on delete cascade;
notify pgrst, 'reload schema';
commit;
