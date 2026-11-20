-- LifeOS – Initial Schema  (migration 001)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── PROFILES ──────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  timezone    TEXT NOT NULL DEFAULT 'UTC',
  currency    TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency)=3),
  theme       TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── TASKS ─────────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  TEXT CHECK (char_length(description)<=2000),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority     TEXT NOT NULL DEFAULT 'medium'  CHECK (priority IN ('low','medium','high','urgent')),
  due_date     DATE,
  due_time     TIME,
  reminder_at  TIMESTAMPTZ,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  category     TEXT CHECK (char_length(category)<=50),
  goal_id      UUID,
  recurrence   JSONB,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.task_subtasks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_user    ON public.tasks(user_id);
CREATE INDEX idx_tasks_status  ON public.tasks(status);
CREATE INDEX idx_tasks_due     ON public.tasks(due_date);
CREATE INDEX idx_tasks_title   ON public.tasks USING gin(title gin_trgm_ops);
CREATE INDEX idx_subtasks_task ON public.task_subtasks(task_id);

-- ── EVENTS ────────────────────────────────────────────────────────────────
CREATE TABLE public.events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id     UUID,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description      TEXT CHECK (char_length(description)<=2000),
  location         TEXT CHECK (char_length(location)<=200),
  start_at         TIMESTAMPTZ NOT NULL,
  end_at           TIMESTAMPTZ NOT NULL,
  all_day          BOOLEAN NOT NULL DEFAULT FALSE,
  color            TEXT NOT NULL DEFAULT 'violet' CHECK (color IN ('violet','blue','green','yellow','red','pink','orange')),
  reminder_minutes INTEGER CHECK (reminder_minutes>=0),
  recurrence       JSONB,
  timezone         TEXT NOT NULL DEFAULT 'UTC',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_end_after_start CHECK (end_at>=start_at)
);
CREATE INDEX idx_events_user  ON public.events(user_id);
CREATE INDEX idx_events_start ON public.events(start_at);
CREATE INDEX idx_events_range ON public.events(user_id, start_at, end_at);

-- ── NOTES ─────────────────────────────────────────────────────────────────
CREATE TABLE public.note_folders (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  color      TEXT, icon TEXT, position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.notes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id     UUID,
  folder_id        UUID REFERENCES public.note_folders(id) ON DELETE SET NULL,
  title            TEXT NOT NULL DEFAULT '' CHECK (char_length(title)<=200),
  content          TEXT NOT NULL DEFAULT '' CHECK (char_length(content)<=50000),
  content_type     TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','checklist','markdown')),
  tags             TEXT[] NOT NULL DEFAULT '{}',
  is_favorite      BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived      BOOLEAN NOT NULL DEFAULT FALSE,
  pinned           BOOLEAN NOT NULL DEFAULT FALSE,
  linked_task_ids  UUID[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notes_user     ON public.notes(user_id);
CREATE INDEX idx_notes_folder   ON public.notes(folder_id);
CREATE INDEX idx_notes_archived ON public.notes(user_id, is_archived);
CREATE INDEX idx_notes_title    ON public.notes USING gin(title gin_trgm_ops);
CREATE INDEX idx_notes_content  ON public.notes USING gin(content gin_trgm_ops);

-- ── HABITS ────────────────────────────────────────────────────────────────
CREATE TABLE public.habits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description  TEXT CHECK (char_length(description)<=500),
  icon         TEXT NOT NULL DEFAULT '✅',
  color        TEXT NOT NULL DEFAULT '#6957E8',
  frequency    TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','weekly','custom')),
  days_of_week INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  time_of_day  TEXT NOT NULL DEFAULT 'anytime' CHECK (time_of_day IN ('morning','afternoon','evening','anytime')),
  reminder_time TIME,
  target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count>=1),
  unit         TEXT CHECK (char_length(unit)<=20),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.habit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id   UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  count      INTEGER NOT NULL DEFAULT 1 CHECK (count>=0),
  note       TEXT CHECK (char_length(note)<=500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, habit_id, date)
);
CREATE INDEX idx_habits_user     ON public.habits(user_id);
CREATE INDEX idx_habit_logs_date ON public.habit_logs(user_id, date);

-- ── GOALS ─────────────────────────────────────────────────────────────────
CREATE TABLE public.goals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (char_length(description)<=1000),
  category    TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('health','career','finance','learning','personal','relationships','other')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
  target_date DATE,
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  icon        TEXT, color TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.goal_milestones (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id      UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  TEXT CHECK (char_length(description)<=500),
  target_date  DATE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  position     INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_goal_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;
CREATE INDEX idx_goals_user       ON public.goals(user_id);
CREATE INDEX idx_milestones_goal  ON public.goal_milestones(goal_id);

-- ── FINANCE ───────────────────────────────────────────────────────────────
CREATE TABLE public.transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount       NUMERIC(14,2) NOT NULL CHECK (amount>0),
  currency     TEXT NOT NULL CHECK (char_length(currency)=3),
  category     TEXT NOT NULL CHECK (char_length(category) BETWEEN 1 AND 50),
  description  TEXT CHECK (char_length(description)<=500),
  date         DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence   JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.budgets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category   TEXT NOT NULL CHECK (char_length(category) BETWEEN 1 AND 50),
  amount     NUMERIC(14,2) NOT NULL CHECK (amount>0),
  currency   TEXT NOT NULL CHECK (char_length(currency)=3),
  period     TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly','weekly','yearly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category, period)
);
CREATE TABLE public.savings_goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  target_amount  NUMERIC(14,2) NOT NULL CHECK (target_amount>0),
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_amount>=0),
  currency       TEXT NOT NULL CHECK (char_length(currency)=3),
  target_date    DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tx_user  ON public.transactions(user_id);
CREATE INDEX idx_tx_date  ON public.transactions(user_id, date);

-- ── DOCUMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE public.documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  file_name    TEXT NOT NULL,
  file_size    BIGINT NOT NULL CHECK (file_size>0),
  mime_type    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('identity','finance','medical','legal','work','education','other')),
  tags         TEXT[] NOT NULL DEFAULT '{}',
  description  TEXT CHECK (char_length(description)<=500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_docs_user ON public.documents(user_id);

-- ── WORKSPACES ────────────────────────────────────────────────────────────
CREATE TABLE public.workspaces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description TEXT CHECK (char_length(description)<=500),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.workspace_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','admin','editor','viewer')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);
CREATE TABLE public.workspace_invitations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin','editor','viewer')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.tasks  ADD CONSTRAINT tasks_ws_fkey  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.notes  ADD CONSTRAINT notes_ws_fkey  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD CONSTRAINT events_ws_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- ── AI USAGE & REMINDERS ──────────────────────────────────────────────────
CREATE TABLE public.ai_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used>=0),
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);
CREATE TABLE public.reminders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('task','event','habit')),
  entity_id       UUID NOT NULL,
  remind_at       TIMESTAMPTZ NOT NULL,
  notification_id TEXT,
  delivered       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reminders_remind ON public.reminders(remind_at) WHERE NOT delivered;

-- ── updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$;
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','tasks','events','notes','habits','goals','transactions','budgets','savings_goals','documents','workspaces']
  LOOP EXECUTE format('CREATE TRIGGER trg_%I_upd BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t); END LOOP;
END; $$;
