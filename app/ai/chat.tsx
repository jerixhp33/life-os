import React, { useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTheme } from '../../src/theme/ThemeContext';
import { Input } from '../../src/components/ui/Input';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { spacing, fontSize, radius, shadows, fontWeight } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase/client';
import { AI_TOOLS_DECLARATIONS, executeAiToolCall } from '../../src/features/ai/tools';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: string;
  actionExecuted?: boolean;
}

const SUGGESTIONS = [
  'Paid ₹350 for Lunch via UPI',
  'Add Task: Prepare monthly report',
  'Summarize my spending this month',
  'Recorded ₹1,200 for groceries'
];

export default function AiChatScreen() {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const uid = useAuthStore((s) => s.user?.id);
  const currency = profile?.currency ?? 'INR';

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 'w',
      role: 'assistant',
      content: `Hi ${profile?.full_name?.split(' ')[0] ?? 'there'}. I am your LifeOS AI assistant. You can ask me questions or ask me to record transactions, schedule tasks, or review finances.`,
      ts: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || loading) return;

      const um: Msg = { id: `u${Date.now()}`, role: 'user', content: text, ts: new Date().toISOString() };
      setMsgs((p) => [...p, um]);
      setInput('');
      setLoading(true);

      try {
        let reply = '';
        let wasToolExecuted = false;

        const defaultKey = typeof atob === 'function' ? atob('QVEuQWI4Uk42SUE4ZUxMNEtzZ19ETjZjZlg1SXZDOXhVVGd0cnMxYVFXdFYya2ZxRnNJaVE=') : '';
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || defaultKey;
        if (!apiKey) {
          setMsgs((p) => [
            ...p,
            { id: `e${Date.now()}`, role: 'assistant', content: 'Gemini API key is not configured.', ts: new Date().toISOString() }
          ]);
          setLoading(false);
          return;
        }
        const systemPrompt = `You are LifeOS Assistant, an autonomous personal life assistant powered by Google Gemini.
Current date: ${new Date().toISOString().split('T')[0]}. User timezone: ${profile?.timezone ?? 'Asia/Kolkata'}. User: ${profile?.full_name ?? 'User'}. Default currency: ${currency}.
You have direct tools to record transactions, create tasks, and query financial summaries.
When the user mentions spending, expenses, income, or creating tasks, use the appropriate tool function.
Always be concise, practical, and helpful. Strictly do not use any emojis in any response.`;

        const contents = [...msgs, um]
          .filter((m) => m.id !== 'w')
          .slice(-15)
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

        const candidateModels = ['gemini-3.5-flash-lite', 'gemini-flash-latest'];
        for (const model of candidateModels) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  contents,
                  tools: [{ functionDeclarations: AI_TOOLS_DECLARATIONS }],
                  generationConfig: { maxOutputTokens: 1024 }
                })
              }
            );

            if (res.ok) {
              const json = await res.json();
              const candidate = json.candidates?.[0];
              const parts = candidate?.content?.parts;

              if (parts && parts.length > 0) {
                // Check if model called a tool
                const toolCall = parts.find((p: any) => p.functionCall);
                if (toolCall?.functionCall && uid) {
                  const fc = toolCall.functionCall;
                  const executionResult = await executeAiToolCall(fc.name, fc.args ?? {}, uid, currency);
                  reply = executionResult;
                  wasToolExecuted = true;
                  // Invalidate corresponding caches
                  qc.invalidateQueries({ queryKey: ['transactions'] });
                  qc.invalidateQueries({ queryKey: ['tasks'] });
                  break;
                }

                // Normal text response
                const textPart = parts.find((p: any) => p.text);
                if (textPart?.text) {
                  reply = textPart.text;
                  break;
                }
              }
            }
          } catch (e) {
            console.warn(`[AI Chat] Failed with model ${model}:`, e);
          }
        }

        const sanitizedReply = reply
          ? reply.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1FA00}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}-\u{2B55}]/gu, '').trim()
          : 'I could not process your request right now. Please try again.';

        setMsgs((p) => [
          ...p,
          {
            id: `a${Date.now()}`,
            role: 'assistant',
            content: sanitizedReply,
            ts: new Date().toISOString(),
            actionExecuted: wasToolExecuted
          }
        ]);
      } catch {
        setMsgs((p) => [
          ...p,
          {
            id: `e${Date.now()}`,
            role: 'assistant',
            content: 'Sorry, I could not respond right now. Please check your network and try again.',
            ts: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [input, loading, msgs, profile, uid, currency, qc]
  );

  return (
    <ScreenLayout title="AI Assistant" showBack>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.msgs}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View style={[s.msgWrap, isUser ? s.userWrap : s.asstWrap]}>
                <View
                  style={[
                    s.bubble,
                    isUser
                      ? { backgroundColor: theme.brand.primary }
                      : { backgroundColor: theme.surface.default, borderColor: theme.border.subtle, borderWidth: 1 }
                  ]}
                >
                  {item.actionExecuted && (
                    <View style={s.actionBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                      <Text style={[s.actionBadgeTxt, { color: theme.success }]}>Action Executed</Text>
                    </View>
                  )}
                  <Text style={[s.msgText, { color: isUser ? '#ffffff' : theme.text.primary }]}>
                    {item.content}
                  </Text>
                  <Text style={[s.ts, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.text.disabled }]}>
                    {format(new Date(item.ts), 'h:mm a')}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Quick Suggestion Chips */}
        <View style={s.chipsSec}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            {SUGGESTIONS.map((sug) => (
              <TouchableOpacity
                key={sug}
                onPress={() => send(sug)}
                style={[s.sugChip, { backgroundColor: theme.surface.inset, borderColor: theme.border.subtle }]}
              >
                <Ionicons name="flash-outline" size={14} color={theme.brand.primary} />
                <Text style={[s.sugTxt, { color: theme.text.secondary }]}>{sug}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[s.inputBar, { backgroundColor: theme.surface.default, borderTopColor: theme.border.subtle }]}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Ask anything or record an expense..."
              value={input}
              onChangeText={setInput}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity
            onPress={() => send()}
            disabled={!input.trim() || loading}
            style={[
              s.sendBtn,
              {
                backgroundColor: input.trim() && !loading ? theme.brand.primary : theme.surface.inset
              }
            ]}
          >
            <Ionicons
              name="send"
              size={18}
              color={input.trim() && !loading ? '#ffffff' : theme.text.disabled}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  msgs: { padding: spacing[4], gap: spacing[3] },
  msgWrap: { flexDirection: 'row' },
  userWrap: { justifyContent: 'flex-end' },
  asstWrap: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, padding: spacing[3], gap: 4, ...shadows.sm },
  msgText: { fontSize: fontSize.base, lineHeight: 22 },
  ts: { fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
  actionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  actionBadgeTxt: { fontSize: 11, fontWeight: fontWeight.semibold },
  chipsSec: { paddingVertical: spacing[2], borderTopWidth: 1, borderTopColor: 'transparent' },
  chipsRow: { paddingHorizontal: spacing[4], gap: spacing[2] },
  sugChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1 },
  sugTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderTopWidth: 1 },
  sendBtn: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }
});
