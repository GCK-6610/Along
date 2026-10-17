import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, ScrollView, Alert } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { PlanParticipant } from '../../types';
import { supabase } from '../../lib/supabase';

interface RatingsModalProps {
  visible: boolean;
  onClose: () => void;
  planId: string;
  hostId?: string;
  raterId?: string;
  ratees: PlanParticipant[];
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
}

export default function RatingsModal({ 
  visible, 
  onClose, 
  planId, 
  hostId, 
  raterId, 
  ratees,
  title,
  subtitle,
  onSuccess 
}: RatingsModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = (userId: string, score: number) => {
    setRatings(prev => ({ ...prev, [userId]: score }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const activeRaterId = raterId || hostId;
      if (!activeRaterId) {
        throw new Error('Rater identification missing.');
      }

      const ratingEntries = Object.entries(ratings).map(([rateeId, score]) => ({
        plan_id: planId,
        rater_id: activeRaterId,
        ratee_id: rateeId,
        score
      }));

      if (ratingEntries.length === 0) {
        onClose();
        return;
      }

      const { error } = await supabase.from('ratings').insert(ratingEntries);
      if (error) throw error;
      
      Alert.alert('Thanks!', 'Your rating has been submitted successfully.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSingle = ratees.length === 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title || (isSingle ? 'Rate Host' : 'Rate Attendees')}</Text>
              <Text style={styles.subtitle}>{subtitle || (isSingle ? 'How was your experience with the host?' : 'How was your experience with them?')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>

          {ratees.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No attendees to rate.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {ratees.map(a => {
                const currentScore = ratings[a.id] || 0;
                return (
                  <View key={a.id} style={styles.row}>
                    <View style={styles.userInfo}>
                      {a.avatar_url ? (
                        <Image source={{ uri: a.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: theme.colors.muted }]} />
                      )}
                      <Text style={styles.name}>{a.full_name}</Text>
                    </View>
                    
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Pressable key={star} onPress={() => handleRate(a.id, star)} style={styles.starBtn}>
                          <Star 
                            size={28} 
                            color={star <= currentScore ? theme.colors.primary : theme.colors.border} 
                            fill={star <= currentScore ? theme.colors.primary : 'transparent'} 
                          />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <Pressable 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Saving...' : 'Submit Ratings'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: 22, color: theme.colors.foreground },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, marginTop: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: theme.typography.fontFamily.medium, fontSize: 16, color: theme.colors.mutedForeground },
  list: { marginBottom: 24 },
  row: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, gap: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  name: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.colors.foreground, flex: 1 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  starBtn: { padding: 4 },
  submitBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: '#fff' }
});
