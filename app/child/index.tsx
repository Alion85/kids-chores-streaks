import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import { getCurrentSession, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const COLORS = {
  bg: '#EEF0F6',
  blue: '#3E63DD',
  yellow: '#FFC700',
  orange: '#FF7A1A',
  green: '#00C853',
  white: '#FFFFFF',
  text: '#0F172A',
};

const WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const tileColors = [COLORS.yellow, COLORS.orange, COLORS.blue, COLORS.green];

type TaskItem = {
  assignment_id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  points: number;
  active_days?: number[];
};

function next7Days() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return d;
  });
}

export default function ChildHome() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [coins, setCoins] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const weekDates = useMemo(() => next7Days(), []);

  async function loadTasks() {
    try {
      const session = await getCurrentSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const withDays = await supabase
        .from('chore_assignments')
        .select('id, chore:chores(title,frequency,points,active_days)')
        .eq('child_id', userId)
        .order('created_at', { ascending: false });

      let rows: any[] = [];

      if (!withDays.error) {
        rows = withDays.data ?? [];
      } else {
        const legacy = await supabase
          .from('chore_assignments')
          .select('id, chore:chores(title,frequency,points)')
          .eq('child_id', userId)
          .order('created_at', { ascending: false });

        if (legacy.error) throw legacy.error;
        rows = (legacy.data ?? []).map((r: any) => ({
          ...r,
          chore: {
            ...r.chore,
            active_days: [1, 2, 3, 4, 5],
          },
        }));
      }

      const parsed: TaskItem[] = rows.map((row: any) => ({
        assignment_id: row.id,
        title: row.chore?.title,
        frequency: row.chore?.frequency,
        points: row.chore?.points ?? 10,
        active_days: row.chore?.active_days ?? [],
      }));

      setTasks(parsed);

      const profile = await supabase.from('profiles').select('coins,streak_count').eq('id', userId).maybeSingle();
      if (!profile.error && profile.data) {
        setCoins(profile.data.coins ?? 0);
        setStreakCount(profile.data.streak_count ?? 0);
      }

      const wishes = await supabase
        .from('wishlists')
        .select('id,title,cost_coins,redeemed')
        .eq('child_id', userId)
        .order('created_at', { ascending: false });

      if (!wishes.error) setWishlist(wishes.data ?? []);
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
      const task = tasks.find((t) => t.assignment_id === assignmentId);
      const gained = task?.points ?? 10;

      const { error } = await supabase.from('chore_completions').upsert({
        assignment_id: assignmentId,
        completed_for_date: today,
        status: 'approved',
      });
      if (error) throw error;

      const session = await getCurrentSession();
      const userId = session?.user?.id;
      if (userId) {
        const nextCoins = coins + gained;
        const nextStreak = streakCount + 1;
        await supabase.from('profiles').update({ coins: nextCoins, streak_count: nextStreak }).eq('id', userId);
        setCoins(nextCoins);
        setStreakCount(nextStreak);
      }

      Alert.alert('¡Bien!', `Ganaste ${gained} coins 🪙`);
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

  const selectedWeekday = viewDate.getDay();
  const tasksForDay = tasks.filter((t) => !t.active_days?.length || t.active_days.includes(selectedWeekday));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroAvatarCircle}>
            <Text style={styles.heroAvatarText}>👦🏻</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTop}>MY TASKS</Text>
            <Text style={styles.heroTitle}>Mi Tablero</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardWhite}>
        <Text style={styles.sectionTitle}>Rachas y Coins</Text>
        <View style={styles.statsRow}>
          <View style={styles.coinCard}>
            <Text style={styles.coinLabel}>Coins</Text>
            <Text style={styles.coinValue}>🪙 {coins}</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.coinLabel}>Racha</Text>
            <Text style={styles.coinValue}>🔥 {streakCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardWhite}>
        <Text style={styles.sectionTitle}>Wish List</Text>
        {wishlist.length === 0 ? (
          <Text style={styles.emptyText}>Sin deseos todavía.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {wishlist.map((w) => {
              const canBuy = coins >= (w.cost_coins ?? 0);
              return (
                <View key={w.id} style={[styles.wishItem, canBuy && styles.wishAffordable]}>
                  <Text style={styles.wishTitle}>{w.title}</Text>
                  <Text style={styles.wishCost}>🪙 {w.cost_coins} coins {canBuy ? '✅' : ''}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.cardWhite}>
        <Text style={styles.sectionTitle}>Calendario</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {weekDates.map((d) => {
            const active = d.toDateString() === viewDate.toDateString();
            return (
              <Pressable key={d.toISOString()} onPress={() => setViewDate(d)} style={[styles.datePill, active && styles.datePillActive]}>
                <Text style={[styles.datePillTop, active && { color: '#fff' }]}>{WEEK[d.getDay()]}</Text>
                <Text style={[styles.datePillNum, active && { color: '#fff' }]}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.cardWhite}>
        <Text style={styles.sectionTitle}>Tareas del día</Text>
        {tasksForDay.length === 0 ? (
          <Text style={styles.emptyText}>No tienes tareas para este día.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {tasksForDay.map((task, i) => (
              <View key={task.assignment_id} style={[styles.taskTile, { backgroundColor: tileColors[i % tileColors.length] }]}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {task.frequency === 'daily' ? 'Diaria' : 'Semanal'} · {task.points} pts
                </Text>
                <Pressable onPress={() => markDone(task.assignment_id)} disabled={loading} style={[styles.doneBtn, loading && { opacity: 0.7 }]}>
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
  screen: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, gap: 14, paddingBottom: 34 },
  hero: { backgroundColor: COLORS.blue, borderRadius: 28, padding: 20 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff66',
  },
  heroAvatarText: { fontSize: 30 },
  heroTop: { color: '#dbeafe', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { marginTop: 4, color: COLORS.white, fontSize: 30, fontWeight: '900' },
  cardWhite: { backgroundColor: COLORS.white, borderRadius: 26, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  emptyText: { color: '#64748b', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10 },
  coinCard: {
    flex: 1,
    backgroundColor: '#FFE08A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D9A404',
    padding: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#ffd5a8',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff9f43',
    padding: 12,
  },
  coinLabel: { color: '#7c5700', fontWeight: '800' },
  coinValue: { marginTop: 4, color: '#3b2a00', fontWeight: '900', fontSize: 24 },
  wishItem: {
    backgroundColor: '#fff7d6',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1d074',
  },
  wishAffordable: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  wishTitle: { fontWeight: '800', color: '#0f172a' },
  wishCost: { color: '#8a5a00', marginTop: 2, fontWeight: '800' },
  datePill: { width: 66, borderRadius: 18, borderWidth: 1, borderColor: '#dbe1ee', paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  datePillActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  datePillTop: { color: '#334155', fontWeight: '700' },
  datePillNum: { color: '#0f172a', fontWeight: '900', fontSize: 18 },
  taskTile: { borderRadius: 20, padding: 14 },
  taskTitle: { color: '#0b1020', fontSize: 18, fontWeight: '900' },
  taskMeta: { color: '#1f2937', marginTop: 4, fontWeight: '700' },
  doneBtn: { marginTop: 10, borderRadius: 16, paddingVertical: 10, backgroundColor: COLORS.orange },
  doneBtnText: { color: COLORS.white, textAlign: 'center', fontWeight: '900' },
  secondaryBtn: { backgroundColor: COLORS.orange, borderRadius: 18, paddingVertical: 12, marginTop: 6 },
  secondaryBtnText: { color: COLORS.white, textAlign: 'center', fontWeight: '900', fontSize: 16 },
  logoutBtn: { backgroundColor: '#0f172a', borderRadius: 18, paddingVertical: 14 },
  logoutBtnText: { color: COLORS.white, textAlign: 'center', fontWeight: '900', fontSize: 16 },
});
