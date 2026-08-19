import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, Pressable, Image, KeyboardAvoidingView, Platform, ActivityIndicator

} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useChat, ChatMessage } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../hooks/usePlan';

export default function PlanChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plan, isLoading: planLoading } = usePlan(id);
  const { messages, isLoading: chatLoading, sendMessage } = useChat(id);
  const { session } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user_id === session?.user?.id;
    const isHost = item.user_id === plan?.host_id;

    if (isMe) {
      return (
        <View style={[styles.msgRow, styles.msgRowMe]}>
          <View style={styles.bubbleMe}>
            <Text style={styles.bubbleTextMe}>{item.content}</Text>
            <Text style={styles.timeMe}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.msgRow}>
        {item.user?.avatar_url ? (
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Top Chat Bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            {plan ? (
              <>
                <Text style={styles.planTitle} numberOfLines={1}>{plan.title}</Text>
                <Text style={styles.planSub}>{plan.current_participants} members • {plan.venue}</Text>
              </>
            ) : (
              <ActivityIndicator color={theme.colors.foreground} />
            )}
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
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
  headerTitleGroup: { flex: 1 },
  planTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  planSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
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
});
