import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, Edit2, X, MapPin, Lock } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { safeBack } from '../utils/navigation';
import { getUserFriendlyErrorMessage } from '../utils/errorHandling';
import { BrandLoader } from '../components/common/BrandLoader';

import Fuse from 'fuse.js';
import { AVATAR_CATALOG, AvatarOption } from '../lib/avatarCatalog';
import { searchPlaces, fetchPlaceDetails, PlacePrediction } from '../lib/places';

const ALL_AVATARS = AVATAR_CATALOG.flatMap(c => c.items);
const fuse = new Fuse(ALL_AVATARS, {
  keys: ['tags'],
  threshold: 0.3,
  ignoreLocation: true
});

export default function EditProfileScreen() {
  const { user, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [initialFullName, setInitialFullName] = useState('');
  const [initialIsVerified, setInitialIsVerified] = useState(false);
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(ALL_AVATARS[0]?.url || '');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const displayedAvatars = searchQuery.trim() 
    ? fuse.search(searchQuery).map(result => result.item)
    : activeTab === 'All' 
      ? ALL_AVATARS 
      : AVATAR_CATALOG.find(c => c.category === activeTab)?.items || [];
      
  const [baseLocationName, setBaseLocationName] = useState('');
  const [baseLatitude, setBaseLatitude] = useState<number | null>(null);
  const [baseLongitude, setBaseLongitude] = useState<number | null>(null);

  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const searchLocation = async () => {
    if (!locationQuery.trim()) return;
    setIsSearchingLocation(true);
    try {
      const predictions = await searchPlaces(locationQuery);
      setLocationResults(predictions);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectLocation = async (placeId: string, description: string) => {
    setBaseLocationName(description);
    setLocationModalVisible(false);
    setLocationQuery('');
    
    if (placeId === '1') { setBaseLatitude(19.0596); setBaseLongitude(72.8295); return; }
    if (placeId === '2') { setBaseLatitude(17.4614); setBaseLongitude(78.3639); return; }

    const details = await fetchPlaceDetails(placeId);
    if (details) {
      setBaseLatitude(details.latitude);
      setBaseLongitude(details.longitude);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setFullName(data.full_name || '');
          setInitialFullName(data.full_name || '');
          setInitialIsVerified(data.is_verified || false);
          setBio(data.bio || '');
          setGender(data.gender || null);
          setAvatar(data.avatar_url || ALL_AVATARS[0]?.url || '');
          setBaseLocationName(data.base_location_name || '');
          setBaseLatitude(data.base_latitude || null);
          setBaseLongitude(data.base_longitude || null);
          setDob(data.dob || null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const trimmedName = initialIsVerified ? initialFullName : fullName.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Full name must be at least 2 characters.');
      return;
    }

    performSave(false, trimmedName);
  };

  const performSave = async (revokeVerification: boolean, validatedName: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatePayload: Record<string, any> = {
        id: user.id,
        full_name: validatedName,
        bio: bio.trim(),
        avatar_url: avatar,
        base_location_name: baseLocationName,
        base_latitude: baseLatitude,
        base_longitude: baseLongitude
      };

      if (revokeVerification) {
        updatePayload.is_verified = false;
      }

      const { error } = await supabase.from('profiles').upsert(updatePayload);
      if (error) throw error;

      await refreshProfile();

      if (revokeVerification) {
        Alert.alert(
          'Profile Updated',
          'Your profile was saved. Your verification badge has been removed because your name changed. Would you like to re-verify your ID now?',
          [
            { text: 'Later', onPress: () => safeBack('/(tabs)/profile') },
            { text: 'Re-verify Now', onPress: () => router.replace('/verification') }
          ]
        );
      } else {
        safeBack('/(tabs)/profile');
      }
    } catch (err: any) {
      Alert.alert(
        'Unable to Save Profile',
        getUserFriendlyErrorMessage(
          err,
          'Something went wrong while saving your changes. Please try again in a moment.'
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <BrandLoader size="lg" message="Loading profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)/profile')}>
            <ArrowLeft size={20} color={theme.colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable style={styles.iconBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Save size={20} color={theme.colors.primary} />}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Avatar Picker */}
          <View style={styles.avatarSection}>
            <Pressable onPress={() => setModalVisible(true)} style={styles.avatarEditWrap}>
              <Image source={{ uri: avatar, headers: { 'Accept': 'image/png' } }} style={styles.mainAvatar} />
              <View style={styles.editIconBadge}>
                <Edit2 size={16} color="#fff" />
              </View>
            </Pressable>
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
                    style={styles.input}
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

          <View style={styles.field}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Full Name</Text>
              {initialIsVerified && (
                <View style={styles.lockedBadge}>
                  <Lock size={12} color={theme.colors.mutedForeground} />
                  <Text style={styles.lockedBadgeText}>Verified Legal Name</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.input, initialIsVerified && styles.lockedInput]}
              value={initialIsVerified ? initialFullName : fullName}
              onChangeText={initialIsVerified ? undefined : setFullName}
              editable={!initialIsVerified}
              placeholder="Your name"
              placeholderTextColor={theme.colors.mutedForeground}
            />
            {initialIsVerified && (
              <Text style={styles.lockedHelperText}>
                Your legal name is permanently locked because your identity is verified with your official ID.
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.charCounter}>{bio.length}/250</Text>
            </View>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={bio}
              onChangeText={(text) => setBio(text.slice(0, 250))}
              multiline
              maxLength={250}
              placeholder="Tell people about yourself..."
              placeholderTextColor={theme.colors.mutedForeground}
            />
          </View>

          <View style={styles.field}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.lockedBadge}>
                <Lock size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.lockedBadgeText}>Locked for safety</Text>
              </View>
            </View>
            <View style={styles.lockedGenderBox}>
              <Text style={styles.lockedGenderValue}>
                {gender === 'male' ? '👨 Male' : gender === 'female' ? '👩 Female' : gender === 'other' ? '🧑 Other' : 'Not specified'}
              </Text>
            </View>
            <Text style={styles.lockedHelperText}>
              Gender cannot be modified after registration to protect community safety and verify same-gender hangouts.
            </Text>
          </View>

          {dob && (
            <View style={styles.field}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>Date of Birth</Text>
                <View style={styles.lockedBadge}>
                  <Lock size={12} color={theme.colors.mutedForeground} />
                  <Text style={styles.lockedBadgeText}>Verified 18+</Text>
                </View>
              </View>
              <View style={styles.lockedGenderBox}>
                <Text style={styles.lockedGenderValue}>
                  📅 {new Date(dob).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.lockedHelperText}>
                Date of birth is verified to maintain our 18+ adult tag-along community standards.
              </Text>
            </View>
          )}
          
          <View style={styles.field}>
            <Text style={styles.label}>Base Location</Text>
            <Pressable style={styles.inputRow} onPress={() => setLocationModalVisible(true)}>
              <MapPin size={18} color={theme.colors.mutedForeground} />
              <Text style={[styles.inputFlex, !baseLocationName && { color: theme.colors.mutedForeground }]}>
                {baseLocationName || 'e.g. Kondapur, Hyderabad'}
              </Text>
            </Pressable>
          </View>
          
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Pressable>
          </>
          )}
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
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
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  scroll: { padding: theme.spacing.lg, gap: theme.spacing.xl },
  avatarSection: { alignItems: 'center', gap: theme.spacing.md },
  avatarEditWrap: { position: 'relative' },
  mainAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: theme.colors.card },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.background },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl, maxHeight: '80%', padding: theme.spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  modalTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.md, paddingBottom: 40 },
  avatarOption: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'transparent', backgroundColor: theme.colors.card },
  avatarSelected: { borderWidth: 3, borderColor: theme.colors.primary },
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
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  tabBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabBtnText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground },
  tabBtnTextActive: { color: '#fff', fontFamily: theme.typography.fontFamily.bold },
  charCounter: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  lockedBadgeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 11,
    color: theme.colors.mutedForeground,
  },
  lockedGenderBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  lockedGenderValue: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  lockedHelperText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    lineHeight: 16,
  },
  field: { gap: 8 },
  label: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground,
  },
  lockedInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.85,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: theme.spacing.lg,
  },
  saveBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' }
});
