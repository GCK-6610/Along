import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Send, Lock } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useChat, ChatMessage } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../hooks/usePlan';
import { safeBack } from '../../utils/navigation';
import { markChatAsRead } from '../../lib/chatReceipts';
import { PlanParticipant } from '../../types';
import { canWrapUpHangout, getApprovedAttendeeCount } from '../../utils/hangoutLifecycle';

export default function PlanChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plan, isLoading: planLoading } = usePlan(id);
  const { messages, isLoading: chatLoading, sendMessage } = useChat(id);
  const { session } = useAuth();
  
  useEffect(() => {
    if (id) {
      markChatAsRead(id);
    }
  }, [id, messages.length]);
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const scheduledTime = plan?.scheduled_at ? new Date(plan.scheduled_at).getTime() : 0;
  const isPast10Days = scheduledTime > 0 ? scheduledTime < Date.now() - 10 * 24 * 60 * 60 * 1000 : false;
  const isCurrentUserHost = Boolean(session?.user?.id && plan?.host_id === session.user.id);
  const canWrapUp = plan?.scheduled_at ? canWrapUpHangout(plan.scheduled_at, plan.status, isCurrentUserHost) : false;
  const isArchived = plan?.status === 'completed' || plan?.status === 'cancelled' || isPast10Days;
  const approvedCount = getApprovedAttendeeCount(plan?.participants_list, plan?.host_id);

  const handleSend = () => {
    if (isArchived || !inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 60);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user_id === session?.user?.id;
    const isHost = item.user_id === plan?.host_id;

    if (isMe) {
      return (
        <View style={[styles.msgRow, styles.msgRowMe]}>
          <View style={[styles.bubbleMe, item.isOptimistic && { opacity: 0.85 }]}>
            <Text style={styles.bubbleTextMe}>{item.content}</Text>
            <Text style={styles.timeMe}>
              {item.isOptimistic
                ? 'Sending...'
                : new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.msgRow}>
        {item.user?.avatar_url ? (
          <Image
            source={{ uri: item.user.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.muted }]} />
        )}
        <View style={styles.msgContent}>
          <View style={styles.senderHeader}>
            <Text style={styles.senderName}>{item.user?.full_name || 'User'}</Text>
            {isHost && <Text style={styles.hostTag}>HOST</Text>}
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.bubbleOther}>
            <Text style={styles.bubbleTextOther}>{item.content}</Text>
          </View>
        </View>
      </View>
    );
  };

  const approvedAttendees = (plan?.participants_list || []).filter(
    (p: PlanParticipant) => p.join_status === 'approved' && p.id !== plan?.host_id
  );
  const memberCount = 1 + approvedAttendees.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Top Chat Bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)/messages')}>
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            {plan ? (
              <>
                <Text style={styles.planTitle} numberOfLines={1}>{plan.title}</Text>
                <Text style={styles.planSub}>{memberCount} members • {plan.venue}</Text>
              </>
            ) : (
              <ActivityIndicator color={theme.colors.foreground} />
            )}
          </View>
          <Pressable style={styles.viewPlanBtn} onPress={() => router.navigate({ pathname: '/plan/[id]', params: { id } })}>
            <Text style={styles.viewPlanText}>View Plan</Text>
          </Pressable>
        </View>
        
        {/* Post-Hangout Prompt Banner for Host (Appears only after 1-hour grace window) */}
        {Boolean(isCurrentUserHost && canWrapUp && plan?.status === 'active') && (
          <View style={styles.hostPromptBanner}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.hostPromptTitle}>
                {approvedCount > 0 ? 'Hangout Wrap-up • Rate Attendees 🎉' : 'Hangout Concluded • 0 Joins'}
              </Text>
              <Text style={styles.hostPromptSub}>
                {approvedCount > 0
                  ? 'Hangout has been underway for over an hour. When finished, rate attendees to complete.'
                  : 'No attendees joined before start time. Reschedule or archive.'}
              </Text>
            </View>
            <Pressable
              style={styles.hostPromptActionBtn}
              onPress={() => router.push({ pathname: '/plan/[id]', params: { id } })}
            >
              <Text style={styles.hostPromptActionText}>
                {approvedCount > 0 ? 'Complete' : 'Manage'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            !chatLoading ? (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatEmoji}>💬</Text>
                <Text style={styles.emptyChatTitle}>Say Hello!</Text>
                <Text style={styles.emptyChatSub}>
                  Break the ice and coordinate details with the group.
                </Text>
              </View>
            ) : (
              <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
            )
          }
        />

        {/* Input Bar or Archived Banner */}
        {isArchived ? (
          <View style={styles.archivedBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Lock size={15} color={theme.colors.mutedForeground} />
              <Text style={styles.archivedBarText} numberOfLines={1}>
                {plan?.status === 'cancelled'
                  ? 'Hangout archived with 0 joins. Chat closed.'
                  : 'Hangout concluded. Chat is archived.'}
              </Text>
            </View>
            {!isCurrentUserHost && plan?.status === 'completed' && (
              <Pressable 
                style={styles.rateHostChatBtn} 
                onPress={() => router.navigate({ pathname: '/plan/[id]', params: { id } })}
              >
                <Text style={styles.rateHostChatText}>Rate Host ⭐</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              maxLength={1000}
            />
            <Pressable
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={18} color="#fff" />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md, paddingVertical: 12,
    backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },
  headerTitleGroup: { flex: 1, marginRight: 8 },
  planTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  planSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  viewPlanBtn: { backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill },
  viewPlanText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary, textTransform: 'uppercase' },
  list: { padding: theme.spacing.md, gap: theme.spacing.md },
  msgRow: { flexDirection: 'row', gap: theme.spacing.sm, maxWidth: '85%' },
  msgRowMe: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginTop: 4 },
  msgContent: { flex: 1, gap: 4 },
  senderHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  senderName: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.foreground },
  hostTag: { fontFamily: theme.typography.fontFamily.bold, fontSize: 9, color: theme.colors.primary, backgroundColor: theme.colors.secondary, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  timeText: { fontFamily: theme.typography.fontFamily.regular, fontSize: 10, color: theme.colors.mutedForeground, marginLeft: 'auto' },
  bubbleOther: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border,
  },
  bubbleTextOther: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground, lineHeight: 20 },
  bubbleMe: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm, gap: 2,
  },
  bubbleTextMe: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: '#fff', lineHeight: 20 },
  timeMe: { fontFamily: theme.typography.fontFamily.regular, fontSize: 9, color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, paddingHorizontal: theme.spacing.md, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.pill,
    paddingHorizontal: 16, paddingVertical: 10, fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm, color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  emptyChat: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  emptyChatEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyChatTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  emptyChatSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
  archivedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  archivedBarText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  rateHostChatBtn: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  rateHostChatText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 11,
    color: theme.colors.primary,
  },
  hostPromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    gap: 12,
  },
  hostPromptTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: '#92400E',
  },
  hostPromptSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: '#B45309',
  },
  hostPromptActionBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
  },
  hostPromptActionText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
  },
});
