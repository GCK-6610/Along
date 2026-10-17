import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { X } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { router } from 'expo-router';

interface VenueModalProps {
  modalHotspot: any;
  setModalHotspot: (hotspot: any) => void;
}

export default function VenueModal({ modalHotspot, setModalHotspot }: VenueModalProps) {
  if (!modalHotspot) return null;

  return (
    <Modal
      visible={!!modalHotspot}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalHotspot(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailsModalContent}>
          <View style={styles.modalHeaderDrag} />
          <Pressable style={styles.closeBtn} onPress={() => setModalHotspot(null)}>
            <X size={20} color={theme.colors.foreground} />
          </Pressable>

          {modalHotspot.image_url && (
            <View style={styles.coverImageContainer}>
              <Image source={{ uri: modalHotspot.image_url }} style={styles.coverImage} />
            </View>
          )}
          
          <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 12, color: theme.colors.primary, marginBottom: 4, marginTop: modalHotspot.image_url ? 12 : 0 }}>
            {modalHotspot.isSearched ? 'SEARCHED VENUE' : (modalHotspot.perk_text ? 'PARTNER VENUE 🎁' : 'COMMUNITY HOTSPOT 📍')}
          </Text>
          <Text style={styles.detailsTitle}>{modalHotspot.name}</Text>
          
          <View style={styles.detailsMetaRow}>
            {(modalHotspot.google_rating || modalHotspot.rating) && (
              <Text style={styles.detailsRating}>★ {modalHotspot.google_rating || modalHotspot.rating} (Google)</Text>
            )}
            {modalHotspot.along_rating && (
              <Text style={[styles.detailsRating, { color: theme.colors.primary }]}>★ {modalHotspot.along_rating} (Along)</Text>
            )}
            {modalHotspot.distance_km != null && (
              <Text style={styles.detailsDist}>{modalHotspot.distance_km?.toFixed(1)} km away</Text>
            )}
          </View>

          {modalHotspot.perk_text ? (
            <View style={{ backgroundColor: '#FFD32A20', borderWidth: 1, borderColor: '#FFD32A', padding: 10, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold, color: '#D97706', fontSize: 13 }}>
                🎁 Partner Perk: {modalHotspot.perk_text}
              </Text>
            </View>
          ) : (modalHotspot.tags?.includes('outdoors') || modalHotspot.name?.toLowerCase().includes('park')) ? (
            <View style={{ backgroundColor: '#10B98120', borderWidth: 1, borderColor: '#10B981', padding: 8, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: '#059669', fontSize: 13 }}>
                🌿 Public Park & Outdoor Community Spot
              </Text>
            </View>
          ) : null}

          {modalHotspot.address && (
            <Text style={styles.detailsDesc}>{modalHotspot.address}</Text>
          )}

          {modalHotspot.description ? (
            <Text style={styles.detailsDesc}>{modalHotspot.description}</Text>
          ) : (
            !modalHotspot.isSearched && <Text style={styles.detailsDesc}>A curated hotspot perfect for your next gathering.</Text>
          )}

          <View style={styles.tagsContainer}>
            {modalHotspot.tags?.map((tag: string, index: number) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Pressable 
            style={[styles.btn, { marginTop: 24 }]} 
            onPress={() => {
              setModalHotspot(null);
              router.push({ pathname: '/create', params: { venue: modalHotspot.name, lat: modalHotspot.latitude, lng: modalHotspot.longitude } });
            }}
          >
            <Text style={styles.btnText}>Host a Plan Here</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  detailsModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12,
  },
  modalHeaderDrag: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 16 },
  coverImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 4, backgroundColor: theme.colors.card, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  detailsTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 24, color: theme.colors.foreground, letterSpacing: -0.5, marginBottom: 8 },
  detailsMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailsRating: { fontFamily: theme.typography.fontFamily.bold, fontSize: 13, color: '#FFB800' },
  detailsDist: { fontFamily: theme.typography.fontFamily.medium, fontSize: 13, color: theme.colors.mutedForeground },
  detailsDesc: { fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, lineHeight: 22, marginBottom: 16 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: theme.colors.secondary, borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.primary },
  tagText: { fontFamily: theme.typography.fontFamily.medium, fontSize: 11, color: theme.colors.primary },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.pill, alignItems: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' },
});
