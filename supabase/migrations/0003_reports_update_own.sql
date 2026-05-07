-- Allow citizens to update their own report rows.
-- Required for the post-upload step that updates reports.image_url.

drop policy if exists "reports_update_own" on public.reports;

create policy "reports_update_own"
on public.reports
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

