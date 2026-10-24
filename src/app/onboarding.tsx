import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, 
  ActivityIndicator, Alert, ScrollView, FlatList, Image, Modal
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { Edit2, X, MapPin, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Fuse from 'fuse.js';
import { AVATAR_CATALOG } from '../lib/avatarCatalog';
import { calculateAge, is18Plus, formatDobToIso, getTimeUntil18 } from '../utils/age';
import { getUserFriendlyErrorMessage } from '../utils/errorHandling';
import { searchPlaces, fetchPlaceDetails } from '../lib/places';

const getMaxAdultDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
};

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
  const { user, setHasProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [dob, setDob] = useState<Date | null>(null);
  const [dobInputText, setDobInputText] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [loading, setLoading] = useState(false);

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
    
    // Fallback if no real API key
    if (placeId === '1') { setBaseLatitude(19.0596); setBaseLongitude(72.8295); return; }
    if (placeId === '2') { setBaseLatitude(17.4614); setBaseLongitude(78.3639); return; }

    const details = await fetchPlaceDetails(placeId);
    if (details) {
      setBaseLatitude(details.latitude);
      setBaseLongitude(details.longitude);
    }
  };
  
  const displayedAvatars = searchQuery.trim() 
    ? fuse.search(searchQuery).map(result => result.item)
    : activeTab === 'All' 
      ? ALL_AVATARS 
      : AVATAR_CATALOG.find(c => c.category === activeTab)?.items || [];

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

    if (!is18Plus(selectedDob)) {
      Alert.alert(
        '18+ Requirement',
        'Along is exclusively for individuals 18 years of age and older. You must be at least 18 to create an account.'
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
      is_verified: false,
    });
    setLoading(false);

    if (error) {
      Alert.alert(
        'Unable to Save Profile',
        getUserFriendlyErrorMessage(
          error,
          'Something went wrong while saving your profile. Please check your connection and try again.'
        )
      );
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
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

          {/* Name Input */}
          <View style={styles.field}>
            <Text style={styles.label}>Your Name</Text>
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
                <View style={[styles.dobBadge, !is18Plus(dob) && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.dobBadgeText, !is18Plus(dob) && { color: '#EF4444' }]}>
                    {is18Plus(dob) ? `${calculateAge(dob)} yrs` : `Under 18`}
                  </Text>
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
              🔒 Along is strictly 18+. Used for adult age verification and safety.
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
              <Text style={styles.buttonText}>Start Exploring Along →</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Picker Modal */}
      <Modal visible={isLocationModalVisible} animationType="slide" transparent={true} onRequestClose={() => setLocationModalVisible(false)}>
        <View style={styles.locationModalOverlay}>
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Select Your Location</Text>
              <Pressable onPress={() => setLocationModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.locationSearchWrap}>
              <MapPin size={18} color={theme.colors.primary} />
              <TextInput
                style={styles.locationInput}
                placeholder="Search area, neighborhood, city..."
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
                value={dob || getMaxAdultDate()}
                mode="date"
                display="spinner"
                maximumDate={getMaxAdultDate()}
                minimumDate={new Date(1920, 0, 1)}
                onChange={(event, date) => {
                  if (date) {
                    if (!is18Plus(date)) {
                      Alert.alert('18+ Requirement', 'Along is exclusively for adults 18 and older. Please choose a valid birth date.');
                      return;
                    }
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
          value={dob || getMaxAdultDate()}
          mode="date"
          display="default"
          maximumDate={getMaxAdultDate()}
          minimumDate={new Date(1920, 0, 1)}
          onChange={(event, date) => {
            setShowDobPicker(false);
            if (date) {
              if (!is18Plus(date)) {
                Alert.alert('18+ Requirement', 'Along is exclusively for adults 18 and older. Please choose a valid birth date.');
                return;
              }
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
                    if (is18Plus(parsed)) {
                      setDob(parsed);
                    }
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}

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
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  avatarLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
    color: theme.colors.primary,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputFlex: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderPill: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
  },
  genderTextActive: {
    color: '#fff',
  },
  genderHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.mutedForeground,
    lineHeight: 15,
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
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    fontSize: 18,
    color: theme.colors.foreground,
  },
  closeBtn: {
    padding: 4,
  },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 10,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: theme.colors.primary,
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  locationModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationModalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.foreground,
  },
  locationSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
  locationResult: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationMainText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  locationSubText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 2,
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
