import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, 
  ActivityIndicator, Alert, ScrollView

} from 'react-native';
import { router, Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { Image, Modal } from 'react-native';
import { Edit2, X, MapPin } from 'lucide-react-native';
import Fuse from 'fuse.js';
import { AVATAR_CATALOG, AvatarOption } from '../lib/avatarCatalog';

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
  const [loading, setLoading] = useState(false);

  // Guard: if unauthenticated, cannot onboard
  if (!authLoading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Guard: if already completed profile, go to main feed
  if (!authLoading && session && hasProfile) {
    return <Redirect href="/(tabs)" />;
  }
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
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setLocationResults([
          { place_id: '1', structured_formatting: { main_text: locationQuery, secondary_text: 'Bandra West, Mumbai' }, geometry: { location: { lat: 19.0596, lng: 72.8295 } } },
          { place_id: '2', structured_formatting: { main_text: 'Kondapur', secondary_text: 'Hyderabad' }, geometry: { location: { lat: 17.4614, lng: 78.3639 } } },
        ]);
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

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }
    if (!gender) {
      Alert.alert('Missing Gender', 'Please select your gender.');
      return;
    }
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName.trim(),
      gender,
      avatar_url: avatar,
      base_location_name: baseLocationName,
      base_latitude: baseLatitude,
      base_longitude: baseLongitude,
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
                <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
                  {displayedAvatars.map((item) => (
                    <Pressable key={item.id} onPress={() => { setAvatar(item.url); setModalVisible(false); }}>
                      <Image source={{ uri: item.url }} style={[styles.avatarOption, avatar === item.url && styles.avatarSelected]} />
                    </Pressable>
                  ))}
                  {displayedAvatars.length === 0 && (
                    <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.mutedForeground, width: '100%' }}>No avatars found for "{searchQuery}"</Text>
                  )}
                </ScrollView>
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
            style={[styles.button, (!fullName.trim() || !gender || !baseLocationName) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !fullName.trim() || !gender || !baseLocationName}
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
});
