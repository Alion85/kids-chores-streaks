import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import { getCurrentSession, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type TaskItem = {
  assignment_id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  points: number;
};

export default function ChildHome() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadTasks() {
    try {
      const session = await getCurrentSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('chore_assignments')
        .select('id, chore:chores(title,frequency,points)')
        .eq('child_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsed: TaskItem[] = (data ?? []).map((row: any) => ({
        assignment_id: row.id,
        title: row.chore?.title,
        frequency: row.chore?.frequency,
        points: row.chore?.points ?? 10,
      }));

      setTasks(parsed);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudieron cargar tareas');
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function markDone(assignmentId: string) {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from('chore_completions').upsert({
        assignment_id: assignmentId,
        completed_for_date: today,
        status: 'pending',
      });
      if (error) throw error;
      Alert.alert('¡Bien!', 'Tarea enviada para aprobación ✅');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo marcar');
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
        <Text style={styles.heroTitle}>Mi Tablero</Text>
        <Text style={styles.heroSubtitle}>Completa tus tareas y mantén tu racha 🔥</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🎒 Mis tareas</Text>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>Aún no tienes tareas asignadas.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {tasks.map((task) => (
              <View key={task.assignment_id} style={styles.taskItem}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {task.frequency === 'daily' ? 'Diaria' : 'Semanal'} · {task.points} pts
                </Text>
                <Pressable
                  onPress={() => markDone(task.assignment_id)}
                  disabled={loading}
                  style={[styles.doneBtn, loading && { opacity: 0.7 }]}
                >
                  <Text style={styles.doneBtnText}>Marcar como hecha</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={loadTasks} style={styles.secondaryBtn}>
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
    backgroundColor: '#0ea5e9',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '800' },
  heroSubtitle: { color: '#e0f2fe', marginTop: 6, fontSize: 14 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  emptyText: { color: '#64748b', fontSize: 15 },
  taskItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  taskTitle: { fontWeight: '800', color: '#0f172a', fontSize: 16 },
  taskMeta: { color: '#334155', marginTop: 3 },
  doneBtn: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    padding: 10,
  },
  doneBtnText: { color: 'white', textAlign: 'center', fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#e2e8f0', padding: 12, borderRadius: 10, marginTop: 8 },
  secondaryBtnText: { textAlign: 'center', fontWeight: '800', color: '#0f172a' },
  logoutBtn: { backgroundColor: '#0f172a', padding: 14, borderRadius: 12 },
  logoutBtnText: { color: 'white', textAlign: 'center', fontWeight: '800', fontSize: 16 },
});
