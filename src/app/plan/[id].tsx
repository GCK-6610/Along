import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Alert, Modal, TextInput, Linking, Platform, Share, KeyboardAvoidingView
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { MapPin, Calendar, Users, CheckCircle2, Shield, ArrowLeft, Share2, Check, X, Edit2, MessageCircle, Star, Clock, ShieldAlert } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { BrandLoader } from '../../components/common/BrandLoader';

import { ActivityIndicator } from 'react-native';
import { triggerRequestSentNotification } from '../../lib/notifications';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../hooks/usePlan';
import { supabase } from '../../lib/supabase';
import AttendanceModal from '../../components/features/AttendanceModal';
import RatingsModal from '../../components/features/RatingsModal';
import VenueRatingModal from '../../components/features/VenueRatingModal';
import { useQueryClient } from '@tanstack/react-query';
import { PlanParticipant } from '../../types';
import { safeBack } from '../../utils/navigation';
import { useBlockedUsers } from '../../hooks/useBlockedUsers';
import {
  hasHangoutStarted,
  isHangoutInProgress,
  canWrapUpHangout,
  getApprovedAttendeeCount
} from '../../utils/hangoutLifecycle';

export default function PlanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isBlocked, blockUser, unblockUser } = useBlockedUsers();
  
  const { plan, isLoading, requestToJoin, leavePlan, updateJoinRequest } = usePlan(id as string);
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [introText, setIntroText] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  
  const [isAttendanceVisible, setAttendanceVisible] = useState(false);
  const [isRatingsVisible, setRatingsVisible] = useState(false);
  const [ratees, setRatees] = useState<PlanParticipant[]>([]);

  const [myRating, setMyRating] = useState<number | null>(null);
  const [isAttendeeRatingVisible, setAttendeeRatingVisible] = useState(false);

  const [myVenueRating, setMyVenueRating] = useState<number | null>(null);
  const [isVenueRatingVisible, setVenueRatingVisible] = useState(false);

  const fetchMyRating = useCallback(async () => {
    if (!user?.id || !id) return;
    const { data } = await supabase
      .from('ratings')
      .select('score')
      .eq('plan_id', id)
      .eq('rater_id', user.id)
      .maybeSingle();

    if (data?.score) {
      setMyRating(data.score);
    }
  }, [user?.id, id]);

  const fetchMyVenueRating = useCallback(async () => {
    if (!user?.id || !id) return;
    const { data } = await supabase
      .from('venue_ratings')
      .select('score')
      .eq('plan_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.score) {
      setMyVenueRating(data.score);
    }
  }, [user?.id, id]);

  useFocusEffect(
    useCallback(() => {
      if (plan?.status === 'completed') {
        fetchMyRating();
        fetchMyVenueRating();
      }
    }, [plan?.status, fetchMyRating, fetchMyVenueRating])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <BrandLoader size="lg" message="Loading plan details..." />
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
        <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xl, color: theme.colors.foreground, textAlign: 'center', marginBottom: 8 }}>
          Plan Not Found
        </Text>
        <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          This hangout may have been deleted, concluded, or the link is invalid.
        </Text>
        <Pressable 
          style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.borderRadius.pill }}
          onPress={() => safeBack('/(tabs)')}
        >
          <Text style={{ color: '#fff', fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm }}>
            Back to Home
          </Text>
        </Pressable>
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
    if (!user || !plan || isSubmittingJoin) return;
    setIsSubmittingJoin(true);
    try {
      await requestToJoin(introText);
      triggerRequestSentNotification();
      // Notify the host via Push Notification Edge Function asynchronously
      supabase.functions.invoke('notify-host', {
        body: { plan_id: plan.id, user_id: user.id }
      }).catch((e) => console.log('Edge function error (ignored):', e));

      setJoinModalVisible(false);
      setIntroText('');
      Alert.alert('Request Sent', 'Your request to tag along has been sent to the host!');
    } catch (e: any) {
      if (
        e?.code === '23505' ||
        e?.message?.includes('duplicate key') ||
        e?.message?.includes('plan_participants_pkey')
      ) {
        setJoinModalVisible(false);
        setIntroText('');
        Alert.alert('Request Pending', 'Your request to join is already pending with the host.');
      } else {
        Alert.alert('Could Not Send Request', e?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmittingJoin(false);
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

  const { host, title, tags, description, venue, scheduled_at, capacity, gender_reach, distance_km, participants_list, secret_location_details, status } = plan;

  const dateObj = new Date(scheduled_at);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // Host is inherently a participant, plus any approved guest participants
  const approvedCount = getApprovedAttendeeCount(participants_list, host?.id);
  const current_participants = 1 + approvedCount;

  const hasStarted = hasHangoutStarted(scheduled_at);
  const isInProgress = isHangoutInProgress(scheduled_at, status, isHost);
  const canMarkCompleted = canWrapUpHangout(scheduled_at, status, isHost);
  const isOver10Days = dateObj.getTime() < Date.now() - 10 * 24 * 60 * 60 * 1000;
  const isCompleted = status === 'completed' || isOver10Days;
  const isCancelled = status === 'cancelled';

  const handleMarkCompleted = async () => {
    if (approvedCount === 0) {
      Alert.alert(
        'Hangout Concluded (0 Joins)',
        'No one tagged along for this hangout before its start time. Would you like to reschedule it for a new date or archive it?',
        [
          {
            text: 'Reschedule',
            onPress: () => router.push({ pathname: '/plan/edit', params: { id } }),
          },
          {
            text: 'Archive Hangout',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('plans')
                  .update({ status: 'cancelled' })
                  .eq('id', id);
                if (error) throw error;
                queryClient.invalidateQueries({ queryKey: ['plan', id] });
                queryClient.invalidateQueries({ queryKey: ['my_plans'] });
                queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
                Alert.alert('Hangout Archived', 'This hangout has been archived.');
                safeBack('/(tabs)');
              } catch (err: any) {
                Alert.alert('Error', err.message);
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setAttendanceVisible(true);
  };

  const onAttendanceCompleted = (presentIds: string[]) => {
    setAttendanceVisible(false);
    // Find all participant objects that were marked present
    const presentUsers = (participants_list || []).filter(p => presentIds.includes(p.id) && p.id !== user?.id);
    
    if (presentUsers.length > 0) {
      setRatees(presentUsers);
      setTimeout(() => {
        setRatingsVisible(true);
      }, 500); // Wait for first modal to close
    } else {
      Alert.alert('Plan Completed', 'Plan has been successfully marked as completed.');
      safeBack('/(tabs)');
    }
  };

  const isHostBlocked = host?.id ? isBlocked(host.id) : false;

  const handleSafetyOptions = () => {
    Alert.alert(
      'Safety & Moderation',
      'What would you like to do?',
      [
        {
          text: 'Report This Hangout',
          style: 'destructive',
          onPress: promptReportPlanReason,
        },
        host?.id
          ? {
              text: isHostBlocked ? 'Unblock Host' : 'Block Host',
              style: isHostBlocked ? 'default' : 'destructive',
              onPress: isHostBlocked ? confirmUnblockHost : confirmBlockHost,
            }
          : undefined,
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  const promptReportPlanReason = () => {
    Alert.alert(
      'Report Hangout',
      'Please select the reason for reporting this hangout:',
      [
        { text: 'Inappropriate Content or Behavior', onPress: () => submitPlanReport('Inappropriate Content or Behavior') },
        { text: 'Misleading Location or Scam', onPress: () => submitPlanReport('Misleading Location or Scam') },
        { text: 'Safety or Harassment Concern', onPress: () => submitPlanReport('Safety or Harassment Concern') },
        { text: 'Spam or Commercial Promotion', onPress: () => submitPlanReport('Spam or Commercial Promotion') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitPlanReport = async (reason: string) => {
    if (!user) return;
    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: host?.id,
        plan_id: id,
        reason,
        details: `Reported hangout "${title}" for: ${reason}`,
      });

      if (host?.id && !isHostBlocked) {
        Alert.alert(
          'Report Received',
          'Thank you for keeping Along safe. Would you also like to block the host of this hangout?',
          [
            {
              text: 'Block Host',
              style: 'destructive',
              onPress: async () => {
                try {
                  await blockUser(host.id);
                  Alert.alert('Host Blocked', 'The host has been blocked.');
                  safeBack('/(tabs)');
                } catch (err: any) {
                  Alert.alert('Error', err.message);
                }
              },
            },
            { text: 'Not Now', style: 'default' },
          ]
        );
      } else {
        Alert.alert('Report Received', 'Thank you for reporting. Our moderation team has been notified.');
      }
    } catch (err: any) {
      Alert.alert('Report Received', 'Thank you for keeping Along safe. Our trust & safety team has been alerted.');
    }
  };

  const confirmBlockHost = () => {
    if (!host?.id) return;
    Alert.alert(
      'Block Host',
      `Block ${host.full_name || 'this host'}? You will no longer see their hangouts, and they cannot join yours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block Host',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(host.id);
              Alert.alert('Host Blocked', `${host.full_name || 'The host'} has been blocked.`);
              safeBack('/(tabs)');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not block host.');
            }
          },
        },
      ]
    );
  };

  const confirmUnblockHost = () => {
    if (!host?.id) return;
    Alert.alert(
      'Unblock Host',
      `Unblock ${host.full_name || 'this host'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(host.id);
              Alert.alert('Host Unblocked', `${host.full_name || 'The host'} has been unblocked.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not unblock host.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerCategory}>{(tags?.[0] || 'OTHER').toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isHost && (
            <Pressable style={styles.iconBtn} onPress={() => router.push({ pathname: '/plan/edit', params: { id } })}>
              <Edit2 size={18} color={theme.colors.foreground} />
            </Pressable>
          )}
          {(isHost || isJoined) && (
            <Pressable style={styles.iconBtn} onPress={() => router.navigate({ pathname: '/messages/[id]', params: { id } })}>
              <MessageCircle size={18} color={theme.colors.foreground} />
            </Pressable>
          )}
          {!isHost && (
            <Pressable style={styles.iconBtn} onPress={handleSafetyOptions}>
              <ShieldAlert size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          )}
          <Pressable style={styles.iconBtn} onPress={async () => {
            try {
              const deepLink = `along://plan/${id}`;
              const webFallback = `https://alonghangouts.app/p/${id}`;
              const shareDate = new Date(scheduled_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
              const shareTime = new Date(scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const remainingSpots = (capacity || 4) - current_participants;
              const spotsText = remainingSpots > 0 ? `${remainingSpots} spot${remainingSpots > 1 ? 's' : ''} left` : 'Full capacity';

              const shareMessage = `Hey! Join our hangout for "${title}" on Along! 🚀\n\n📍 Venue: ${venue}\n📅 When: ${shareDate} at ${shareTime}\n👥 Attendees: ${current_participants}/${capacity || 4} (${spotsText})\n\nTap to join or view details:\n${webFallback}\n\n(Already on Along? Open directly: ${deepLink})`;

              await Share.share({
                message: shareMessage,
                url: webFallback,
                title: `Join ${title} on Along`
              });
            } catch (error: any) {
              Alert.alert('Error sharing', error.message);
            }
          }}>
            <Share2 size={18} color={theme.colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Host Card */}
        <View style={styles.hostCard}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: theme.spacing.sm }} onPress={() => host?.id && router.push({ pathname: '/user/[id]', params: { id: host.id } })}>
            {host?.avatar_url ? (
              <Image
                source={{ uri: host.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
              />
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
          </Pressable>
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

        {/* Concluded Status & Two-way Rating Section */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <View style={styles.completedHeaderRow}>
              <View style={styles.concludedTag}>
                <CheckCircle2 size={14} color="#10B981" />
                <Text style={styles.concludedText}>Hangout Concluded</Text>
              </View>
            </View>

            {/* Attendee Rating Prompt */}
            {!isHost && isJoined && (
              myRating ? (
                <View style={styles.ratingSummaryBox}>
                  <Text style={styles.ratingSummaryLabel}>Your rating for {host?.full_name || 'the host'}:</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={22}
                        color={star <= myRating ? theme.colors.primary : theme.colors.border}
                        fill={star <= myRating ? theme.colors.primary : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.ratePromptCard}>
                  <View style={styles.ratePromptInfo}>
                    <Text style={styles.ratePromptTitle}>Rate {host?.full_name || 'the Host'}</Text>
                    <Text style={styles.ratePromptSub}>How was your hangout? Rate the host to help keep Along safe & trusted.</Text>
                  </View>
                  <Pressable style={styles.rateHostBtn} onPress={() => setAttendeeRatingVisible(true)}>
                    <Star size={16} color="#fff" fill="#fff" />
                    <Text style={styles.rateHostBtnText}>Rate Host</Text>
                  </Pressable>
                </View>
              )
            )}

            {/* Venue Rating Card for Completed Hangout */}
            {(isHost || isJoined) && (
              myVenueRating ? (
                <View style={[styles.ratingSummaryBox, { marginTop: 10 }]}>
                  <Text style={styles.ratingSummaryLabel}>You rated {venue}:</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={22}
                        color={star <= myVenueRating ? '#FFD32A' : theme.colors.border}
                        fill={star <= myVenueRating ? '#FFD32A' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[styles.ratePromptCard, { marginTop: 10 }]}>
                  <View style={styles.ratePromptInfo}>
                    <Text style={styles.ratePromptTitle}>Rate the Venue</Text>
                    <Text style={styles.ratePromptSub}>How was {venue} for this group hangout? Help update the Along Community Rating.</Text>
                  </View>
                  <Pressable style={[styles.rateHostBtn, { backgroundColor: '#FF5C00' }]} onPress={() => setVenueRatingVisible(true)}>
                    <Star size={16} color="#fff" fill="#fff" />
                    <Text style={styles.rateHostBtnText}>Rate Venue</Text>
                  </Pressable>
                </View>
              )
            )}
          </View>
        )}

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

          {/* Secret Location */}
          {secret_location_details && (isHost || isJoined) && (
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <Shield size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoTitle}>Secret Location Details</Text>
                <Text style={styles.infoSub}>{secret_location_details}</Text>
              </View>
            </View>
          )}

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
        <Pressable 
          style={styles.mapCard}
          onPress={() => {
            if (!plan?.latitude || !plan?.longitude) return;
            const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
            const latLng = `${plan.latitude},${plan.longitude}`;
            const label = plan.venue;
            const url = Platform.select({
              ios: `http://maps.apple.com/?q=${label}&ll=${latLng}`,
              android: `${scheme}${latLng}(${label})`
            });
            if (url) Linking.openURL(url);
          }}
        >
          <View style={styles.mapPlaceholder}>
            <View style={{ backgroundColor: theme.colors.primary, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
              <MapPin size={24} color="#fff" />
            </View>
            <Text style={styles.mapText}>Open in Maps</Text>
            <Text style={styles.mapSub}>{venue}</Text>
          </View>
        </Pressable>

        {/* Join Requests (Host Only) */}
        {isHost && pendingRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Join Requests ({pendingRequests.length})</Text>
            <View style={styles.requestList}>
              {pendingRequests.map((p, idx) => (
                <View key={idx} style={styles.requestCard}>
                  <Pressable style={styles.requestHeader} onPress={() => router.push({ pathname: '/user/[id]', params: { id: p.id } })}>
                    {p.avatar_url ? (
                      <Image
                        source={{ uri: p.avatar_url }}
                        style={styles.attendeeAvatar}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.attendeeAvatar, { backgroundColor: theme.colors.muted }]} />
                    )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.requestName}>{p.full_name || 'Member'}</Text>
                    {p.is_verified && <CheckCircle2 size={13} color="#1D9BF0" />}
                  </View>
                </Pressable>
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
          <Text style={styles.capacityTag}>{current_participants} / {capacity || 0} joined</Text>
        </View>

        <View style={styles.attendeeList}>
          {(participants_list || []).filter(p => p.join_status === 'approved' || !p.join_status).map((p, idx) => (
            <View key={idx} style={styles.attendeeRow}>
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }} onPress={() => p.id && router.push({ pathname: '/user/[id]', params: { id: p.id } })}>
                {p.avatar_url ? (
                  <Image
                    source={{ uri: p.avatar_url }}
                    style={styles.attendeeAvatar}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.attendeeAvatar, { backgroundColor: theme.colors.muted }]} />
                )}
                <Text style={styles.attendeeName}>{p.full_name || 'Member'}{p.id === user?.id ? ' (You)' : ''}</Text>
                {p.is_verified && <CheckCircle2 size={13} color="#1D9BF0" />}
                {p.id === host?.id && <Text style={styles.hostBadge}>HOST</Text>}
              </Pressable>
                
                {/* Host can remove non-host participants */}
                {isHost && p.id !== user?.id && (
                  <Pressable 
                    style={{ padding: 6, backgroundColor: theme.colors.background, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border }}
                    onPress={() => {
                      Alert.alert('Remove User', `Are you sure you want to remove ${p.full_name || 'this member'}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => handleReject(p.id) }
                      ]);
                    }}
                  >
                    <X size={14} color={theme.colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Join CTA Bar */}
      {!isHost && !isCompleted && !hasStarted && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Users size={16} color={theme.colors.mutedForeground} />
            <Text style={styles.bottomCapacityText}>{Math.max(0, (capacity || 0) - current_participants)} spots left</Text>
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

      {/* In-Progress Pill (During the initial 1-hour grace window) */}
      {isInProgress && (
        <View style={styles.bottomBar}>
          <View style={styles.inProgressPill}>
            <Clock size={16} color={theme.colors.primary} />
            <Text style={styles.inProgressText}>
              Hangout in progress • Wrap-up unlocks 1 hr after start
            </Text>
          </View>
        </View>
      )}

      {/* Wrap-up CTA (After 1-hour grace window) */}
      {canMarkCompleted && (
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.markCompleteBtn,
              approvedCount === 0 && styles.concludeBtn
            ]}
            onPress={handleMarkCompleted}
          >
            <CheckCircle2 size={20} color={approvedCount === 0 ? theme.colors.foreground : '#fff'} />
            <Text style={[styles.joinBtnText, approvedCount === 0 && styles.concludeBtnText]}>
              {approvedCount > 0 ? 'Mark Event Completed & Rate' : 'Conclude Hangout (0 Joins)'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Sticky Bottom Bar for Rating Host */}
      {!isHost && isCompleted && isJoined && !myRating && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.rateHostStickyBtn} onPress={() => setAttendeeRatingVisible(true)}>
            <Star size={18} color="#fff" fill="#fff" />
            <Text style={styles.joinBtnText}>Rate {host?.full_name || 'the Host'}</Text>
          </Pressable>
        </View>
      )}

      {/* Intro Message Modal */}
      <Modal 
        visible={isJoinModalVisible} 
        transparent 
        animationType="slide"
        onRequestClose={() => {
          if (!isSubmittingJoin) setJoinModalVisible(false);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => {
              if (!isSubmittingJoin) setJoinModalVisible(false);
            }} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request to Join</Text>
              <Pressable 
                onPress={() => {
                  if (!isSubmittingJoin) setJoinModalVisible(false);
                }} 
                style={styles.modalClose}
                disabled={isSubmittingJoin}
              >
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
              editable={!isSubmittingJoin}
            />
            <Pressable 
              style={[
                styles.submitRequestBtn, 
                (!introText.trim() || isSubmittingJoin) && styles.submitRequestBtnDisabled
              ]}
              onPress={submitJoinRequest}
              disabled={!introText.trim() || isSubmittingJoin}
            >
              {isSubmittingJoin ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitRequestBtnText}>Send Request</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Attendance & Ratings Modals */}
      {plan && user && (
        <>
          <AttendanceModal 
            visible={isAttendanceVisible} 
            onClose={() => setAttendanceVisible(false)} 
            planId={plan.id}
            hostId={user.id}
            attendees={(participants_list || []).filter(p => p.join_status === 'approved' && p.id !== user.id)}
            onComplete={onAttendanceCompleted}
          />
          
          {/* Host Rating Attendees */}
          <RatingsModal 
            visible={isRatingsVisible}
            onClose={() => {
              setRatingsVisible(false);
              if (!myVenueRating) {
                setTimeout(() => setVenueRatingVisible(true), 400);
              } else {
                safeBack('/(tabs)');
              }
            }}
            planId={plan.id}
            raterId={user.id}
            hostId={user.id}
            ratees={ratees}
            onSuccess={() => {
              if (!myVenueRating) {
                setTimeout(() => setVenueRatingVisible(true), 400);
              }
            }}
          />

          {/* Attendee Rating Host */}
          {host && (
            <RatingsModal
              visible={isAttendeeRatingVisible}
              onClose={() => setAttendeeRatingVisible(false)}
              planId={plan.id}
              raterId={user.id}
              hostId={user.id}
              ratees={[host as PlanParticipant]}
              title={`Rate ${host.full_name || 'the Host'}`}
              subtitle={`How was your hangout experience with ${host.full_name || 'the host'}?`}
              onSuccess={() => {
                fetchMyRating();
                if (!myVenueRating) {
                  setTimeout(() => setVenueRatingVisible(true), 400);
                }
              }}
            />
          )}

          {/* Venue Rating Modal for Both Host & Attendees */}
          <VenueRatingModal
            visible={isVenueRatingVisible}
            onClose={() => setVenueRatingVisible(false)}
            planId={plan.id}
            venueName={plan.venue}
            userId={user.id}
            onSuccess={fetchMyVenueRating}
          />
        </>
      )}

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
  mainSection: { gap: 12, marginBottom: 8 },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: 28, color: theme.colors.foreground, letterSpacing: -0.5 },
  description: { fontFamily: theme.typography.fontFamily.regular, fontSize: 15, color: theme.colors.mutedForeground, lineHeight: 24 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tagPill: { backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoGrid: { gap: 12 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: theme.colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  infoIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' },
  infoTextGroup: { flex: 1 },
  infoTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.colors.foreground },
  infoSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.colors.mutedForeground, marginTop: 4 },
  mapCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.card, height: 160,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', gap: 4 },
  mapText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 15, color: theme.colors.foreground },
  mapSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.colors.mutedForeground, textAlign: 'center', paddingHorizontal: 20 },
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
  markCompleteBtn: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  concludeBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  concludeBtnText: { color: theme.colors.foreground },
  inProgressPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 65, 0.2)',
  },
  inProgressText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 20, color: theme.colors.foreground },
  modalClose: { padding: 4 },
  modalSubtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, marginBottom: 16 },
  modalInput: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, fontFamily: theme.typography.fontFamily.regular, fontSize: 15, color: theme.colors.foreground, height: 100, textAlignVertical: 'top', marginBottom: 16 },
  submitRequestBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitRequestBtnDisabled: { backgroundColor: theme.colors.muted },
  submitRequestBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: '#fff' },
  
  completedBanner: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  completedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  concludedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.pill,
  },
  concludedText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xs,
    color: '#059669',
  },
  ratingSummaryBox: {
    gap: 6,
    paddingTop: 4,
  },
  ratingSummaryLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratePromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: 12,
  },
  ratePromptInfo: {
    flex: 1,
    gap: 2,
  },
  ratePromptTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
  ratePromptSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
    lineHeight: 16,
  },
  rateHostBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.pill,
  },
  rateHostBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xs,
    color: '#fff',
  },
  rateHostStickyBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
