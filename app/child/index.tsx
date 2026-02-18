import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
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
      Alert.alert('¡Bien!', 'Tarea enviada para aprobación.');
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
    <ScrollView contentContainerStyle={{ padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Mi Tablero</Text>
      <Text style={{ color: '#374151' }}>Tus tareas asignadas:</Text>

      {tasks.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>Aún no tienes tareas asignadas.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {tasks.map((task) => (
            <View key={task.assignment_id} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12 }}>
              <Text style={{ fontWeight: '700' }}>{task.title}</Text>
              <Text style={{ color: '#374151' }}>
                {task.frequency === 'daily' ? 'Diaria' : 'Semanal'} · {task.points} pts
              </Text>
              <Pressable
                onPress={() => markDone(task.assignment_id)}
                disabled={loading}
                style={{ backgroundColor: '#16a34a', padding: 10, borderRadius: 8, marginTop: 8 }}
              >
                <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Marcar como hecha</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={loadTasks} style={{ backgroundColor: '#e5e7eb', padding: 12, borderRadius: 10 }}>
        <Text style={{ textAlign: 'center', fontWeight: '700' }}>Recargar</Text>
      </Pressable>

      <Pressable onPress={onLogout} style={{ marginTop: 8, backgroundColor: '#111827', padding: 12, borderRadius: 10 }}>
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
