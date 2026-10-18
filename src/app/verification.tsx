import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { ArrowLeft, CheckCircle2, Shield, Camera, Upload, Sparkles, RefreshCw, FileText, Check, UserCheck } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { safeBack } from '../utils/navigation';
import { pickIdDocument, captureSelfie, verifyIdAndLiveness, VerificationResult, IdAsset } from '../lib/idVerification';
import { getUserFriendlyErrorMessage } from '../utils/errorHandling';

export default function VerificationScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [idDocAsset, setIdDocAsset] = useState<IdAsset | null>(null);
  const [selfieAsset, setSelfieAsset] = useState<IdAsset | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStepText, setVerificationStepText] = useState('Verifying credentials...');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showReverify, setShowReverify] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, is_verified, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
        setLoadingProfile(false);
      });
  }, [user]);

  const handlePickId = async (useCamera: boolean) => {
    try {
      const asset = await pickIdDocument(useCamera);
      if (asset) setIdDocAsset(asset);
    } catch (err: any) {
      Alert.alert('Permission Needed', getUserFriendlyErrorMessage(err, 'Please grant permission to select your ID.'));
    }
  };

  const handleCaptureSelfie = async () => {
    try {
      const asset = await captureSelfie(true);
      if (asset) setSelfieAsset(asset);
    } catch (err: any) {
      Alert.alert('Permission Needed', getUserFriendlyErrorMessage(err, 'Please grant camera permission for selfie verification.'));
    }
  };

  const handleRunVerification = async () => {
    if (!idDocAsset || !selfieAsset) {
      Alert.alert('Missing Documents', 'Please provide both your ID document and a quick selfie to verify your identity.');
      return;
    }

    setIsVerifying(true);
    setVerificationStepText('Scanning digital document text...');

    const timer1 = setTimeout(() => {
      setVerificationStepText('Analyzing facial liveness & matching photo...');
    }, 1200);

    try {
      const result = await verifyIdAndLiveness(idDocAsset, selfieAsset, profile?.full_name || user?.user_metadata?.full_name);
      clearTimeout(timer1);

      if (result.success && result.isRealHuman) {
        setVerificationStepText('Confirming verification badge...');
        
        // Persist verified status in Supabase profiles
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', user.id);
          if (error) throw error;
        }

        setVerificationResult(result);
        setProfile((prev: any) => ({ ...prev, is_verified: true }));
        setShowReverify(false);
        setIsVerifying(false);

        Alert.alert(
          '🎉 Verification Complete!',
          `Your identity has been verified as ${result.extractedName || profile?.full_name || 'Member'}. Your profile now displays the blue verified badge across Along.`,
          [{ text: 'Awesome', onPress: () => safeBack('/(tabs)/profile') }]
        );
      } else {
        setIsVerifying(false);
        Alert.alert(
          'Verification Unavailable',
          getUserFriendlyErrorMessage(
            result.errorMessage,
            'Could not verify ID or match selfie right now. Please ensure good lighting and clear document text.'
          )
        );
      }
    } catch (err: any) {
      clearTimeout(timer1);
      setIsVerifying(false);
      Alert.alert(
        'Verification Unavailable',
        getUserFriendlyErrorMessage(
          err,
          'Something went wrong during verification. Please try again in a little while.'
        )
      );
    }
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isAlreadyVerified = profile?.is_verified && !showReverify;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)/profile')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Already Verified Banner */}
        {isAlreadyVerified ? (
          <View style={styles.verifiedCard}>
            <View style={styles.verifiedBadgeWrap}>
              <Shield size={44} color="#10B981" />
              <View style={styles.verifiedCheckWrap}>
                <CheckCircle2 size={24} color="#1D9BF0" fill="#fff" />
              </View>
            </View>

            <Text style={styles.verifiedTitle}>You're ID Verified</Text>
            <Text style={styles.verifiedSub}>
              Your account carries the verified member badge. Hosts and hangouts prioritize verified members for safety.
            </Text>

            <View style={styles.verifiedDetailsBox}>
              <View style={styles.verifiedDetailRow}>
                <UserCheck size={18} color="#10B981" />
                <Text style={styles.verifiedDetailLabel}>Verified Name:</Text>
                <Text style={styles.verifiedDetailVal}>{profile?.full_name || 'Member'}</Text>
              </View>
              <View style={styles.verifiedDetailRow}>
                <FileText size={18} color="#10B981" />
                <Text style={styles.verifiedDetailLabel}>Document Status:</Text>
                <Text style={styles.verifiedDetailVal}>Official Digital ID Verified ✓</Text>
              </View>
              <View style={styles.verifiedDetailRow}>
                <Shield size={18} color="#10B981" />
                <Text style={styles.verifiedDetailLabel}>Trust Tier:</Text>
                <Text style={[styles.verifiedDetailVal, { color: '#1D9BF0' }]}>Level 1 Verified</Text>
              </View>
            </View>

            <Pressable style={styles.reverifyBtn} onPress={() => setShowReverify(true)}>
              <RefreshCw size={15} color={theme.colors.mutedForeground} />
              <Text style={styles.reverifyBtnText}>Re-verify with a new document</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Header / Pitch */}
            <View style={styles.headerSection}>
              <View style={styles.badgeWrap}>
                <Shield size={44} color={theme.colors.primary} />
                <View style={styles.checkWrap}>
                  <CheckCircle2 size={22} color="#1D9BF0" fill="#fff" />
                </View>
              </View>
              <Text style={styles.title}>Get Verified on Along</Text>
              <Text style={styles.subtitle}>
                Scan any government ID (Aadhaar, Driving License, Passport, PAN) and take a quick selfie to earn the blue tick 🛡️
              </Text>
            </View>

            {/* Why Verify Perks */}
            <View style={styles.perksCard}>
              <View style={styles.perkItem}>
                <Check size={16} color="#10B981" />
                <Text style={styles.perkText}>Instant blue tick on your profile & hangout cards</Text>
              </View>
              <View style={styles.perkItem}>
                <Check size={16} color="#10B981" />
                <Text style={styles.perkText}>Priority approval when requesting to join plans</Text>
              </View>
              <View style={styles.perkItem}>
                <Check size={16} color="#10B981" />
                <Text style={styles.perkText}>Builds trust with fellow tag-along organizers</Text>
              </View>
            </View>

            {/* Step 1: ID Document */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Upload ID Proof</Text>
                  <Text style={styles.cardSub}>Aadhaar, Driving License, Passport, or PAN card</Text>
                </View>
              </View>

              {idDocAsset ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: idDocAsset.uri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.previewOverlay}>
                    <View style={styles.previewTag}>
                      <FileText size={14} color="#10B981" />
                      <Text style={styles.previewTagText}>Document Attached</Text>
                    </View>
                    <Pressable style={styles.changeBtn} onPress={() => handlePickId(false)}>
                      <Text style={styles.changeBtnText}>Change</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.pickerButtonGroup}>
                  <Pressable style={styles.pickerBtn} onPress={() => handlePickId(false)}>
                    <Upload size={22} color={theme.colors.primary} />
                    <Text style={styles.pickerBtnText}>Choose from Photos</Text>
                    <Text style={styles.pickerBtnSub}>PDF or photo of digital card</Text>
                  </Pressable>

                  <Pressable style={styles.pickerBtn} onPress={() => handlePickId(true)}>
                    <Camera size={22} color={theme.colors.primary} />
                    <Text style={styles.pickerBtnText}>Take Photo of ID</Text>
                    <Text style={styles.pickerBtnSub}>Snap directly with camera</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Step 2: Live Selfie Check */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Live Selfie Liveness Check</Text>
                  <Text style={styles.cardSub}>Quick front-camera snap to confirm you're a real human</Text>
                </View>
              </View>

              {selfieAsset ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selfieAsset.uri }} style={[styles.previewImage, { height: 160 }]} resizeMode="cover" />
                  <View style={styles.previewOverlay}>
                    <View style={styles.previewTag}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <Text style={styles.previewTagText}>Selfie Ready</Text>
                    </View>
                    <Pressable style={styles.changeBtn} onPress={handleCaptureSelfie}>
                      <Text style={styles.changeBtnText}>Retake</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.selfieActionBtn} onPress={handleCaptureSelfie}>
                  <Camera size={26} color="#fff" />
                  <Text style={styles.selfieActionText}>Take Live Selfie</Text>
                  <Text style={styles.selfieActionSub}>Uses front-facing camera</Text>
                </Pressable>
              )}
            </View>

            {/* Verification Button / Indicator */}
            {isVerifying ? (
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.processingTitle}>Verifying Identity...</Text>
                <Text style={styles.processingSub}>{verificationStepText}</Text>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.submitBtn,
                  (!idDocAsset || !selfieAsset) && styles.submitBtnDisabled,
                ]}
                onPress={handleRunVerification}
                disabled={!idDocAsset || !selfieAsset}
              >
                <Sparkles size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Verify & Get Blue Tick ⚡</Text>
              </Pressable>
            )}

            {showReverify && (
              <Pressable style={styles.cancelReverifyBtn} onPress={() => setShowReverify(false)}>
                <Text style={styles.cancelReverifyText}>Cancel and keep current verification</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnPlaceholder: { width: 36 },
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  scroll: { padding: theme.spacing.lg, gap: theme.spacing.lg },

  headerSection: { alignItems: 'center', gap: 6, marginTop: 4 },
  badgeWrap: { position: 'relative', marginBottom: 4 },
  checkWrap: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 12 },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxl, color: theme.colors.foreground, textAlign: 'center' },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },

  perksCard: {
    backgroundColor: 'rgba(29, 155, 240, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(29, 155, 240, 0.2)',
    gap: 8,
  },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.foreground, flex: 1 },

  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 13, color: '#fff' },
  cardTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  cardSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: 1 },

  pickerButtonGroup: { flexDirection: 'row', gap: theme.spacing.sm },
  pickerBtn: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  pickerBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.foreground, textAlign: 'center' },
  pickerBtnSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: 10, color: theme.colors.mutedForeground, textAlign: 'center' },

  previewContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  previewImage: { width: '100%', height: 140, backgroundColor: theme.colors.muted },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewTagText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: '#fff' },
  changeBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  changeBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: '#fff' },

  selfieActionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  selfieActionText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' },
  selfieActionSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  processingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 8,
  },
  processingTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  processingSub: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.primary },

  submitBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' },

  // Already Verified View
  verifiedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  verifiedBadgeWrap: { position: 'relative', marginBottom: 4 },
  verifiedCheckWrap: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 12 },
  verifiedTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxl, color: theme.colors.foreground },
  verifiedSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  verifiedDetailsBox: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
    marginVertical: 4,
  },
  verifiedDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedDetailLabel: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, width: 110 },
  verifiedDetailVal: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.foreground, flex: 1 },
  reverifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginTop: 4 },
  reverifyBtnText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  cancelReverifyBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelReverifyText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
});

