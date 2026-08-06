import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { MapPin, Users, Calendar, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { Plan } from '../../types';

interface PlanCardProps {
  plan: Plan;
  onPress?: () => void;
}

export default function PlanCard({ plan, onPress }: PlanCardProps) {
  const { host, title, tags, venue, capacity, current_participants, scheduled_at } = plan;
  
  const dateObj = new Date(scheduled_at);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Header: Host Info */}
      <View style={styles.header}>
        <View style={styles.hostInfo}>
          {host?.avatar_url ? (
            <Image source={{ uri: host.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.muted }]} />
          )}
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.hostName} numberOfLines={1}>{host?.full_name || 'Unknown'}</Text>
              {host?.is_verified && (
                <CheckCircle2 size={14} color="#1D9BF0" style={styles.verifiedIcon} />
              )}
            </View>
            <Text style={styles.hostSubtitle}>Host</Text>
          </View>
        </View>
        {tags && tags.length > 0 && (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>#{tags[0].toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Body: Plan Details */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        <View style={styles.metaRow}>
          <MapPin size={16} color={theme.colors.mutedForeground} />
          <Text style={styles.metaText}>{venue}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <Calendar size={16} color={theme.colors.mutedForeground} />
          <Text style={styles.metaText}>{formattedDate} • {formattedTime}</Text>
        </View>
      </View>

      {/* Footer: Capacity */}
      <View style={styles.footer}>
        <View style={styles.capacityContainer}>
          <Users size={16} color={theme.colors.primary} />
          <Text style={styles.capacityText}>
            {current_participants}/{capacity} joined
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.pill,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    maxWidth: '100%',
  },
  hostName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  hostSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  categoryPill: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.pill,
  },
  categoryText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  body: {
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.foreground,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  capacityText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
  },
});
