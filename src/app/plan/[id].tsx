import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Image, Alert, Modal, TextInput
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { MapPin, Calendar, Users, CheckCircle2, Shield, ArrowLeft, Share2, Check, X } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { ActivityIndicator } from 'react-native';
import { triggerJoinSuccessNotification } from '../../lib/notifications';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../hooks/usePlan';

export default function PlanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const { plan, isLoading, requestToJoin, leavePlan, updateJoinRequest } = usePlan(id as string);
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [introText, setIntroText] = useState('');

  if (isLoading || !plan) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const myParticipant = plan.participants_list?.find(p => p.id === user?.id);
  const isJoined = myParticipant?.join_status === 'approved';
  const isPending = myParticipant?.join_status === 'pending';
  const isHost = user?.id === plan.host_id;
  const pendingRequests = isHost ? (plan.participants_list?.filter(p => p.join_status === 'pending') || []) : [];

  const handleRequestJoin = async () => {
    if (!user || !plan) return;
    if (isJoined || isPending) {
      await leavePlan();
      Alert.alert('Left Plan', 'You have withdrawn your request or left the plan.');
    } else {
      if (plan.current_participants >= plan.capacity) {
        Alert.alert('Plan Full', 'This plan has reached its maximum capacity.');
        return;
      }
      setJoinModalVisible(true);
    }
  };

  const submitJoinRequest = async () => {
    if (!user || !plan) return;
    try {
      await requestToJoin(introText);
      triggerJoinSuccessNotification(plan.title);
      Alert.alert('Request Sent', 'Your request has been sent to the host.');
      setJoinModalVisible(false);
      setIntroText('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await updateJoinRequest(userId, 'approved');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await updateJoinRequest(userId, 'rejected');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const { host, title, tags, description, venue, scheduled_at, capacity, gender_reach, distance_km, participants_list } = plan;

  const dateObj = new Date(scheduled_at);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerCategory}>{(tags?.[0] || 'OTHER').toUpperCase()}</Text>
        <Pressable style={styles.iconBtn} onPress={() => Alert.alert('Shared', 'Plan link copied to clipboard!')}>
          <Share2 size={18} color={theme.colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Host Card */}
        <View style={styles.hostCard}>
          {host?.avatar_url ? (
            <Image source={{ uri: host.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.muted }]} />
          )}
          <View style={styles.hostDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.hostName}>{host?.full_name || 'Host'}</Text>
              {host?.is_verified && <CheckCircle2 size={15} color="#1D9BF0" />}
            </View>
            <Text style={styles.hostLabel}>Host & Organizer</Text>
          </View>
          <View style={styles.reachBadge}>
            <Text style={styles.reachText}>
              {gender_reach === 'same' ? (host?.gender === 'male' ? '🔒 Men Only' : '🔒 Women Only') : '👥 Everyone'}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <View style={styles.mainSection}>
          <Text style={styles.title}>{title}</Text>
          {tags && tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((t, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {/* Venue & Distance */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <MapPin size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoTitle}>{venue}</Text>
              {distance_km && <Text style={styles.infoSub}>{distance_km} km away from your location</Text>}
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <Calendar size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoTitle}>{formattedDate}</Text>
              <Text style={styles.infoSub}>Starts at {formattedTime}</Text>
            </View>
          </View>
        </View>

        {/* Map Preview Widget */}
        <View style={styles.mapCard}>
          <View style={styles.mapPlaceholder}>
            <MapPin size={24} color={theme.colors.primary} />
            <Text style={styles.mapText}>Venue Location Map</Text>
            <Text style={styles.mapSub}>{venue}</Text>
          </View>
        </View>

        {/* Join Requests (Host Only) */}
        {isHost && pendingRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Join Requests ({pendingRequests.length})</Text>
            <View style={styles.requestList}>
              {pendingRequests.map((p, idx) => (
                <View key={idx} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    {p.avatar_url ? (
                      <Image source={{ uri: p.avatar_url }} style={styles.attendeeAvatar} />
                    ) : (
                      <View style={[styles.attendeeAvatar, { backgroundColor: theme.colors.muted }]} />
                    )}
                    <Text style={styles.requestName}>{p.full_name}</Text>
                  </View>
                  <Text style={styles.requestMessage}>"{p.intro_message || 'I would like to join your plan!'}"</Text>
                  <View style={styles.requestActions}>
                    <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprove(p.id)}>
                      <Check size={16} color="#fff" />
                      <Text style={styles.approveText}>Approve</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(p.id)}>
                      <X size={16} color={theme.colors.mutedForeground} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Attendees Section */}
        <View style={styles.attendeesSection}>
          <View style={styles.attendeesHeader}>
            <Text style={styles.sectionTitle}>Attendees</Text>
            <Text style={styles.capacityTag}>{plan.current_participants} / {capacity} joined</Text>
          </View>

          <View style={styles.attendeeList}>
            {(participants_list || []).filter(p => p.join_status === 'approved' || !p.join_status).map((p, idx) => (
              <View key={idx} style={styles.attendeeRow}>
                {p.avatar_url ? (
                  <Image source={{ uri: p.avatar_url }} style={styles.attendeeAvatar} />
                ) : (
                  <View style={[styles.attendeeAvatar, { backgroundColor: theme.colors.muted }]} />
                )}
                <Text style={styles.attendeeName}>{p.full_name}{p.id === user?.id ? ' (You)' : ''}</Text>
                {p.id === host?.id && <Text style={styles.hostBadge}>HOST</Text>}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Join CTA Bar */}
      {!isHost && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Users size={16} color={theme.colors.mutedForeground} />
            <Text style={styles.bottomCapacityText}>{capacity - plan.current_participants} spots left</Text>
          </View>
          <Pressable
            style={[
              styles.joinBtn, 
              isJoined && styles.joinBtnActive,
              isPending && styles.joinBtnPending
            ]}
            onPress={handleRequestJoin}
          >
            <Text style={[
              styles.joinBtnText, 
              isJoined && styles.joinBtnTextActive,
              isPending && styles.joinBtnTextPending
            ]}>
              {isJoined ? 'Joined ✓ (Leave)' : isPending ? 'Requested (Pending)' : 'Request to Join →'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Intro Message Modal */}
      <Modal visible={isJoinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request to Join</Text>
              <Pressable onPress={() => setJoinModalVisible(false)} style={styles.modalClose}>
                <X size={20} color={theme.colors.foreground} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Introduce yourself to the host! Why do you want to join this plan?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Hi! I love coffee and would love to chat about startups..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={introText}
              onChangeText={setIntroText}
              multiline
              maxLength={200}
            />
            <Pressable 
              style={[styles.submitRequestBtn, !introText.trim() && styles.submitRequestBtnDisabled]}
              onPress={submitJoinRequest}
              disabled={!introText.trim()}
            >
              <Text style={styles.submitRequestBtnText}>Send Request</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCategory: {
    fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary, letterSpacing: 1,
  },
  scroll: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 100 },
  hostCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  hostDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hostName: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  hostLabel: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  reachBadge: { backgroundColor: theme.colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.pill },
  reachText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.primary },
  mainSection: { gap: 6 },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxl, color: theme.colors.foreground, letterSpacing: -0.3 },
  description: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.mutedForeground, lineHeight: 22 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tagPill: { backgroundColor: theme.colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  tagText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary, textTransform: 'uppercase' },
  infoGrid: { gap: theme.spacing.sm },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  infoIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' },
  infoTextGroup: { flex: 1 },
  infoTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  infoSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: 2 },
  mapCard: {
    borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.card, height: 120,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDECE8', gap: 4 },
  mapText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground },
  mapSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  attendeesSection: { gap: theme.spacing.sm },
  attendeesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground },
  capacityTag: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.primary },
  attendeeList: { gap: theme.spacing.xs },
  attendeeRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border,
  },
  attendeeAvatar: { width: 32, height: 32, borderRadius: 16 },
  attendeeName: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground, flex: 1 },
  hostBadge: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary, backgroundColor: theme.colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  
  requestsSection: { gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  requestList: { gap: theme.spacing.sm },
  requestCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  requestName: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  requestMessage: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground, fontStyle: 'italic', marginBottom: theme.spacing.md },
  requestActions: { flexDirection: 'row', gap: theme.spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: theme.borderRadius.md, flex: 1 },
  approveBtn: { backgroundColor: theme.colors.primary, gap: 6 },
  rejectBtn: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  approveText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: '#fff' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.card, paddingHorizontal: theme.spacing.md, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  bottomInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomCapacityText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  joinBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg, paddingVertical: 12,
  },
  joinBtnActive: {
    backgroundColor: theme.colors.secondary, borderWidth: 1, borderColor: theme.colors.primary,
  },
  joinBtnPending: {
    backgroundColor: theme.colors.muted,
  },
  joinBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' },
  joinBtnTextActive: { color: theme.colors.primary },
  joinBtnTextPending: { color: theme.colors.mutedForeground },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 20, color: theme.colors.foreground },
  modalClose: { padding: 4 },
  modalSubtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, marginBottom: 20 },
  modalInput: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, fontFamily: theme.typography.fontFamily.regular, fontSize: 15, color: theme.colors.foreground, height: 120, textAlignVertical: 'top', marginBottom: 24 },
  submitRequestBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitRequestBtnDisabled: { backgroundColor: theme.colors.muted },
  submitRequestBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: '#fff' },
});
