import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Image, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MapPin, Calendar, Users, CheckCircle2, Shield, ArrowLeft, Share2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { MOCK_PLANS } from '../../lib/mockData';

export default function PlanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const initialPlan = MOCK_PLANS.find(p => p.id === id) || MOCK_PLANS[0];
  
  const [joined, setJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(initialPlan.current_participants);

  const { host, title, category, description, venue_name, scheduled_at, max_capacity, gender_reach, distance_km, participants_list } = initialPlan;

  const dateObj = new Date(scheduled_at);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const handleToggleJoin = () => {
    if (joined) {
      setJoined(false);
      setParticipantCount(c => c - 1);
      Alert.alert('Left Plan', 'You have left this plan.');
    } else {
      if (participantCount >= max_capacity) {
        Alert.alert('Plan Full', 'This plan has reached its maximum capacity.');
        return;
      }
      setJoined(true);
      setParticipantCount(c => c + 1);
      Alert.alert('Plan Joined! 🎉', 'You are on the attendee list. Chat with the host & members in Messages.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerCategory}>{category.toUpperCase()}</Text>
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
              <Text style={styles.infoTitle}>{venue_name}</Text>
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
            <Text style={styles.mapSub}>{venue_name}</Text>
          </View>
        </View>

        {/* Attendees Section */}
        <View style={styles.attendeesSection}>
          <View style={styles.attendeesHeader}>
            <Text style={styles.sectionTitle}>Attendees</Text>
            <Text style={styles.capacityTag}>{participantCount} / {max_capacity} joined</Text>
          </View>

          <View style={styles.attendeeList}>
            {(participants_list || []).map((p, idx) => (
              <View key={idx} style={styles.attendeeRow}>
                {p.avatar_url ? (
                  <Image source={{ uri: p.avatar_url }} style={styles.attendeeAvatar} />
                ) : (
                  <View style={[styles.attendeeAvatar, { backgroundColor: theme.colors.muted }]} />
                )}
                <Text style={styles.attendeeName}>{p.full_name}</Text>
                {p.id === host?.id && <Text style={styles.hostBadge}>HOST</Text>}
              </View>
            ))}
            {joined && (
              <View style={styles.attendeeRow}>
                <View style={[styles.attendeeAvatar, { backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 14 }}>🧑</Text>
                </View>
                <Text style={styles.attendeeName}>You (Joined)</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Join CTA Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Users size={16} color={theme.colors.mutedForeground} />
          <Text style={styles.bottomCapacityText}>{max_capacity - participantCount} spots left</Text>
        </View>
        <Pressable
          style={[styles.joinBtn, joined && styles.joinBtnActive]}
          onPress={handleToggleJoin}
        >
          <Text style={[styles.joinBtnText, joined && styles.joinBtnTextActive]}>
            {joined ? 'Joined ✓ (Leave Plan)' : 'Join Plan →'}
          </Text>
        </Pressable>
      </View>
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
  joinBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' },
  joinBtnTextActive: { color: theme.colors.primary },
});
