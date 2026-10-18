import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, 
  ActivityIndicator, Alert, ScrollView, FlatList

} from 'react-native';
import { router, Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { Image, Modal } from 'react-native';
import { Edit2, X, MapPin, Shield, CheckCircle2, Camera, Upload, Sparkles, RefreshCw, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pickIdDocument, captureSelfie, verifyIdAndLiveness, VerificationResult, IdAsset } from '../lib/idVerification';
import Fuse from 'fuse.js';
import { AVATAR_CATALOG, AvatarOption } from '../lib/avatarCatalog';
import { calculateAge, is18Plus, formatDobToIso } from '../utils/age';

const ALL_AVATARS = AVATAR_CATALOG.flatMap(c => c.items);
const fuse = new Fuse(ALL_AVATARS, {
  keys: ['tags'],
  threshold: 0.3,
  ignoreLocation: true
});

const GENDERS = [
  { value: 'male', label: '👨 Male' },
  { value: 'female', label: '👩 Female' },
  { value: 'other', label: '🧑 Other' },
];

export default function OnboardingScreen() {
  const { user, session, loading: authLoading, hasProfile, setHasProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [dob, setDob] = useState<Date | null>(null);
  const [dobInputText, setDobInputText] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // ID Verification state
  const [isVerified, setIsVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerificationModalVisible, setVerificationModalVisible] = useState(false);
  const [idDocAsset, setIdDocAsset] = useState<IdAsset | null>(null);
  const [selfieAsset, setSelfieAsset] = useState<IdAsset | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [avatar, setAvatar] = useState(ALL_AVATARS[0]?.url || '');
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const [baseLocationName, setBaseLocationName] = useState('');
  const [baseLatitude, setBaseLatitude] = useState<number | null>(null);
  const [baseLongitude, setBaseLongitude] = useState<number | null>(null);
  
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Guard: if unauthenticated, cannot onboard
  if (!authLoading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Guard: if already completed profile, go to main feed
  if (!authLoading && session && hasProfile) {
    return <Redirect href="/(tabs)" />;
  }

  const searchLocation = async () => {
    if (!locationQuery.trim()) return;
    setIsSearchingLocation(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setLocationResults([]);
        return;
      }

      const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(locationQuery)}&key=${apiKey}&components=country:in`);
      const data = await res.json();
      if (data.predictions) {
        setLocationResults(data.predictions);
      }
    } catch (e) {
      console.log('Location search error', e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectLocation = async (placeId: string, description: string) => {
    setBaseLocationName(description);
    setLocationModalVisible(false);
    setLocationQuery('');
    
    // Fallback if no real API key
    if (placeId === '1') { setBaseLatitude(19.0596); setBaseLongitude(72.8295); return; }
    if (placeId === '2') { setBaseLatitude(17.4614); setBaseLongitude(78.3639); return; }

    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${apiKey}`);
      const data = await res.json();
      if (data.result?.geometry?.location) {
        setBaseLatitude(data.result.geometry.location.lat);
        setBaseLongitude(data.result.geometry.location.lng);
      }
    } catch (e) {
      console.log('Details fetch error', e);
    }
  };
  
  const displayedAvatars = searchQuery.trim() 
    ? fuse.search(searchQuery).map(result => result.item)
    : activeTab === 'All' 
      ? ALL_AVATARS 
      : AVATAR_CATALOG.find(c => c.category === activeTab)?.items || [];

  const handleSelectIdDoc = async () => {
    try {
      const asset = await pickIdDocument(false);
      if (asset) setIdDocAsset(asset);
    } catch (e: any) {
      Alert.alert('Permission Required', e.message);
    }
  };

  const handleCaptureSelfie = async () => {
    try {
      const asset = await captureSelfie(true);
      if (asset) setSelfieAsset(asset);
    } catch (e: any) {
      Alert.alert('Permission Required', e.message);
    }
  };

  const handleRunVerification = async () => {
    if (!idDocAsset || !selfieAsset) {
      Alert.alert('Incomplete Verification', 'Please upload your ID document and take a quick selfie to verify.');
      return;
    }

    setIsVerifying(true);
    const result = await verifyIdAndLiveness(idDocAsset, selfieAsset, fullName);
    setIsVerifying(false);

    if (result.success && result.isRealHuman) {
      setIsVerified(true);
      setVerificationResult(result);
      if (result.extractedName) {
        setFullName(result.extractedName);
      }
      if (result.extractedGender) {
        setGender(result.extractedGender);
      }
      if (result.extractedDob) {
        const parsed = new Date(result.extractedDob);
        if (!isNaN(parsed.getTime())) {
          setDob(parsed);
          setDobInputText(result.extractedDob);
        }
      }
      setVerificationModalVisible(false);
      Alert.alert(
        '🎉 Identity Verified!',
        `Welcome, ${result.extractedName}! Your profile details have been auto-filled from your ${result.documentType} and verified with a live selfie check.`
      );
    } else {
      Alert.alert('Verification Issue', result.errorMessage || 'Please ensure document text and selfie are clearly visible.');
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }
    if (!gender) {
      Alert.alert('Missing Gender', 'Please select your gender.');
      return;
    }

    let selectedDob = dob;
    if (!selectedDob && dobInputText.trim()) {
      const parts = dobInputText.trim().split(/[-/.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          selectedDob = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          selectedDob = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    }

    if (!selectedDob || isNaN(selectedDob.getTime())) {
      Alert.alert('Missing Date of Birth', 'Please select your date of birth.');
      return;
    }

    const calculatedAge = calculateAge(selectedDob);
    if (calculatedAge < 18) {
      Alert.alert(
        'Age Requirement',
        'Along is an 18+ community network. You must be at least 18 years old to join Along.'
      );
      return;
    }

    if (!baseLocationName) {
      Alert.alert('Missing Location', 'Please select where you are based.');
      return;
    }

    if (!user) return;

    const formattedDob = formatDobToIso(selectedDob);

    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName.trim(),
      gender,
      dob: formattedDob,
      avatar_url: avatar,
      base_location_name: baseLocationName,
      base_latitude: baseLatitude,
      base_longitude: baseLongitude,
      is_verified: isVerified,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setHasProfile(true);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.wave}>👋</Text>
            <Text style={styles.title}>Let's set up your profile</Text>
            <Text style={styles.subtitle}>This is how others will see you on Along</Text>
          </View>

          {/* Avatar Preview */}
          <View style={styles.avatarSection}>
            <Pressable onPress={() => setModalVisible(true)} style={styles.avatarEditWrap}>
              <Image source={{ uri: avatar }} style={styles.mainAvatar} />
              <View style={styles.editIconBadge}>
                <Edit2 size={16} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.avatarLabel}>Choose an avatar</Text>
          </View>

          <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Avatar</Text>
                  <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <X size={20} color={theme.colors.foreground} />
                  </Pressable>
                </View>
                <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search all avatars (e.g. happy, glasses)"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                {!searchQuery.trim() && (
                  <View style={{ paddingBottom: 10 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                      <Pressable onPress={() => setActiveTab('All')} style={[styles.tabBtn, activeTab === 'All' && styles.tabBtnActive]}>
                        <Text style={[styles.tabBtnText, activeTab === 'All' && styles.tabBtnTextActive]}>All</Text>
                      </Pressable>
                      {AVATAR_CATALOG.map((cat, idx) => (
                        <Pressable key={idx} onPress={() => setActiveTab(cat.category)} style={[styles.tabBtn, activeTab === cat.category && styles.tabBtnActive]}>
                          <Text style={[styles.tabBtnText, activeTab === cat.category && styles.tabBtnTextActive]}>{cat.category}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <FlatList
                  data={displayedAvatars}
                  keyExtractor={(item) => item.id}
                  numColumns={4}
                  contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
                  columnWrapperStyle={{ justifyContent: 'space-around', marginBottom: 16 }}
                  initialNumToRender={16}
                  maxToRenderPerBatch={16}
                  windowSize={5}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable onPress={() => { setAvatar(item.url); setModalVisible(false); }}>
                      <Image
                        source={{ uri: item.url }}
                        style={[styles.avatarOption, avatar === item.url && styles.avatarSelected]}
                      />
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.mutedForeground, width: '100%' }}>
                      No avatars found for "{searchQuery}"
                    </Text>
                  }
                />
              </View>
            </View>
          </Modal>

          {/* Fast-Track ID Verification Banner (Optional) */}
          <View style={[styles.idVerificationCard, isVerified && styles.idVerificationCardVerified]}>
            <View style={styles.idCardHeader}>
              <View style={[styles.idShieldIcon, isVerified && { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                {isVerified ? (
                  <CheckCircle2 size={22} color="#10B981" />
                ) : (
                  <Shield size={22} color="#1D9BF0" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.idCardTitle}>
                    {isVerified ? 'ID Verified Member' : 'Fast-Track with ID Scan'}
                  </Text>
                  {isVerified && <CheckCircle2 size={16} color="#1D9BF0" />}
                </View>
                <Text style={styles.idCardSubtitle}>
                  {isVerified
                    ? `Auto-filled & verified via ${verificationResult?.documentType || 'Official ID'}`
                    : 'Scan ID to auto-fill details & get a verified blue tick 🛡️'}
                </Text>
              </View>
              <View style={[styles.optionalPill, isVerified && styles.verifiedPill]}>
                <Text style={[styles.optionalPillText, isVerified && styles.verifiedPillText]}>
                  {isVerified ? 'VERIFIED ✓' : 'OPTIONAL'}
                </Text>
              </View>
            </View>

            {isVerified ? (
              <Pressable
                style={styles.reVerifyBtn}
                onPress={() => setVerificationModalVisible(true)}
              >
                <RefreshCw size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.reVerifyBtnText}>Change or Re-scan ID</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.scanIdBtn}
                onPress={() => setVerificationModalVisible(true)}
              >
                <Sparkles size={16} color="#fff" />
                <Text style={styles.scanIdBtnText}>Scan ID & Auto-Fill Details ⚡</Text>
              </Pressable>
            )}
          </View>

          {/* Name Input */}
          <View style={styles.field}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Your Name</Text>
              {isVerified && (
                <Text style={{ fontSize: 11, color: '#10B981', fontFamily: theme.typography.fontFamily.bold }}>
                  ✓ Auto-filled from ID
                </Text>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={theme.colors.mutedForeground}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Gender Selector */}
          <View style={styles.field}>
            <Text style={styles.label}>I identify as</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <Pressable
                  key={g.value}
                  style={[styles.genderPill, gender === g.value && styles.genderPillActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.genderHint}>
              🔒 Gender is locked after setup to protect community safety and verify same-gender hangouts.
            </Text>
          </View>

          {/* Date of Birth */}
          <View style={styles.field}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Date of Birth</Text>
              {dob && (
                <View style={styles.dobBadge}>
                  <Text style={styles.dobBadgeText}>{calculateAge(dob)} yrs</Text>
                </View>
              )}
            </View>
            <Pressable style={styles.inputRow} onPress={() => setShowDobPicker(true)}>
              <Calendar size={18} color={theme.colors.primary} />
              <Text style={[styles.inputFlex, !dob && !dobInputText && { color: theme.colors.mutedForeground }]}>
                {dob
                  ? dob.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
                  : dobInputText || 'Select your Date of Birth (DD / MM / YYYY)'}
              </Text>
            </Pressable>
            <Text style={styles.genderHint}>
              🔒 Used for 18+ verification and community safety.
            </Text>
          </View>

          {/* Base Location Selector */}
          <View style={styles.field}>
            <Text style={styles.label}>Where are you based?</Text>
            <Pressable style={styles.inputRow} onPress={() => setLocationModalVisible(true)}>
              <MapPin size={18} color={theme.colors.mutedForeground} />
              <Text style={[styles.inputFlex, !baseLocationName && { color: theme.colors.mutedForeground }]}>
                {baseLocationName || 'e.g. Kondapur, Hyderabad'}
              </Text>
            </Pressable>
          </View>

          {/* CTA */}
          <Pressable
            style={[styles.button, (!fullName.trim() || !gender || (!dob && !dobInputText.trim()) || !baseLocationName) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !fullName.trim() || !gender || (!dob && !dobInputText.trim()) || !baseLocationName}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Let's Go 🚀</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Modal */}
      <Modal visible={isLocationModalVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingHorizontal: 20 }]}>
            <Text style={styles.modalTitle}>Search Location</Text>
            <Pressable onPress={() => setLocationModalVisible(false)} style={styles.closeBtn}>
              <X size={20} color={theme.colors.foreground} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={[styles.inputRow, { marginBottom: 16 }]}>
              <MapPin size={18} color={theme.colors.mutedForeground} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Search neighborhood or city..."
                placeholderTextColor={theme.colors.mutedForeground}
                value={locationQuery}
                onChangeText={(text) => {
                  setLocationQuery(text);
                  searchLocation();
                }}
                autoFocus
              />
            </View>

            {isSearchingLocation ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {locationResults.map((item, idx) => (
                  <Pressable key={idx} style={styles.locationResult} onPress={() => handleSelectLocation(item.place_id, item.structured_formatting.main_text + ', ' + item.structured_formatting.secondary_text)}>
                    <Text style={styles.locationMainText}>{item.structured_formatting.main_text}</Text>
                    <Text style={styles.locationSubText}>{item.structured_formatting.secondary_text}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && (
        <Modal visible={showDobPicker} transparent animationType="fade" onRequestClose={() => setShowDobPicker(false)}>
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerModalHeader}>
                <Text style={styles.datePickerModalTitle}>Select Date of Birth</Text>
                <Pressable onPress={() => setShowDobPicker(false)}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dob || new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                onChange={(event, date) => {
                  if (date) {
                    setDob(date);
                    setDobInputText(date.toISOString().split('T')[0]);
                  }
                }}
                themeVariant="dark"
                textColor={theme.colors.foreground}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === 'android' && showDobPicker && (
        <DateTimePicker
          value={dob || new Date(2000, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          minimumDate={new Date(1920, 0, 1)}
          onChange={(event, date) => {
            setShowDobPicker(false);
            if (date) {
              setDob(date);
              setDobInputText(date.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      {/* Date Picker fallback for Web */}
      {Platform.OS === 'web' && showDobPicker && (
        <Modal visible={showDobPicker} transparent animationType="fade" onRequestClose={() => setShowDobPicker(false)}>
          <View style={styles.datePickerModalOverlay}>
            <View style={[styles.datePickerModalContent, { padding: 20 }]}>
              <View style={styles.datePickerModalHeader}>
                <Text style={styles.datePickerModalTitle}>Enter Date of Birth (YYYY-MM-DD)</Text>
                <Pressable onPress={() => setShowDobPicker(false)}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              </View>
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.mutedForeground}
                value={dobInputText}
                onChangeText={(text) => {
                  setDobInputText(text);
                  const parsed = new Date(text);
                  if (!isNaN(parsed.getTime())) {
                    setDob(parsed);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ID Verification & Auto-Fill Modal */}
      <Modal
        visible={isVerificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVerificationModalVisible(false)}
      >
        <View style={styles.verifyModalOverlay}>
          <View style={styles.verifyModalContent}>
            <View style={styles.modalHeaderDrag} />
            <Pressable
              style={styles.verifyModalCloseBtn}
              onPress={() => setVerificationModalVisible(false)}
            >
              <X size={20} color={theme.colors.foreground} />
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Shield size={28} color="#1D9BF0" />
              <View>
                <Text style={styles.verifyModalTitle}>ID Verification</Text>
                <Text style={styles.verifyModalSubtitle}>Auto-fills profile & awards verified checkmark</Text>
              </View>
            </View>

            {/* Step 1: Upload ID */}
            <View style={styles.verifyStepBox}>
              <View style={styles.verifyStepHeader}>
                <Text style={styles.verifyStepNum}>1</Text>
                <Text style={styles.verifyStepTitle}>Digital ID / ID Proof</Text>
              </View>
              <Text style={styles.verifyStepDesc}>
                Aadhaar, Driving License, PAN Card, Student ID, or Passport
              </Text>

              {idDocAsset ? (
                <View style={styles.docPreviewRow}>
                  <Image source={{ uri: idDocAsset.uri }} style={styles.docThumbnail} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docSelectedText} numberOfLines={1}>
                      ✓ Document selected
                    </Text>
                    <Pressable onPress={handleSelectIdDoc}>
                      <Text style={styles.docReSelectText}>Change document</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.uploadDocBtn} onPress={handleSelectIdDoc}>
                  <Upload size={16} color={theme.colors.primary} />
                  <Text style={styles.uploadDocBtnText}>Select or Upload ID Document</Text>
                </Pressable>
              )}
            </View>

            {/* Step 2: Live Selfie Check */}
            <View style={styles.verifyStepBox}>
              <View style={styles.verifyStepHeader}>
                <Text style={styles.verifyStepNum}>2</Text>
                <Text style={styles.verifyStepTitle}>Real-Human Selfie Check</Text>
              </View>
              <Text style={styles.verifyStepDesc}>
                Front-camera selfie to verify a real human & match with ID
              </Text>

              {selfieAsset ? (
                <View style={styles.docPreviewRow}>
                  <Image source={{ uri: selfieAsset.uri }} style={styles.selfieThumbnail} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docSelectedText}>✓ Live selfie captured</Text>
                    <Pressable onPress={handleCaptureSelfie}>
                      <Text style={styles.docReSelectText}>Retake selfie</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.uploadDocBtn} onPress={handleCaptureSelfie}>
                  <Camera size={16} color={theme.colors.primary} />
                  <Text style={styles.uploadDocBtnText}>Take Live Selfie</Text>
                </Pressable>
              )}
            </View>

            {/* Verification Action */}
            <Pressable
              style={[
                styles.runVerifyBtn,
                (!idDocAsset || !selfieAsset || isVerifying) && styles.runVerifyBtnDisabled
              ]}
              onPress={handleRunVerification}
              disabled={!idDocAsset || !selfieAsset || isVerifying}
            >
              {isVerifying ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.runVerifyBtnText}>Scanning ID & Matching Face...</Text>
                </View>
              ) : (
                <Text style={styles.runVerifyBtnText}>Verify & Auto-Fill Profile ⚡</Text>
              )}
            </Pressable>

            <Pressable
              style={{ alignItems: 'center', marginTop: 14 }}
              onPress={() => setVerificationModalVisible(false)}
            >
              <Text style={{ fontSize: 13, color: theme.colors.mutedForeground }}>
                Skip for now (I will fill manually)
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  wave: {
    fontSize: 36,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatarEditWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.card,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  avatarLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.foreground,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  tabBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabBtnText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground },
  tabBtnTextActive: { color: '#fff', fontFamily: theme.typography.fontFamily.bold },
  field: {
    gap: 6,
    width: '100%',
    maxWidth: '100%',
  },
  label: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
  input: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  genderRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
    maxWidth: '100%',
  },
  genderPill: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  genderPillActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
  },
  genderTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  genderHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 6,
    lineHeight: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.muted,
  },
  buttonText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.card,
  },
  inputFlex: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  locationResult: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationMainText: { fontFamily: theme.typography.fontFamily.medium, fontSize: 15, color: theme.colors.foreground },
  locationSubText: { fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.colors.mutedForeground },

  // ID Verification Styles
  idVerificationCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  idVerificationCardVerified: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  idShieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(29, 155, 240, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCardTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  idCardSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 1,
  },
  optionalPill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.pill,
  },
  optionalPillText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 9,
    color: theme.colors.mutedForeground,
    letterSpacing: 0.5,
  },
  verifiedPill: {
    backgroundColor: '#DCFCE7',
  },
  verifiedPillText: {
    color: '#15803D',
  },
  scanIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1D9BF0',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  scanIdBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
    color: '#FFF',
  },
  reVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  reVerifyBtnText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    textDecorationLine: 'underline',
  },

  // Verification Modal Styles
  verifyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  verifyModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    paddingBottom: 36,
  },
  modalHeaderDrag: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  verifyModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 10,
  },
  verifyModalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.foreground,
  },
  verifyModalSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  verifyStepBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 12,
  },
  verifyStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  verifyStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    color: '#fff',
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifyStepTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
    color: theme.colors.foreground,
  },
  verifyStepDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.mutedForeground,
    marginBottom: 10,
  },
  uploadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
  },
  uploadDocBtnText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 12,
    color: theme.colors.foreground,
  },
  docPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.background,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  docThumbnail: {
    width: 56,
    height: 38,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  selfieThumbnail: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  docSelectedText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    color: '#059669',
  },
  docReSelectText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 2,
  },
  runVerifyBtn: {
    backgroundColor: '#1D9BF0',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#1D9BF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  runVerifyBtnDisabled: {
    backgroundColor: theme.colors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  runVerifyBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    color: '#FFF',
  },
  dobBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dobBadgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 11,
    color: theme.colors.primary,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: theme.colors.card,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  datePickerModalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
    fontSize: 18,
  },
  datePickerDoneText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 16,
  },
});
