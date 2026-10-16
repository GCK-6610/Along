import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, FlatList, Alert

} from 'react-native';
import { Zap, MapPin, Users, Calendar, X, Search, Map as MapIcon, ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { parsePlanWithAI } from '../../lib/aiParser';
import { supabase } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { safeBack } from '../../utils/navigation';

export default function EditPlanScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  
  const [nlpInput, setNlpInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [aiSuccessBadge, setAiSuccessBadge] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [genderReach, setGenderReach] = useState<'all' | 'same'>('all');
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const [mapCoordinate, setMapCoordinate] = useState({ latitude: 28.5921, longitude: 77.2250 });
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const mapRef = useRef<MapView>(null);

  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: location.coords.latitude, lon: location.coords.longitude });
      setMapCoordinate({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('plans').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          setTitle(data.title);
          setVenue(data.venue);
          setTags(data.tags || []);
          setCapacity(String(data.capacity));
          setGenderReach(data.gender_reach);
          setScheduledAt(new Date(data.scheduled_at));
          setNlpInput(data.description || '');
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  const searchLocation = async () => {
    if (!locationQuery.trim()) return;
    setIsSearchingLocation(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.log('No Google Places API Key found. Returning mock data.');
        setLocationResults([
          { place_id: '1', structured_formatting: { main_text: locationQuery, secondary_text: 'Bandra West, Mumbai, Maharashtra' } },
          { place_id: '2', structured_formatting: { main_text: locationQuery + ' Cafe', secondary_text: 'Koramangala, Bengaluru, Karnataka' } },
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

  const handleNLPParse = async () => {
    const promptToParse = nlpInput.trim() || 'Morning run at Lodhi Gardens tomorrow 6am for 4 people';
    setParsing(true);
    setAiSuccessBadge(false);
    
    const result = await parsePlanWithAI(promptToParse);
    
    setTitle(result.title);
    setVenue(result.venue);
    setTags(result.tags);
    setCapacity(result.capacity);
    if (result.embedding) setEmbedding(result.embedding);
    setParsing(false);
    setAiSuccessBadge(true);
  };

  const handleUpdatePlan = async () => {
    if (!title || !venue || tags.length === 0) {
      Alert.alert('Missing Fields', 'Please fill in title, venue, and at least one tag.');
      return;
    }
    if (!user) return;

    setIsPosting(true);
    try {
      const { error } = await supabase.from('plans').update({
        title,
        tags,
        description: nlpInput || 'A great new plan created by me.',
        venue,
        scheduled_at: scheduledAt.toISOString(),
        capacity: parseInt(capacity),
        gender_reach: genderReach,
        latitude: mapCoordinate.latitude,
        longitude: mapCoordinate.longitude,
      }).eq('id', id);

      if (error) throw error;

      safeBack({ pathname: '/plan/[id]', params: { id } });
    } catch (err: any) {
      console.error('Error updating plan:', err);
      Alert.alert('Error', err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePlan = () => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('plans').delete().eq('id', id);
              if (error) throw error;
              router.replace('/(tabs)');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.headerRow}>
            <Pressable onPress={() => safeBack({ pathname: '/plan/[id]', params: { id } })} style={styles.backBtn}>
              <ArrowLeft size={24} color={theme.colors.foreground} />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Edit Plan</Text>
              <Text style={styles.subtitle}>Update the details of your plan</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Plan Title</Text>
              <TextInput style={styles.input} placeholder="e.g. Morning Run" placeholderTextColor={theme.colors.mutedForeground} value={title} onChangeText={setTitle} />
            </View>

            {/* Venue */}
            <View style={styles.field}>
              <Text style={styles.label}>Venue</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={[styles.inputRow, { flex: 1 }]} onPress={() => setLocationModalVisible(true)}>
                  <MapPin size={16} color={theme.colors.mutedForeground} />
                  <Text style={[styles.input, styles.inputFlex, !venue && { color: theme.colors.mutedForeground }]}>
                    {venue || 'Search location or Secret Spot'}
                  </Text>
                </Pressable>
                <Pressable style={{ backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, width: 48, alignItems: 'center', justifyContent: 'center' }} onPress={() => setMapModalVisible(true)}>
                  <MapIcon size={20} color={theme.colors.primary} />
                </Pressable>
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.field}>
              <Text style={styles.label}>Date & Time</Text>
              <Pressable style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                <Calendar size={16} color={theme.colors.mutedForeground} />
                <Text style={[styles.input, styles.inputFlex]}>
                  {scheduledAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
              </Pressable>
              
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={scheduledAt}
                  mode="datetime"
                  display="default"
                  onChange={(event, date) => { setShowDatePicker(false); if(date) setScheduledAt(date); }}
                />
              )}
            </View>

            {/* Tags */}
            <View style={styles.field}>
              <Text style={styles.label}>Tags (Max 5) *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="e.g. coffee (press return to add)"
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
              </View>
              {tags.length > 0 && (
                <View style={styles.chipGrid}>
                  {tags.map(t => (
                    <Pressable
                      key={t}
                      style={[styles.chip, styles.chipActive]}
                      onPress={() => setTags(tags.filter(tag => tag !== t))}
                    >
                      <Text style={[styles.chipText, styles.chipTextActive]}>#{t} ✕</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Capacity */}
            <View style={styles.field}>
              <Text style={styles.label}>Max Participants</Text>
              <View style={styles.counterCard}>
                <View style={styles.counterRow}>
                  <Users size={16} color={theme.colors.mutedForeground} />
                  <Text style={styles.counterHint}>Participants</Text>
                </View>
                <View style={styles.counterControls}>
                  <Pressable style={styles.counterBtn} onPress={() => setCapacity(c => String(Math.max(2, Number(c) - 1)))}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{capacity}</Text>
                  <Pressable style={styles.counterBtn} onPress={() => setCapacity(c => String(Math.min(20, Number(c) + 1)))}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Gender Reach */}
            <View style={styles.field}>
              <Text style={styles.label}>Open to</Text>
              <View style={styles.toggleRow}>
                <Pressable style={[styles.toggle, genderReach === 'all' && styles.toggleActive]} onPress={() => setGenderReach('all')}>
                  <Text style={[styles.toggleText, genderReach === 'all' && styles.toggleTextActive]}>👥 Everyone</Text>
                </Pressable>
                <Pressable style={[styles.toggle, genderReach === 'same' && styles.toggleActive]} onPress={() => setGenderReach('same')}>
                  <Text style={[styles.toggleText, genderReach === 'same' && styles.toggleTextActive]}>🔒 Women Only</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* NLP Input (Secondary) */}
          <View style={styles.nlpCard}>
            <View style={styles.nlpHeader}>
              <Zap size={16} color={theme.colors.primary} />
              <Text style={styles.nlpLabel}>Or use AI Auto-fill</Text>
              {aiSuccessBadge && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>✨ Auto-filled by AI</Text>
                </View>
              )}
            </View>
            <TextInput
              style={styles.nlpInput}
              placeholder='e.g. "Morning run at Lodhi Gardens tomorrow 6am for 4 people"'
              placeholderTextColor={theme.colors.mutedForeground}
              value={nlpInput}
              onChangeText={setNlpInput}
              multiline
            />
            <Pressable
              style={styles.nlpBtn}
              onPress={handleNLPParse}
              disabled={parsing}
            >
              {parsing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.nlpBtnText}>✨ Auto-fill form</Text>
              }
            </Pressable>
          </View>

          <View style={styles.bottomBar}>
            <Pressable style={[styles.postBtn, (!title || !venue || tags.length === 0 || isPosting) && styles.btnDisabled]} onPress={handleUpdatePlan} disabled={!title || !venue || tags.length === 0 || isPosting}>
              {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Save Changes</Text>}
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={handleDeletePlan}>
              <Text style={styles.deleteBtnText}>Delete Plan</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Search Modal */}
      <Modal visible={isLocationModalVisible} animationType="slide" onRequestClose={() => setLocationModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
            <Pressable style={styles.iconBtn} onPress={() => setLocationModalVisible(false)}>
              <X size={20} color={theme.colors.foreground} />
            </Pressable>
            <Text style={styles.modalTitle}>Search Location</Text>
            <View style={{ width: 36 }} />
          </View>
          
          <View style={styles.modalSearchArea}>
            <View style={styles.modalSearchBox}>
              <Search size={18} color={theme.colors.mutedForeground} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search for a venue or address..."
                placeholderTextColor={theme.colors.mutedForeground}
                value={locationQuery}
                onChangeText={setLocationQuery}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
                autoFocus
              />
              {isSearchingLocation && <ActivityIndicator size="small" color={theme.colors.primary} />}
            </View>
            <Pressable style={styles.modalCustomBtn} onPress={() => {
              if(locationQuery.trim()) {
                setVenue(locationQuery.trim());
                setLocationModalVisible(false);
              }
            }}>
              <Text style={styles.modalCustomText}>Use as Custom Secret Spot</Text>
            </Pressable>
          </View>

          <FlatList
            data={locationResults}
            keyExtractor={(item, index) => item.place_id ? item.place_id.toString() : index.toString()}
            contentContainerStyle={{ padding: theme.spacing.md }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.border }} />}
            renderItem={({ item }) => (
              <Pressable style={styles.locationResult} onPress={() => {
                setVenue(item.structured_formatting?.main_text || item.display_name?.split(',')[0] || locationQuery);
                setLocationModalVisible(false);
              }}>
                <MapPin size={18} color={theme.colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locName}>{item.structured_formatting?.main_text || item.display_name?.split(',')[0] || 'Location'}</Text>
                  <Text style={styles.locAddress} numberOfLines={2}>{item.structured_formatting?.secondary_text || item.display_name || 'Address Details'}</Text>
                </View>
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>

      {/* Map Picker Modal */}
      <Modal visible={isMapModalVisible} animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 50 : 20, backgroundColor: theme.colors.background, zIndex: 1 }]}>
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
          <View style={{ paddingHorizontal: theme.spacing.md, backgroundColor: 'transparent', position: 'absolute', top: 90, left: 0, right: 0, zIndex: 999 }}>
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
                key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                language: 'en',
              }}
              styles={{
                textInput: {
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  color: theme.colors.foreground,
                  height: 48,
                  fontFamily: theme.typography.fontFamily.medium,
                },
                listView: {
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.borderRadius.md,
                  marginTop: 8,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                },
                row: {
                  backgroundColor: theme.colors.card,
                  padding: 12,
                },
                description: {
                  color: theme.colors.foreground,
                  fontFamily: theme.typography.fontFamily.medium,
                },
                poweredContainer: {
                  backgroundColor: theme.colors.card,
                  borderBottomLeftRadius: theme.borderRadius.md,
                  borderBottomRightRadius: theme.borderRadius.md,
                }
              }}
              textInputProps={{
                placeholderTextColor: theme.colors.mutedForeground,
                returnKeyType: "search",
              }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
          <View style={{ flex: 1, zIndex: 1 }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: userLocation?.lat || 28.5921,
                longitude: userLocation?.lon || 77.2250,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onRegionChangeComplete={(region) => {setMapCoordinate({ latitude: region.latitude, longitude: region.longitude })}}
              userInterfaceStyle="dark"
            />
            {/* Center fixed pin */}
            <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -32, pointerEvents: 'none' }}>
              <MapPin size={32} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </Modal>

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
                onChange={(event, date) => { if(date) setScheduledAt(date) }}
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
  scroll: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 80 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  headerTextContainer: { alignItems: 'center' },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxxl, color: theme.colors.foreground, letterSpacing: -0.4 },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: -6 },
  nlpCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.sm, gap: 6, borderWidth: 1, borderColor: theme.colors.border },
  nlpHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nlpLabel: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.primary },
  aiBadge: { marginLeft: 'auto', backgroundColor: theme.colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.pill },
  aiBadgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary },
  nlpInput: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, minHeight: 50, textAlignVertical: 'top' },
  nlpBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 10, alignItems: 'center' },
  nlpBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: '#fff' },
  form: { gap: theme.spacing.sm },
  field: { gap: 4 },
  label: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.foreground },
  input: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: 12, fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border, width: '100%', maxWidth: '100%', minWidth: 0, flexShrink: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, paddingLeft: 12, borderWidth: 1, borderColor: theme.colors.border, width: '100%', maxWidth: '100%' },
  inputFlex: { flex: 1, minWidth: 0, flexShrink: 1, borderWidth: 0 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flexShrink: 1 },
  chip: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  chipTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
  counterCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border, flexShrink: 1, maxWidth: '100%' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  counterHint: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.foreground, lineHeight: 22 },
  counterValue: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground, minWidth: 28, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', gap: theme.spacing.sm },
  toggle: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border },
  toggleActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  toggleText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  toggleTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
  bottomBar: { paddingTop: 20, paddingBottom: 40, gap: 12 },
  postBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6
  },
  postBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  deleteBtn: {
    backgroundColor: 'transparent', paddingVertical: 16, borderRadius: theme.borderRadius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ef4444'
  },
  deleteBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#ef4444' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  modalSearchArea: { padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: theme.spacing.sm },
  modalSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  modalSearchInput: { flex: 1, fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, height: 24 },
  modalCustomBtn: { backgroundColor: theme.colors.secondary, paddingVertical: 8, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
  modalCustomText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.primary },
  locationResult: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: 16 },
  locName: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  locAddress: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: 2 },
});
