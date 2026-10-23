import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, ScrollView, Alert } from 'react-native';
import { Check, X, Users } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { theme } from '../../styles/theme';
import { PlanParticipant } from '../../types';
import { supabase } from '../../lib/supabase';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';

interface AttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  planId: string;
  hostId: string;
  attendees: PlanParticipant[];
  onComplete: (presentIds: string[]) => void;
}

export default function AttendanceModal({ visible, onClose, planId, hostId, attendees, onComplete }: AttendanceModalProps) {
  const queryClient = useQueryClient();
  // Store the IDs of the participants marked as present
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set(attendees.map(a => a.id)));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAttendance = (id: string) => {
    const newSet = new Set(presentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setPresentIds(newSet);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const attendeeIds = Array.from(presentIds);
      const absenteeIds = attendees.filter(a => !presentIds.has(a.id)).map(a => a.id);

      const { error } = await supabase.rpc('mark_plan_completed_and_attendance', {
        p_plan_id: planId,
        p_host_id: hostId,
        p_attendees: attendeeIds,
        p_absentees: absenteeIds
      });

      if (error) {
        // If plan was already marked completed in database, treat as resolved
        const isAlreadyCompleted = error.message?.toLowerCase().includes('already completed');
        if (isAlreadyCompleted) {
          queryClient.setQueryData(['plan', planId], (old: any) =>
            old ? { ...old, status: 'completed' } : old
          );
          queryClient.invalidateQueries({ queryKey: ['plan', planId] });
          queryClient.invalidateQueries({ queryKey: ['my_plans'] });
          queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
          onComplete(attendeeIds);
          return;
        }
        throw error;
      }
      
      // Instantly sync React Query cache to completed status
      queryClient.setQueryData(['plan', planId], (old: any) =>
        old ? { ...old, status: 'completed' } : old
      );
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['my_plans'] });
      queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });

      onComplete(attendeeIds);
    } catch (err: any) {
      Alert.alert(
        'Unable to Save Attendance',
        getUserFriendlyErrorMessage(
          err,
          'Could not record attendance right now. Please try again in a moment.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Mark Attendance</Text>
              <Text style={styles.subtitle}>Who showed up to the event?</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>

          {attendees.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={32} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyText}>You were the only one who joined.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {attendees.map(a => {
                const isPresent = presentIds.has(a.id);
                return (
                  <Pressable 
                    key={a.id} 
                    style={[styles.row, isPresent && styles.rowPresent]}
                    onPress={() => toggleAttendance(a.id)}
                  >
                    {a.avatar_url ? (
                      <Image source={{ uri: a.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: theme.colors.muted }]} />
                    )}
                    <Text style={[styles.name, isPresent && styles.namePresent]}>{a.full_name || 'Member'}</Text>
                    <View style={[styles.toggleBtn, isPresent && styles.toggleBtnPresent]}>
                      {isPresent && <Check size={14} color="#fff" />}
                    </View>
                  </Pressable>
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
              {isSubmitting ? 'Saving...' : 'Submit & Complete Plan'}
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
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.colors.card, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  rowPresent: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { fontFamily: theme.typography.fontFamily.medium, fontSize: 16, color: theme.colors.mutedForeground, flex: 1 },
  namePresent: { color: theme.colors.foreground, fontFamily: theme.typography.fontFamily.bold },
  toggleBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  toggleBtnPresent: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  submitBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: '#fff' }
});
