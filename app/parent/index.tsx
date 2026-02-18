import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { signOut } from '@/lib/auth';
import {
  createChoreAndAssign,
  listChildrenForMyFamily,
  listMyCreatedChores,
  type ProfileLite,
} from '@/lib/chores';

const COLORS = {
  bg: '#EEF0F6',
  blue: '#3E63DD',
  yellow: '#FFC700',
  orange: '#FF7A1A',
  green: '#00C853',
  white: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
};

const tileColors = [COLORS.yellow, COLORS.blue, COLORS.orange, COLORS.green];

export default function ParentHome() {
  const [children, setChildren] = useState<ProfileLite[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [points, setPoints] = useState('10');
  const [myChores, setMyChores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function refreshData() {
    try {
      const [kids, chores] = await Promise.all([listChildrenForMyFamily(), listMyCreatedChores()]);
      setChildren(kids);
      if (!selectedChildId && kids[0]?.id) setSelectedChildId(kids[0].id);
      setMyChores(chores);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cargar panel');
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  async function onCreateAndAssign() {
    if (!title.trim()) return Alert.alert('Falta título', 'Escribe el nombre de la tarea');
    if (!selectedChildId) return Alert.alert('Falta niño', 'Selecciona a qué niño asignar');

    try {
      setLoading(true);
      await createChoreAndAssign({
        title: title.trim(),
        frequency,
        points: Number(points) || 10,
        childId: selectedChildId,
      });
      setTitle('');
      setPoints('10');
      setFrequency('daily');
      await refreshData();
      Alert.alert('Listo', 'Tarea creada y asignada ✅');
    } catch (e: any) {
      Alert.alert('Error al crear tarea', e?.message ?? 'Intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cerrar sesión');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTop}>WORKSPACE</Text>
        <Text style={styles.heroTitle}>Panel de Padres</Text>
        <View style={styles.yellowBadge}>
          <Text style={styles.yellowBadgeText}>Diseño colorido + redondeado ✨</Text>
        </View>
      </View>

      <View style={styles.cardWhite}>
        <Text style={styles.sectionTitle}>Crear y asignar tarea</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Tender cama"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <View style={styles.row}>
          <Pressable
            onPress={() => setFrequency('daily')}
            style={[styles.pill, frequency === 'daily' ? styles.pillBlue : styles.pillGray]}
          >
            <Text style={[styles.pillText, frequency === 'daily' ? styles.whiteText : styles.darkText]}>Diaria</Text>
          </Pressable>
          <Pressable
            onPress={() => setFrequency('weekly')}
            style={[styles.pill, frequency === 'weekly' ? styles.pillOrange : styles.pillGray]}
          >
            <Text style={[styles.pillText, frequency === 'weekly' ? styles.whiteText : styles.darkText]}>Semanal</Text>
          </Pressable>
        </View>

        <TextInput
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
          placeholder="Puntos"
          placeholderTextColor="#94a3b8"
          style={[styles.input, { maxWidth: 140 }]}
        />

        <Text style={styles.label}>Asignar a:</Text>
        {children.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay niños todavía. Crea un usuario Niño/Niña primero.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {children.map((kid, idx) => {
              const active = selectedChildId === kid.id;
              const bg = tileColors[idx % tileColors.length];
              return (
                <Pressable
                  key={kid.id}
                  onPress={() => setSelectedChildId(kid.id)}
                  style={[styles.kidTile, { backgroundColor: bg }, active && styles.kidTileActive]}
                >
                  <Text style={styles.kidName}>{kid.display_name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={onCreateAndAssign}
          disabled={loading || children.length === 0}
          style={[styles.mainButton, (loading || children.length === 0) && { opacity: 0.5 }]}
        >
          <Text style={styles.mainButtonText}>{loading ? 'Guardando...' : 'Crear y asignar'}</Text>
        </Pressable>
      </View>

      <View style={styles.cardWhite}>
        <Text style={styles.sectionTitle}>Mis tareas creadas</Text>
        {myChores.length === 0 ? (
          <Text style={styles.emptyText}>Aún no has creado tareas.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {myChores.map((c, i) => (
              <View key={c.id} style={[styles.taskTile, { backgroundColor: tileColors[i % tileColors.length] }]}>
                <Text style={styles.taskTitle}>{c.title}</Text>
                <Text style={styles.taskMeta}>
                  {c.frequency === 'daily' ? 'Diaria' : 'Semanal'} · {c.points} pts
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={refreshData} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Recargar</Text>
        </Pressable>
      </View>

      <Pressable onPress={onLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, gap: 14, paddingBottom: 34 },

  hero: {
    backgroundColor: COLORS.blue,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#1e40af',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  heroTop: { color: '#dbeafe', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { marginTop: 6, color: COLORS.white, fontSize: 30, fontWeight: '900' },
  heroSubtitle: { color: '#e0e7ff', marginTop: 6, fontSize: 14 },
  yellowBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.yellow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  yellowBadgeText: { color: '#111827', fontWeight: '900', fontSize: 13 },

  cardWhite: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 14,
    gap: 10,
  },

  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  label: { fontWeight: '800', color: COLORS.text },

  input: {
    borderWidth: 1,
    borderColor: '#dbe1ee',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },

  row: { flexDirection: 'row', gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  pillBlue: { backgroundColor: COLORS.blue },
  pillOrange: { backgroundColor: COLORS.orange },
  pillGray: { backgroundColor: '#e2e8f0' },
  pillText: { fontWeight: '900', fontSize: 15 },
  whiteText: { color: COLORS.white },
  darkText: { color: COLORS.text },

  emptyBox: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15 },

  kidTile: {
    borderRadius: 18,
    padding: 12,
    minHeight: 54,
    justifyContent: 'center',
  },
  kidTileActive: { borderWidth: 3, borderColor: '#0f172a' },
  kidName: { color: '#0b1020', fontWeight: '900', fontSize: 16 },

  mainButton: {
    marginTop: 4,
    backgroundColor: COLORS.yellow,
    borderRadius: 18,
    paddingVertical: 14,
  },
  mainButtonText: { textAlign: 'center', color: '#111827', fontSize: 17, fontWeight: '900' },

  taskTile: {
    borderRadius: 20,
    padding: 14,
  },
  taskTitle: { color: '#0b1020', fontSize: 18, fontWeight: '900' },
  taskMeta: { color: '#1f2937', marginTop: 4, fontWeight: '700' },

  secondaryBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    paddingVertical: 12,
    marginTop: 6,
  },
  secondaryBtnText: { color: COLORS.white, textAlign: 'center', fontWeight: '900', fontSize: 16 },

  logoutBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    paddingVertical: 14,
  },
  logoutBtnText: { color: COLORS.white, textAlign: 'center', fontWeight: '900', fontSize: 16 },
});
