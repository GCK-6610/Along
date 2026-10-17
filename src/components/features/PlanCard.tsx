import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { MapPin, Users, Calendar, CheckCircle2, Clock } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { Plan } from '../../types';

interface PlanCardProps {
  plan: Plan;
  onPress?: () => void;
}

const CATEGORY_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  coffee: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  fitness: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
  art: { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  networking: { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' },
  outdoors: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  chill: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  food: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  drinks: { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' },
  sports: { bg: '#CCFBF1', text: '#0F766E', border: '#99F6E4' },
};

function formatPlanSchedule(dateStr: string) {
  if (!dateStr) return { label: 'Time TBD', isToday: false };
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) return { label: `Today • ${timeStr}`, isToday: true, isTomorrow: false };
  if (isTomorrow) return { label: `Tomorrow • ${timeStr}`, isToday: false, isTomorrow: true };
  return {
    label: `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • ${timeStr}`,
    isToday: false,
    isTomorrow: false,
  };
}

export default function PlanCard({ plan, onPress }: PlanCardProps) {
  const { host, title, tags, venue, capacity, scheduled_at, participants_list } = plan;
  
  const approvedList = (participants_list || []).filter((p: any) => p.join_status === 'approved');
  const approvedCount = approvedList.length;
  const current_participants = plan.current_participants ?? Math.max(1, approvedCount);

  const primaryTag = tags?.[0]?.toLowerCase() || 'hangout';
  const tagTheme = CATEGORY_THEMES[primaryTag] || {
    bg: theme.colors.secondary,
    text: theme.colors.primary,
    border: 'transparent',
  };

  const scheduleInfo = formatPlanSchedule(scheduled_at);
  const isFull = current_participants >= capacity;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Header: Host & Category Tag */}
      <View style={styles.header}>
        <View style={styles.hostInfo}>
          {host?.avatar_url ? (
            <Image
              source={{ uri: host.avatar_url, headers: { Accept: 'image/png' } }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {host?.full_name ? host.full_name[0].toUpperCase() : '👤'}
              </Text>
            </View>
          )}
          <View style={styles.hostMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.hostName} numberOfLines={1}>
                {host?.full_name || 'Anonymous Host'}
              </Text>
              {host?.is_verified && (
                <CheckCircle2 size={14} color="#1D9BF0" style={styles.verifiedIcon} />
              )}
            </View>
            <View style={styles.hostSubRow}>
              <Text style={styles.hostSubtitle}>Host</Text>
              <Text style={styles.dotSeparator}>•</Text>
              {host?.rating_count && host.rating_count > 0 ? (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>★</Text>
                  <Text style={styles.ratingText}>
                    {host.rating_avg ? host.rating_avg.toFixed(1) : '5.0'}
                  </Text>
                  <Text style={styles.ratingCountText}>({host.rating_count})</Text>
                </View>
              ) : (
                <View style={styles.ratingBadgeNew}>
                  <Text style={styles.ratingTextNew}>⭐ New</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: tagTheme.bg, borderColor: tagTheme.border }]}>
          <Text style={[styles.categoryText, { color: tagTheme.text }]}>
            #{primaryTag.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Body: Title, Location & Human Time */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <MapPin size={15} color={theme.colors.mutedForeground} />
          <Text style={styles.metaText} numberOfLines={1}>
            {venue || 'Location to be revealed'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Clock size={15} color={scheduleInfo.isToday ? theme.colors.primary : theme.colors.mutedForeground} />
          <Text
            style={[
              styles.metaText,
              scheduleInfo.isToday && { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold }
            ]}
          >
            {scheduleInfo.label}
          </Text>
        </View>
      </View>

      {/* Footer: Overlapping Attendee Stack & Capacity Badge */}
      <View style={styles.footer}>
        <View style={styles.attendeeSection}>
          {approvedList.length > 0 ? (
            <View style={styles.avatarStack}>
              {approvedList.slice(0, 3).map((p: any, i: number) => {
                const avatar = p.avatar_url || p.profiles?.avatar_url;
                return avatar ? (
                  <Image
                    key={p.id || i}
                    source={{ uri: avatar }}
                    style={[styles.stackAvatar, { marginLeft: i > 0 ? -10 : 0 }]}
                  />
                ) : (
                  <View
                    key={p.id || i}
                    style={[styles.stackAvatar, styles.stackAvatarFallback, { marginLeft: i > 0 ? -10 : 0 }]}
                  >
                    <Text style={styles.stackFallbackText}>
                      {(p.full_name || p.profiles?.full_name || 'U')[0]}
                    </Text>
                  </View>
                );
              })}
              {approvedCount > 3 && (
                <View style={[styles.stackAvatar, styles.stackCount, { marginLeft: -10 }]}>
                  <Text style={styles.stackCountText}>+{approvedCount - 3}</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.openSpotText}>First spot open</Text>
          )}
        </View>

        <View style={[styles.capacityPill, isFull && styles.capacityPillFull]}>
          <Users size={13} color={isFull ? theme.colors.mutedForeground : theme.colors.primary} />
          <Text style={[styles.capacityText, isFull && styles.capacityTextFull]}>
            {isFull ? 'Full' : `${current_participants}/${capacity} joined`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 46, 0.06)',
    shadowColor: '#1C1B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: theme.colors.primary + '20',
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  hostMeta: {
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  hostName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  hostSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.mutedForeground,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  body: {
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.foreground,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    color: theme.colors.mutedForeground,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 27, 46, 0.05)',
    paddingTop: 12,
  },
  attendeeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stackAvatarFallback: {
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackFallbackText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: theme.colors.primary,
  },
  stackCount: {
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackCountText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 9,
    color: theme.colors.foreground,
  },
  openSpotText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    fontStyle: 'italic',
  },
  capacityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.pill,
  },
  capacityPillFull: {
    backgroundColor: theme.colors.muted,
  },
  capacityText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    color: theme.colors.primary,
  },
  capacityTextFull: {
    color: theme.colors.mutedForeground,
  },
  hostSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dotSeparator: {
    color: theme.colors.mutedForeground,
    fontSize: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingStar: {
    color: '#D97706',
    fontSize: 10,
  },
  ratingText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: '#92400E',
  },
  ratingCountText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 9,
    color: '#B45309',
  },
  ratingBadgeNew: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingTextNew: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 9,
    color: theme.colors.primary,
  },
});
