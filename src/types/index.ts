export interface UserProfile {
  id: string; email: string; full_name: string | null; avatar_url: string | null;
  timezone: string; currency: string; theme: 'light'|'dark'|'system';
  notification_enabled: boolean; created_at: string; updated_at: string;
}
export type TaskPriority = 'low'|'medium'|'high'|'urgent';
export type TaskStatus = 'pending'|'in_progress'|'completed'|'cancelled';
export type RecurrenceFrequency = 'daily'|'weekly'|'biweekly'|'monthly'|'yearly';
export interface RecurrenceRule { frequency: RecurrenceFrequency; interval: number; days_of_week?: number[]; end_date?: string; }
export interface Subtask { id: string; task_id: string; title: string; completed: boolean; position: number; created_at: string; }
export interface Task {
  id: string; user_id: string; workspace_id?: string|null; title: string;
  description?: string|null; status: TaskStatus; priority: TaskPriority;
  due_date?: string|null; due_time?: string|null; reminder_at?: string|null;
  tags: string[]; category?: string|null; goal_id?: string|null;
  recurrence?: RecurrenceRule|null; completed_at?: string|null;
  created_at: string; updated_at: string; subtasks?: Subtask[];
}
export interface NoteFolder { id: string; user_id: string; name: string; color?: string|null; icon?: string|null; position: number; created_at: string; }
export interface Note {
  id: string; user_id: string; workspace_id?: string|null; folder_id?: string|null;
  title: string; content: string; content_type: 'text'|'checklist'|'markdown';
  tags: string[]; is_favorite: boolean; is_archived: boolean; pinned: boolean;
  linked_task_ids: string[]; created_at: string; updated_at: string;
}
export type EventColor = 'violet'|'blue'|'green'|'yellow'|'red'|'pink'|'orange';
export interface CalendarEvent {
  id: string; user_id: string; workspace_id?: string|null; title: string;
  description?: string|null; location?: string|null; start_at: string; end_at: string;
  all_day: boolean; color: EventColor; reminder_minutes?: number|null;
  recurrence?: RecurrenceRule|null; timezone: string; created_at: string; updated_at: string;
}
export type HabitFrequency = 'daily'|'weekly'|'custom';
export type HabitTimeOfDay = 'morning'|'afternoon'|'evening'|'anytime';
export interface Habit {
  id: string; user_id: string; title: string; description?: string|null;
  icon: string; color: string; frequency: HabitFrequency; days_of_week: number[];
  time_of_day: HabitTimeOfDay; reminder_time?: string|null; target_count: number;
  unit?: string|null; is_active: boolean; created_at: string; updated_at: string;
}
export interface HabitLog { id: string; habit_id: string; user_id: string; date: string; count: number; note?: string|null; created_at: string; }
export type GoalStatus = 'active'|'completed'|'paused'|'cancelled';
export type GoalCategory = 'health'|'career'|'finance'|'learning'|'personal'|'relationships'|'other';
export interface GoalMilestone { id: string; goal_id: string; title: string; description?: string|null; target_date?: string|null; completed: boolean; completed_at?: string|null; position: number; }
export interface Goal {
  id: string; user_id: string; title: string; description?: string|null;
  category: GoalCategory; status: GoalStatus; target_date?: string|null;
  progress: number; icon?: string|null; color?: string|null;
  created_at: string; updated_at: string; milestones?: GoalMilestone[];
}
export type TransactionType = 'income'|'expense';
export interface Transaction { id: string; user_id: string; type: TransactionType; amount: number; currency: string; category: string; description?: string|null; date: string; is_recurring: boolean; recurrence?: RecurrenceRule|null; created_at: string; updated_at: string; }
export interface Budget { id: string; user_id: string; category: string; amount: number; currency: string; period: 'monthly'|'weekly'|'yearly'; created_at: string; updated_at: string; }
export interface SavingsGoal { id: string; user_id: string; title: string; target_amount: number; current_amount: number; currency: string; target_date?: string|null; created_at: string; updated_at: string; }
export interface SpendingSummary { total_income: number; total_expenses: number; net: number; by_category: Record<string,number>; currency: string; }
export type DocumentCategory = 'identity'|'finance'|'medical'|'legal'|'work'|'education'|'other';
export interface Document { id: string; user_id: string; title: string; file_name: string; file_size: number; mime_type: string; storage_path: string; category: DocumentCategory; tags: string[]; description?: string|null; created_at: string; updated_at: string; }
export type WorkspaceRole = 'owner'|'admin'|'editor'|'viewer';
export interface Workspace { id: string; name: string; description?: string|null; owner_id: string; avatar_url?: string|null; created_at: string; updated_at: string; }
export interface WorkspaceMember { id: string; workspace_id: string; user_id: string; role: WorkspaceRole; joined_at: string; profile?: UserProfile; }
export interface WorkspaceInvitation { id: string; workspace_id: string; email: string; role: WorkspaceRole; status: 'pending'|'accepted'|'declined'|'expired'; expires_at: string; created_at: string; }
export interface AiMessage { id: string; role: 'user'|'assistant'|'system'; content: string; timestamp: string; pending_action?: AiPendingAction|null; }
export interface AiPendingAction { type: string; payload: Record<string,unknown>; description: string; }
export type QueueOperationType = 'create'|'update'|'delete';
export interface OfflineQueueItem { id: string; operation: QueueOperationType; table: string; record_id: string; payload: Record<string,unknown>; created_at: number; retry_count: number; last_error?: string; }
export interface ApiError { message: string; code?: string; status?: number; }
