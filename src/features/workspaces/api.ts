import { supabase } from '../../lib/supabase/client';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '../../types';

export async function fetchUserWorkspaces(uid: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Workspace[];
}

export async function createWorkspace(
  uid: string,
  values: { name: string; description?: string }
): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      owner_id: uid,
      name: values.name,
      description: values.description ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Add owner to workspace_members
  await supabase.from('workspace_members').insert({
    workspace_id: data.id,
    user_id: uid,
    role: 'owner',
  });

  return data as Workspace;
}

export async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*, profile:profiles(*)')
    .eq('workspace_id', workspaceId);
  if (error) throw new Error(error.message);
  return data as WorkspaceMember[];
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  email: string,
  role: WorkspaceRole
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('workspace_invitations').insert({
    workspace_id: workspaceId,
    email: email.trim().toLowerCase(),
    role,
    status: 'pending',
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
