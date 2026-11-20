-- LifeOS – Row Level Security Policies  (migration 002)
-- Enable RLS on every user-facing table
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','tasks','task_subtasks','events','note_folders','notes','habits','habit_logs','goals','goal_milestones','transactions','budgets','savings_goals','documents','workspaces','workspace_members','workspace_invitations','ai_usage','reminders']
  LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t); END LOOP;
END; $$;

-- ── Workspace helpers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws UUID) RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=ws AND user_id=auth.uid()); $$;
CREATE OR REPLACE FUNCTION public.is_workspace_editor(ws UUID) RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=ws AND user_id=auth.uid() AND role IN ('owner','admin','editor')); $$;
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws UUID) RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=ws AND user_id=auth.uid() AND role='owner'); $$;

-- ── Profiles ──────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (id=auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id=auth.uid());

-- ── Tasks ─────────────────────────────────────────────────────────────────
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id)));
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (user_id=auth.uid() AND (workspace_id IS NULL OR public.is_workspace_editor(workspace_id)));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id)));
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id)));

CREATE POLICY "subtasks_all" ON public.task_subtasks FOR ALL
  USING (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_id AND t.user_id=auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_id AND t.user_id=auth.uid()));

-- ── Events ────────────────────────────────────────────────────────────────
CREATE POLICY "events_select" ON public.events FOR SELECT USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id)));
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (user_id=auth.uid() AND (workspace_id IS NULL OR public.is_workspace_editor(workspace_id)));
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id)));
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id)));

-- ── Notes ─────────────────────────────────────────────────────────────────
CREATE POLICY "note_folders_all" ON public.note_folders FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "notes_select" ON public.notes FOR SELECT USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id)));
CREATE POLICY "notes_insert" ON public.notes FOR INSERT WITH CHECK (user_id=auth.uid() AND (workspace_id IS NULL OR public.is_workspace_editor(workspace_id)));
CREATE POLICY "notes_update" ON public.notes FOR UPDATE USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id)));
CREATE POLICY "notes_delete" ON public.notes FOR DELETE USING (user_id=auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id)));

-- ── Habits / Goals / Finance / Documents ──────────────────────────────────
CREATE POLICY "habits_all"       ON public.habits        FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "habit_logs_all"   ON public.habit_logs    FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "goals_all"        ON public.goals         FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "milestones_all"   ON public.goal_milestones FOR ALL USING (EXISTS(SELECT 1 FROM public.goals g WHERE g.id=goal_id AND g.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.goals g WHERE g.id=goal_id AND g.user_id=auth.uid()));
CREATE POLICY "transactions_all" ON public.transactions   FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "budgets_all"      ON public.budgets        FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "savings_all"      ON public.savings_goals  FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "documents_all"    ON public.documents      FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- ── Workspaces ────────────────────────────────────────────────────────────
CREATE POLICY "ws_select" ON public.workspaces FOR SELECT USING (public.is_workspace_member(id));
CREATE POLICY "ws_insert" ON public.workspaces FOR INSERT WITH CHECK (owner_id=auth.uid());
CREATE POLICY "ws_update" ON public.workspaces FOR UPDATE USING (public.is_workspace_owner(id));
CREATE POLICY "ws_delete" ON public.workspaces FOR DELETE USING (owner_id=auth.uid());
CREATE POLICY "members_select" ON public.workspace_members FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "members_insert" ON public.workspace_members FOR INSERT WITH CHECK (public.is_workspace_editor(workspace_id));
CREATE POLICY "members_update" ON public.workspace_members FOR UPDATE USING (public.is_workspace_owner(workspace_id));
CREATE POLICY "members_delete" ON public.workspace_members FOR DELETE USING (public.is_workspace_owner(workspace_id) OR user_id=auth.uid());
CREATE POLICY "invites_select" ON public.workspace_invitations FOR SELECT USING (public.is_workspace_editor(workspace_id));
CREATE POLICY "invites_insert" ON public.workspace_invitations FOR INSERT WITH CHECK (public.is_workspace_editor(workspace_id));
CREATE POLICY "invites_delete" ON public.workspace_invitations FOR DELETE USING (public.is_workspace_editor(workspace_id));

-- ── AI usage / Reminders ──────────────────────────────────────────────────
CREATE POLICY "ai_usage_all"  ON public.ai_usage  FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "reminders_all" ON public.reminders FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
