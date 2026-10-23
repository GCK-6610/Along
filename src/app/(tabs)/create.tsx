import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert
} from 'react-native';
import { Zap, MapPin, Users, Calendar, X, Map as MapIcon, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { parsePlanWithAI } from '../../lib/aiParser';
import { supabase } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';
import { getGoogleMapsApiKey } from '../../lib/places';
import { FEATURE_FLAGS } from '../../config/features';

export default function CreateScreen() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  
  const [nlpInput, setNlpInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [aiSuccessBadge, setAiSuccessBadge] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [secretLocationDetails, setSecretLocationDetails] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [genderReach, setGenderReach] = useState<'all' | 'same'>('all');
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const fallbackLat = profile?.base_latitude || 17.4375;
  const fallbackLon = profile?.base_longitude || 78.3845;
  const [mapCoordinate, setMapCoordinate] = useState({ latitude: fallbackLat, longitude: fallbackLon });
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isAiModalVisible, setAiModalVisible] = useState(false);

  const fetchLiveLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      if (location?.coords) {
        setUserLocation({ lat: location.coords.latitude, lon: location.coords.longitude });
        setMapCoordinate({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      }
    } catch (e) {
      console.warn('Could not acquire live device coordinates:', e);
    }
  };

  useEffect(() => {
    fetchLiveLocation();
  }, []);

  const resetForm = () => {
    setTitle('');
    setVenue('');
    setSecretLocationDetails('');
    setCapacity('4');
    setEmbedding(null);
    setNlpInput('');
    setAiSuccessBadge(false);
    setTags([]);
    setMapCoordinate(
      userLocation
        ? { latitude: userLocation.lat, longitude: userLocation.lon }
        : { latitude: fallbackLat, longitude: fallbackLon }
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchLiveLocation();
      if (params.venue) setVenue(params.venue as string);
      if (params.tags) setTags((params.tags as string).split(','));
    }, [params.venue, params.tags])
  );

  const handleNLPParse = async () => {
    if (!FEATURE_FLAGS.ENABLE_AI_AUTOFILL) return;
    if (!nlpInput.trim()) {
      Alert.alert('Empty Description', 'Please type a quick plan description first (e.g. "Morning coffee at Blue Tokai tomorrow 9am for 4 people").');
      return;
    }
    const promptToParse = nlpInput.trim();
    setParsing(true);
    setAiSuccessBadge(false);
    
    const result = await parsePlanWithAI(promptToParse);
    
    if (result.title) setTitle(result.title);
    if (result.venue) setVenue(result.venue);
    if (result.tags && result.tags.length > 0) setTags(result.tags);
    if (result.capacity) setCapacity(result.capacity);
    if (result.scheduledAt) setScheduledAt(result.scheduledAt);
    if (result.latitude && result.longitude) {
      setMapCoordinate({ latitude: result.latitude, longitude: result.longitude });
    }
    if (result.embedding) setEmbedding(result.embedding);
    setParsing(false);
    setAiSuccessBadge(true);
    setAiModalVisible(false);
  };

  const closeAiModal = () => {
    if (!aiSuccessBadge) {
      setNlpInput('');
    }
    setAiModalVisible(false);
  };

  const handlePostPlan = async () => {
    if (!title.trim() || !venue.trim() || !user) {
      Alert.alert('Missing Details', 'Please provide a title and location for your plan.');
      return;
    }
    setIsPosting(true);
    
    try {
      let finalTags = [...tags];
      if (tagInput.trim()) {
        const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (clean && !finalTags.includes(clean)) finalTags.push(clean);
      }
      if (finalTags.length === 0) {
        finalTags = ['hangout'];
      }

      const { data: newPlan, error } = await supabase.from('plans').insert({
        host_id: user.id,
        title: title.trim(),
        tags: finalTags,
        description: (aiSuccessBadge && nlpInput.trim()) ? nlpInput.trim() : `Group hangout at ${venue.trim()}`,
        venue: venue.trim(),
        distance_km: 1.0,
        scheduled_at: scheduledAt.toISOString(),
        capacity: parseInt(capacity) || 4,
        gender_reach: genderReach,
        embedding: embedding,
        latitude: mapCoordinate.latitude,
        longitude: mapCoordinate.longitude,
        secret_location_details: secretLocationDetails.trim() || null,
        status: 'active'
      }).select('id').single();

      if (error) throw error;

      await supabase.from('plan_participants').insert({
        plan_id: newPlan.id,
        user_id: user.id,
        join_status: 'approved'
      });
      
      queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
      queryClient.invalidateQueries({ queryKey: ['my_plans'] });
      
      resetForm();
      
      router.push({ pathname: '/plan/[id]', params: { id: newPlan.id } });
    } catch (err) {
      console.error('Error creating plan:', err);
      Alert.alert(
        'Unable to Create Hangout',
        getUserFriendlyErrorMessage(
          err,
          'Something went wrong while creating your plan. Please check your connection and try again.'
        )
      );
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Create Plan</Text>
              <Text style={styles.subtitle}>What are we doing today?</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FEATURE_FLAGS.ENABLE_AI_AUTOFILL && (
                <Pressable onPress={() => setAiModalVisible(true)} style={styles.aiHeaderBtn}>
                  <Zap size={14} color={theme.colors.primary} />
                  <Text style={styles.aiHeaderBtnText}>Auto-fill</Text>
                </Pressable>
              )}
              <Pressable onPress={resetForm} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            </View>
          </View>

          {aiSuccessBadge && (
            <View style={styles.successBadge}>
              <Zap size={14} color={theme.colors.primary} />
              <Text style={styles.successBadgeText}>Magically auto-filled by AI</Text>
            </View>
          )}

          {/* Main Card */}
          <View style={styles.card}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Plan Title</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Morning Coffee Run" 
                placeholderTextColor={theme.colors.mutedForeground} 
                value={title} 
                onChangeText={setTitle} 
              />
            </View>

            {/* Venue (Map Picker) */}
            <View style={styles.field}>
              <Text style={styles.label}>Where are we meeting?</Text>
              <Pressable style={styles.venuePickerBtn} onPress={() => setMapModalVisible(true)}>
                <View style={styles.venuePickerIcon}>
                  <MapIcon size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.venuePickerText, !venue && { color: theme.colors.mutedForeground }]}>
                    {venue || 'Tap to select location on Map'}
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.colors.mutedForeground} />
              </Pressable>
              
              <TextInput
                style={[styles.input, { marginTop: 12, backgroundColor: theme.colors.background }]}
                placeholder="Secret details (e.g. Gate 4, wearing red cap)"
                placeholderTextColor={theme.colors.mutedForeground}
                value={secretLocationDetails}
                onChangeText={setSecretLocationDetails}
              />
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            {/* Date & Time */}
            <View style={styles.field}>
              <Text style={styles.label}>When?</Text>
              <Pressable style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                <Calendar size={18} color={theme.colors.primary} />
                <Text style={styles.datePickerText}>
                  {scheduledAt.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
              </Pressable>
              
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={scheduledAt}
                  mode="datetime"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setScheduledAt(date);
                  }}
                />
              )}
            </View>

            {/* Tags */}
            <View style={styles.field}>
              <Text style={styles.label}>Tags (Max 5)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. coffee (press return)"
                placeholderTextColor={theme.colors.mutedForeground}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={() => {
                  const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (newTag && !tags.includes(newTag) && tags.length < 5) {
                    setTags([...tags, newTag]);
                  }
                  setTagInput('');
                }}
                returnKeyType="done"
              />
              {tags.length > 0 && (
                <View style={styles.chipGrid}>
                  {tags.map(t => (
                    <Pressable key={t} style={styles.chip} onPress={() => setTags(tags.filter(tag => tag !== t))}>
                      <Text style={styles.chipText}>#{t}</Text>
                      <X size={12} color={theme.colors.primary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Audience Card */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.label}>Max Participants</Text>
                <Text style={styles.hintText}>Including you</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable style={styles.stepperBtn} onPress={() => setCapacity(c => String(Math.max(2, Number(c) - 1)))}>
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{capacity}</Text>
                <Pressable style={styles.stepperBtn} onPress={() => setCapacity(c => String(Math.min(20, Number(c) + 1)))}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.field}>
              <Text style={styles.label}>Open to</Text>
              <View style={styles.segmentedControl}>
                <Pressable style={[styles.segment, genderReach === 'all' && styles.segmentActive]} onPress={() => setGenderReach('all')}>
                  <Text style={[styles.segmentText, genderReach === 'all' && styles.segmentTextActive]}>Everyone</Text>
                </Pressable>
                <Pressable style={[styles.segment, genderReach === 'same' && styles.segmentActive]} onPress={() => setGenderReach('same')}>
                  <Text style={[styles.segmentText, genderReach === 'same' && styles.segmentTextActive]}>Same Gender</Text>
                </Pressable>
              </View>
            </View>
          </View>


        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={styles.stickyBottom}>
          <Pressable 
            style={[styles.postBtn, (!title.trim() || !venue.trim() || isPosting) && styles.postBtnDisabled]} 
            onPress={handlePostPlan} 
            disabled={!title.trim() || !venue.trim() || isPosting}
          >
            {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Post Plan</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Map Picker Modal */}
      <Modal visible={isMapModalVisible} animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 20, backgroundColor: theme.colors.background, zIndex: 1 }]}>
            <Pressable style={styles.iconBtn} onPress={() => setMapModalVisible(false)}>
              <X size={20} color={theme.colors.foreground} />
            </Pressable>
            <Text style={styles.modalTitle}>Pick on Map</Text>
            <Pressable style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }} onPress={async () => {
              if (mapSearchQuery.trim()) {
                setVenue(mapSearchQuery.trim());
              } else {
                try {
                  const reverse = await Location.reverseGeocodeAsync(mapCoordinate);
                  if (reverse && reverse.length > 0) {
                    const place = reverse[0];
                    setVenue([place.name, place.street, place.city].filter(Boolean).join(', '));
                  } else {
                    setVenue(`Pinned: ${mapCoordinate.latitude.toFixed(4)}, ${mapCoordinate.longitude.toFixed(4)}`);
                  }
                } catch (e) {
                  setVenue(`Pinned: ${mapCoordinate.latitude.toFixed(4)}, ${mapCoordinate.longitude.toFixed(4)}`);
                }
              }
              setMapModalVisible(false);
            }}>
              <Text style={{ color: '#fff', fontFamily: theme.typography.fontFamily.bold, fontSize: 14 }}>Select</Text>
            </Pressable>
          </View>
          <View style={{ flex: 1, zIndex: 1 }}>
            <View style={{ position: 'absolute', top: 16, left: 0, right: 0, paddingHorizontal: theme.spacing.md, zIndex: 999 }}>
              <GooglePlacesAutocomplete
                placeholder='Search places...'
                fetchDetails={true}
                onPress={(data, details = null) => {
                  if (details?.geometry?.location) {
                    const lat = details.geometry.location.lat;
                    const lng = details.geometry.location.lng;
                    setMapCoordinate({ latitude: lat, longitude: lng });
                    setVenue(details.name || data.description);
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      }, 1000);
                    }
                  }
                }}
                query={{
                  key: getGoogleMapsApiKey(),
                  language: 'en',
                  ...(userLocation ? { location: `${userLocation.lat},${userLocation.lon}`, radius: '10000' } : {})
                }}
                styles={{
                  container: { flex: 0 },
                  textInput: {
                    backgroundColor: theme.colors.card,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    color: theme.colors.foreground,
                    height: 48,
                    fontFamily: theme.typography.fontFamily.medium,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                  listView: {
                    position: 'absolute',
                    top: 54,
                    left: 0,
                    right: 0,
                    backgroundColor: theme.colors.card,
                    borderRadius: theme.borderRadius.md,
                    elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                },
                row: { backgroundColor: theme.colors.card, padding: 12 },
                description: { color: theme.colors.foreground, fontFamily: theme.typography.fontFamily.medium },
                poweredContainer: { backgroundColor: theme.colors.card, borderBottomLeftRadius: theme.borderRadius.md, borderBottomRightRadius: theme.borderRadius.md }
              }}
              textInputProps={{ placeholderTextColor: theme.colors.mutedForeground, returnKeyType: "search" }}
              keyboardShouldPersistTaps="handled"
            />
            </View>
            <MapView
              ref={mapRef}
              style={{ flex: 1, width: '100%', height: '100%' }}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              showsUserLocation={true}
              initialRegion={{
                latitude: userLocation?.lat || 28.5921,
                longitude: userLocation?.lon || 77.2250,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onRegionChangeComplete={(region) => setMapCoordinate({ latitude: region.latitude, longitude: region.longitude })}
              userInterfaceStyle="dark"
            />
            {/* Center fixed pin */}
            <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -32, pointerEvents: 'none' }}>
              <MapPin size={32} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Auto-fill Modal (Parked for Phase 2) */}
      {FEATURE_FLAGS.ENABLE_AI_AUTOFILL && (
        <Modal visible={isAiModalVisible} transparent animationType="slide" onRequestClose={closeAiModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={closeAiModal} />
          <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.lg, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Zap size={20} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.foreground }}>AI Auto-fill</Text>
              </View>
              <Pressable style={styles.iconBtn} onPress={closeAiModal}>
                <X size={20} color={theme.colors.foreground} />
              </Pressable>
            </View>
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.colors.mutedForeground, marginBottom: 16 }}>
              Describe your plan naturally and we'll fill out the details for you.
            </Text>
            <TextInput
              style={{ backgroundColor: theme.colors.background, padding: 16, borderRadius: theme.borderRadius.md, minHeight: 120, borderColor: theme.colors.border, borderWidth: 1, fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, textAlignVertical: 'top' }}
              placeholder='e.g. "Morning run at Lodhi Gardens tomorrow 6am for 4 people"'
              placeholderTextColor={theme.colors.mutedForeground}
              value={nlpInput}
              onChangeText={setNlpInput}
              multiline
              autoFocus
            />
            <Pressable
              style={{ backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: 16 }}
              onPress={handleNLPParse}
              disabled={parsing}
            >
              {parsing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' }}>✨ Parse & Fill Form</Text>
              }
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.colors.card, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                <Text style={{ fontFamily: theme.typography.fontFamily.bold, color: theme.colors.foreground, fontSize: 18 }}>Select Time</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={scheduledAt}
                mode="datetime"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setScheduledAt(date);
                }}
                themeVariant="dark"
                textColor={theme.colors.foreground}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg, gap: theme.spacing.md },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: 22, color: theme.colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.colors.mutedForeground, marginTop: 2 },
  
  aiHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.secondary, borderRadius: 20 },
  aiHeaderBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.colors.primary },
  
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.card, borderRadius: 20 },
  clearBtnText: { fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: theme.colors.mutedForeground },
  
  successBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.secondary, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  successBadgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: theme.colors.primary },

  card: { backgroundColor: theme.colors.card, borderRadius: 12, padding: 12, gap: 12 },
  field: { gap: 4 },
  label: { fontFamily: theme.typography.fontFamily.bold, fontSize: 13, color: theme.colors.foreground },
  
  input: { backgroundColor: theme.colors.background, borderRadius: 8, padding: 10, fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.foreground },
  
  venuePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 8, padding: 8, paddingRight: 10 },
  venuePickerIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FF5C00', alignItems: 'center', justifyContent: 'center' },
  venuePickerText: { fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.colors.foreground },

  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.secondary, borderRadius: 8, padding: 10, gap: 8 },
  datePickerText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.colors.primary },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.colors.primary },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hintText: { fontFamily: theme.typography.fontFamily.regular, fontSize: 11, color: theme.colors.mutedForeground, marginTop: 2 },
  
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 12, padding: 2 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.colors.foreground, lineHeight: 20 },
  stepperValue: { fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.colors.foreground, minWidth: 32, textAlign: 'center' },

  divider: { height: 1, backgroundColor: theme.colors.background, marginVertical: 2 },

  segmentedControl: { flexDirection: 'row', backgroundColor: theme.colors.background, borderRadius: 8, padding: 2 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: theme.colors.card },
  segmentText: { fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.mutedForeground },
  segmentTextActive: { color: theme.colors.foreground, fontFamily: theme.typography.fontFamily.bold },

  stickyBottom: { padding: 16, paddingTop: 12, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  postBtn: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: '#fff' },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
});
