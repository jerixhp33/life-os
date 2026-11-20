import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { fetchUserWorkspaces, createWorkspace, deleteWorkspace, inviteWorkspaceMember } from '../../src/features/workspaces/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, EmptyState, ErrorState } from '../../src/components/feedback';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import type { Workspace, WorkspaceRole } from '../../src/types';

export default function WorkspacesScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);

  const [activeWsId, setActiveWsId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [targetWsId, setTargetWsId] = useState<string | null>(null);

  // New Workspace form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('editor');

  const { data: workspaces, isLoading, error, refetch } = useQuery<Workspace[]>({
    queryKey: ['workspaces', uid],
    queryFn: () => fetchUserWorkspaces(uid!),
    enabled: Boolean(uid)
  });

  const createMut = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error('Workspace name is required.');
      return createWorkspace(uid!, { name: name.trim(), description: desc.trim() || undefined });
    },
    onSuccess: (newWs) => {
      setIsCreateModalOpen(false);
      setName('');
      setDesc('');
      setActiveWsId(newWs.id);
      qc.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not create workspace.')
  });

  const inviteMut = useMutation({
    mutationFn: () => {
      if (!inviteEmail.trim() || !targetWsId) throw new Error('Valid email is required.');
      return inviteWorkspaceMember(targetWsId, inviteEmail.trim(), inviteRole);
    },
    onSuccess: () => {
      setIsInviteModalOpen(false);
      setInviteEmail('');
      Alert.alert('Invitation Sent', `Invitation sent to ${inviteEmail}.`);
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not send invite.')
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
    }
  });

  const handleDelete = (ws: Workspace) => {
    Alert.alert('Delete Workspace', `Are you sure you want to delete "${ws.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(ws.id) }
    ]);
  };

  const openInviteModal = (wsId: string) => {
    setTargetWsId(wsId);
    setIsInviteModalOpen(true);
  };

  return (
    <ScreenLayout
      title="Workspaces"
      showBack
      rightAction={
        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={s.addBtn}
          accessibilityLabel="New workspace"
        >
          <Ionicons name="add" size={24} color={theme.brand.primary} />
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.introBox}>
          <Text style={[s.introTitle, { color: theme.text.primary }]}>Collaborative Spaces</Text>
          <Text style={[s.introSub, { color: theme.text.tertiary }]}>
            Organize tasks, documents, and notes by team, project, or personal client.
          </Text>
        </View>

        {isLoading ? (
          <View><SkeletonCard /><SkeletonCard /></View>
        ) : error ? (
          <ErrorState message="Could not load workspaces." onRetry={refetch} />
        ) : !workspaces?.length ? (
          <EmptyState
            icon="people-outline"
            title="No workspaces yet"
            description="Create your first team or project workspace to get started."
            actionLabel="Create Workspace"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          workspaces.map((ws) => {
            const isSelected = activeWsId === ws.id;
            return (
              <View
                key={ws.id}
                style={[
                  s.wsCard,
                  {
                    backgroundColor: theme.surface.default,
                    borderColor: isSelected ? theme.brand.primary : theme.border.subtle,
                    ...shadows.sm
                  }
                ]}
              >
                <View style={s.cardHead}>
                  <View style={[s.wsIconBox, { backgroundColor: isSelected ? theme.brand.primary : theme.brand.primaryBg }]}>
                    <Ionicons name="people" size={22} color={isSelected ? '#ffffff' : theme.brand.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.titleRow}>
                      <Text style={[s.wsName, { color: theme.text.primary }]}>{ws.name}</Text>
                      {isSelected && (
                        <View style={[s.activeBadge, { backgroundColor: theme.brand.primaryBg }]}>
                          <Text style={[s.activeTxt, { color: theme.brand.primary }]}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[s.wsDate, { color: theme.text.tertiary }]}>
                      Created {format(new Date(ws.created_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(ws)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={theme.text.tertiary} />
                  </TouchableOpacity>
                </View>

                {ws.description && (
                  <Text style={[s.wsDesc, { color: theme.text.secondary }]}>{ws.description}</Text>
                )}

                {/* Card actions */}
                <View style={s.cardActions}>
                  <TouchableOpacity
                    onPress={() => setActiveWsId(isSelected ? null : ws.id)}
                    style={[
                      s.actBtn,
                      {
                        backgroundColor: isSelected ? theme.brand.primaryBg : theme.surface.inset
                      }
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                      size={16}
                      color={isSelected ? theme.brand.primary : theme.text.secondary}
                    />
                    <Text style={{ color: isSelected ? theme.brand.primary : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                      {isSelected ? 'Active Workspace' : 'Select'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openInviteModal(ws.id)}
                    style={[s.actBtn, { backgroundColor: theme.surface.inset }]}
                  >
                    <Ionicons name="person-add-outline" size={16} color={theme.text.secondary} />
                    <Text style={{ color: theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                      Invite
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: spacing[12] }} />
      </ScrollView>

      {/* Create Workspace Modal */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: theme.surface.default }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text.primary }]}>Create Workspace</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <Input label="Workspace Name" value={name} onChangeText={setName} placeholder="e.g. Acme Studio, Marketing" autoFocus />
            <Input label="Description (optional)" value={desc} onChangeText={setDesc} placeholder="Team goals or workspace scope..." multiline numberOfLines={2} />

            <Button
              label="Create Workspace"
              onPress={() => createMut.mutate()}
              loading={createMut.isPending}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: spacing[3] }}
            />
          </View>
        </View>
      </Modal>

      {/* Invite Member Modal */}
      <Modal visible={isInviteModalOpen} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: theme.surface.default }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text.primary }]}>Invite Team Member</Text>
              <TouchableOpacity onPress={() => setIsInviteModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Email Address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="colleague@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <View style={{ gap: spacing[2] }}>
              <Text style={[s.label, { color: theme.text.secondary }]}>Member Role</Text>
              <View style={s.roleRow}>
                {(['admin', 'editor', 'viewer'] as WorkspaceRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setInviteRole(r)}
                    style={[
                      s.roleChip,
                      {
                        backgroundColor: inviteRole === r ? theme.brand.primary : theme.surface.inset,
                        borderColor: inviteRole === r ? theme.brand.primary : theme.border.subtle
                      }
                    ]}
                  >
                    <Text style={{ color: inviteRole === r ? '#ffffff' : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                      {r[0].toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              label="Send Invitation"
              onPress={() => inviteMut.mutate()}
              loading={inviteMut.isPending}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: spacing[3] }}
            />
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4] },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  introBox: { gap: 4 },
  introTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  introSub: { fontSize: fontSize.sm, lineHeight: 20 },
  wsCard: { padding: spacing[4], borderRadius: radius.xl, borderWidth: 1.5, gap: spacing[3] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  wsIconBox: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  wsName: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  activeBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full },
  activeTxt: { fontSize: 9, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  wsDate: { fontSize: fontSize.xs, marginTop: 2 },
  wsDesc: { fontSize: fontSize.sm, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: spacing[2], paddingTop: spacing[1] },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: spacing[6], gap: spacing[4] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  roleRow: { flexDirection: 'row', gap: spacing[2] },
  roleChip: { flex: 1, alignItems: 'center', paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1 }
});
