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
    if (!title.trim()) {
      Alert.alert('Falta título', 'Escribe el nombre de la tarea');
      return;
    }
    if (!selectedChildId) {
      Alert.alert('Falta niño', 'Selecciona a qué niño asignar');
      return;
    }

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
        <Text style={styles.heroTitle}>Panel de Padres</Text>
        <Text style={styles.heroSubtitle}>Crea, asigna y da seguimiento a las tareas de tus peques ✨</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📝 Crear y asignar tarea</Text>

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
            style={[styles.pill, frequency === 'daily' ? styles.pillActive : styles.pillInactive]}
          >
            <Text style={[styles.pillText, frequency === 'daily' ? styles.pillTextActive : styles.pillTextInactive]}>
              Diaria
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFrequency('weekly')}
            style={[styles.pill, frequency === 'weekly' ? styles.pillActive : styles.pillInactive]}
          >
            <Text style={[styles.pillText, frequency === 'weekly' ? styles.pillTextActive : styles.pillTextInactive]}>
              Semanal
            </Text>
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
            <Text style={styles.emptyText}>
              No hay niños todavía. Crea una cuenta Niño/Niña para empezar 👧🧒
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {children.map((kid) => {
              const active = selectedChildId === kid.id;
              return (
                <Pressable
                  key={kid.id}
                  onPress={() => setSelectedChildId(kid.id)}
                  style={[styles.kidChip, active && styles.kidChipActive]}
                >
                  <Text style={[styles.kidName, active && styles.kidNameActive]}>{kid.display_name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={onCreateAndAssign}
          disabled={loading || children.length === 0}
          style={[styles.primaryBtn, (loading || children.length === 0) && styles.disabledBtn]}
        >
          <Text style={styles.primaryBtnText}>{loading ? 'Guardando...' : 'Crear y asignar'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🎯 Mis tareas creadas</Text>
        {myChores.length === 0 ? (
          <Text style={styles.emptyText}>Aún no has creado tareas.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {myChores.map((c) => (
              <View key={c.id} style={styles.taskItem}>
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
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16, gap: 14, paddingBottom: 34 },
  hero: {
    backgroundColor: '#1d4ed8',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '800' },
  heroSubtitle: { color: '#dbeafe', marginTop: 6, fontSize: 14 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  row: { flexDirection: 'row', gap: 8 },
  pill: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
  pillActive: { backgroundColor: '#1d4ed8' },
  pillInactive: { backgroundColor: '#e2e8f0' },
  pillText: { fontWeight: '800' },
  pillTextActive: { color: 'white' },
  pillTextInactive: { color: '#0f172a' },
  label: { fontWeight: '800', color: '#0f172a' },
  emptyBox: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12 },
  emptyText: { color: '#64748b', fontSize: 15 },
  kidChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
  },
  kidChipActive: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
  kidName: { fontWeight: '700', color: '#0f172a' },
  kidNameActive: { color: '#14532d' },
  primaryBtn: {
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  disabledBtn: { backgroundColor: '#94a3b8' },
  primaryBtnText: { color: 'white', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  taskItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  taskTitle: { fontWeight: '800', color: '#0f172a', fontSize: 16 },
  taskMeta: { color: '#334155', marginTop: 3 },
  secondaryBtn: { backgroundColor: '#e2e8f0', padding: 12, borderRadius: 10, marginTop: 8 },
  secondaryBtnText: { textAlign: 'center', fontWeight: '800', color: '#0f172a' },
  logoutBtn: { backgroundColor: '#0f172a', padding: 14, borderRadius: 12 },
  logoutBtnText: { color: 'white', textAlign: 'center', fontWeight: '800', fontSize: 16 },
});
