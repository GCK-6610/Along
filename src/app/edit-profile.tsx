import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, Edit2, X } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { updateMockProfile } from '../lib/mockData';
import { supabase } from '../lib/supabase';

const AVATARS = [
  // Micah
  'https://api.dicebear.com/7.x/micah/png?seed=Rahul&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/micah/png?seed=Alex&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/micah/png?seed=Sam&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/micah/png?seed=Jordan&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/micah/png?seed=Casey&backgroundColor=F4F4F5',
  
  // Notionists
  'https://api.dicebear.com/7.x/notionists/png?seed=Felix&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/notionists/png?seed=Aneka&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/notionists/png?seed=Jack&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/notionists/png?seed=Lily&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/notionists/png?seed=Chloe&backgroundColor=F4F4F5',

  // Adventurer
  'https://api.dicebear.com/7.x/adventurer/png?seed=Bandit&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Sasha&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Max&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Bella&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Milo&backgroundColor=F4F4F5',
  
  // Lorelei
  'https://api.dicebear.com/7.x/lorelei/png?seed=Harley&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/lorelei/png?seed=Oliver&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/lorelei/png?seed=Luna&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/lorelei/png?seed=Stella&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/lorelei/png?seed=Leo&backgroundColor=F4F4F5',

  // Personas
  'https://api.dicebear.com/7.x/personas/png?seed=Cleo&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/personas/png?seed=Jasper&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/personas/png?seed=Abby&backgroundColor=F4F4F5',
  'https://api.dicebear.com/7.x/personas/png?seed=Toby&backgroundColor=F4F4F5',
];

export default function EditProfileScreen() {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user?.user_metadata?.avatar_url || AVATARS[0]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setFullName(data.full_name || user.user_metadata?.full_name || '');
          setBio(data.bio || '');
          setAvatar(data.avatar_url || user.user_metadata?.avatar_url || AVATARS[0]);
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
              <Image source={{ uri: avatar }} style={styles.mainAvatar} />
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
                <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
                  {AVATARS.map((url, idx) => (
                    <Pressable key={idx} onPress={() => { setAvatar(url); setModalVisible(false); }}>
                      <Image source={{ uri: url }} style={[styles.avatarOption, avatar === url && styles.avatarSelected]} />
                    </Pressable>
                  ))}
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
