import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, Edit2, X } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { updateMockProfile } from '../lib/mockData';
import { supabase } from '../lib/supabase';

import Fuse from 'fuse.js';
import { AVATAR_CATALOG, AvatarOption } from '../lib/avatarCatalog';

const ALL_AVATARS = AVATAR_CATALOG.flatMap(c => c.items);
const fuse = new Fuse(ALL_AVATARS, {
  keys: ['tags'],
  threshold: 0.3,
  ignoreLocation: true
});

export default function EditProfileScreen() {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<string | null>(null);
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

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setFullName(data.full_name || '');
          setBio(data.bio || '');
          setGender(data.gender || null);
          setAvatar(data.avatar_url || ALL_AVATARS[0]?.url || '');
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
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        bio: bio,
        gender: gender,
        avatar_url: avatar
      });
      if (error) throw error;
      router.back();
    } catch (err: any) {
      Alert.alert('Error saving profile', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
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
                <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
                  {displayedAvatars.map((item) => (
                    <Pressable key={item.id} onPress={() => { setAvatar(item.url); setModalVisible(false); }}>
                      <Image source={{ uri: item.url, headers: { 'Accept': 'image/png' } }} style={[styles.avatarOption, avatar === item.url && styles.avatarSelected]} />
                    </Pressable>
                  ))}
                  {displayedAvatars.length === 0 && (
                    <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.mutedForeground, width: '100%' }}>No avatars found for "{searchQuery}"</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={theme.colors.mutedForeground}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell people about yourself..."
              placeholderTextColor={theme.colors.mutedForeground}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]} onPress={() => setGender('male')}>
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>👨 Male</Text>
              </Pressable>
              <Pressable style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]} onPress={() => setGender('female')}>
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>👩 Female</Text>
              </Pressable>
              <Pressable style={[styles.genderBtn, gender === 'other' && styles.genderBtnActive]} onPress={() => setGender('other')}>
                <Text style={[styles.genderText, gender === 'other' && styles.genderTextActive]}>🧑 Other</Text>
              </Pressable>
            </View>
          </View>
          
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Pressable>
          </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  avatarSelected: { borderColor: theme.colors.primary },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  tabBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabBtnText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground },
  tabBtnTextActive: { color: '#fff', fontFamily: theme.typography.fontFamily.bold },
  genderBtn: {
    flex: 1, backgroundColor: theme.colors.card, paddingVertical: 12, borderRadius: theme.borderRadius.md,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  genderText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground },
  genderTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
  field: { gap: 8 },
  label: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: theme.spacing.lg,
  },
  saveBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' }
});
