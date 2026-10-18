import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { Star, X, MapPin } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { supabase } from '../../lib/supabase';

interface VenueRatingModalProps {
  visible: boolean;
  onClose: () => void;
  planId: string;
  venueName: string;
  userId: string;
  onSuccess?: () => void;
}

const TAG_OPTIONS = [
  'Spacious Seating',
  'Great Ambience',
  'Group Friendly',
  'Good Food & Drinks',
  'Fast Wi-Fi',
  'A Bit Noisy'
];

export default function VenueRatingModal({
  visible,
  onClose,
  planId,
  venueName,
  userId,
  onSuccess
}: VenueRatingModalProps) {
  const [score, setScore] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!score || score < 1) {
      Alert.alert('Please select a star rating');
      return;
    }

    try {
      setIsSubmitting(true);
      const combinedFeedback = [
        ...selectedTags,
        feedback.trim()
      ].filter(Boolean).join(' • ');

      const { error } = await supabase
        .from('venue_ratings')
        .upsert({
          plan_id: planId,
          user_id: userId,
          venue_name: venueName,
          score: score,
          feedback: combinedFeedback || null
        }, {
          onConflict: 'plan_id,user_id'
        });

      if (error) throw error;

      Alert.alert('Venue Rated! ✨', `Thanks! Your ${score}-star rating updates the live Along Community Rating for ${venueName}.`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit venue rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.badgeRow}>
                <MapPin size={13} color={theme.colors.primary} />
                <Text style={styles.badgeText}>VENUE FEEDBACK</Text>
              </View>
              <Text style={styles.title} numberOfLines={1}>Rate Venue</Text>
              <Text style={styles.subtitle} numberOfLines={2}>How was your hangout experience at {venueName}?</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 5-Star Selection */}
            <View style={styles.starsCard}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setScore(star)}
                    style={styles.starTouch}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Star
                      size={32}
                      color={star <= score ? '#FFD32A' : theme.colors.border}
                      fill={star <= score ? '#FFD32A' : 'none'}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.scoreLabel}>
                {score === 5 && '🌟 Excellent for Group Hangouts'}
                {score === 4 && '👍 Great Vibe & Seating'}
                {score === 3 && '👌 Decent Experience'}
                {score === 2 && '👎 Could Be Better'}
                {score === 1 && '⚠️ Not Recommended for Groups'}
              </Text>
            </View>

            {/* Quick Tag Pills */}
            <Text style={styles.sectionLabel}>Highlights (Optional):</Text>
            <View style={styles.tagsContainer}>
              {TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Short Comment Note */}
            <Text style={styles.sectionLabel}>Extra notes for fellow Along members:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Plenty of plug points, quiet corner tables..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={feedback}
              onChangeText={setFeedback}
              maxLength={140}
            />
          </ScrollView>

          <Pressable
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Submitting...' : 'Submit Along Rating ✨'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 22,
    color: theme.colors.foreground,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.mutedForeground,
    marginTop: 2,
    lineHeight: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  body: {
    marginBottom: 16,
  },
  starsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  starTouch: {
    padding: 4,
  },
  scoreLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
    color: theme.colors.foreground,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    color: theme.colors.foreground,
    marginBottom: 8,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 12,
    color: theme.colors.foreground,
  },
  tagTextSelected: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.bold,
  },
  textInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 15,
    color: '#fff',
  },
});
