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

const AVATAR_AGES = [5, 7, 9, 11, 13, 15];
const EYE_COLORS = [
  { key: 'blue', label: 'ojos azules' },
  { key: 'green', label: 'ojos verdes' },
];
const AVATAR_BASES = [
  { key: 'boy_white_black', label: 'Niño tez blanca pelo negro', emoji: '👦🏻' },
  { key: 'boy_white_blond', label: 'Niño tez blanca pelo güero', emoji: '👱🏻‍♂️' },
  { key: 'boy_white_brown', label: 'Niño tez blanca pelo castaño', emoji: '🧒🏻' },
  { key: 'boy_white_red', label: 'Niño tez blanca pelirrojo', emoji: '🧑🏻‍🦰' },
  { key: 'boy_brown_black', label: 'Niño moreno pelo negro', emoji: '👦🏾' },
  { key: 'boy_brown_blond', label: 'Niño moreno pelo güero', emoji: '👱🏾‍♂️' },
  { key: 'girl_white_black', label: 'Niña tez blanca pelo negro', emoji: '👧🏻' },
  { key: 'girl_white_blond', label: 'Niña tez blanca pelo güero', emoji: '👱🏻‍♀️' },
  { key: 'girl_white_brown', label: 'Niña tez blanca pelo castaño', emoji: '🧒🏻' },
  { key: 'girl_white_red', label: 'Niña tez blanca pelirroja', emoji: '👩🏻‍🦰' },
  { key: 'girl_brown_black', label: 'Niña morena pelo negro', emoji: '👧🏾' },
  { key: 'girl_brown_blond', label: 'Niña morena pelo güero', emoji: '👱🏾‍♀️' },
];

const AVATAR_OPTIONS = AVATAR_AGES.flatMap((age) =>
  AVATAR_BASES.flatMap((base) =>
    EYE_COLORS.map((eye) => ({
      id: `${base.key}_${eye.key}_${age}`,
      age,
      label: `${base.label}, ${eye.label} (${age} años)`,
      emoji: base.emoji,
    }))
  )
);

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

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const bigint = parseInt(value, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function streakColor(streak: number) {
  const start = hexToRgb('#9CA3AF'); // gris
  const end = hexToRgb('#00C853'); // verde
  const t = Math.max(0, Math.min(streak / 20, 1));
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function dateDiffDays(a: Date, b: Date) {
  const one = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const two = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.floor((one - two) / (1000 * 60 * 60 * 24));
}

async function getLastCompletionDateForChild(userId: string) {
  const assignmentRes = await supabase.from('chore_assignments').select('id').eq('child_id', userId);
  if (assignmentRes.error) return null;

  const ids = (assignmentRes.data ?? []).map((a: any) => a.id).filter(Boolean);
  if (!ids.length) return null;

  const completionRes = await supabase
    .from('chore_completions')
    .select('completed_for_date')
    .in('assignment_id', ids)
    .order('completed_for_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (completionRes.error) return null;
  return completionRes.data?.completed_for_date ? new Date(completionRes.data.completed_for_date) : null;
}

export default function ChildHome() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [coins, setCoins] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_OPTIONS[0].id);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
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

      const profileWithAvatar = await supabase
        .from('profiles')
        .select('coins,streak_count,avatar_choice')
        .eq('id', userId)
        .maybeSingle();

      let profileData: any = null;
      if (!profileWithAvatar.error) {
        profileData = profileWithAvatar.data;
      } else {
        const profileLegacy = await supabase
          .from('profiles')
          .select('coins,streak_count')
          .eq('id', userId)
          .maybeSingle();
        profileData = profileLegacy.data;
      }

      if (profileData) {
        const now = new Date();
        const last = await getLastCompletionDateForChild(userId);
        let normalizedStreak = profileData.streak_count ?? 0;

        if (last && dateDiffDays(now, last) > 1) {
          normalizedStreak = 0;
          await supabase.from('profiles').update({ streak_count: 0 }).eq('id', userId);
        }

        setCoins(profileData.coins ?? 0);
        setStreakCount(normalizedStreak);
        if (profileData.avatar_choice) setSelectedAvatarId(profileData.avatar_choice);
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
        const baseProfile = await supabase
          .from('profiles')
          .select('coins,streak_count')
          .eq('id', userId)
          .maybeSingle();

        const currentCoins = baseProfile.data?.coins ?? coins;
        const currentStreak = baseProfile.data?.streak_count ?? streakCount;

        const now = new Date();
        const last = await getLastCompletionDateForChild(userId);
        const gap = last ? dateDiffDays(now, last) : 1;

        const nextCoins = currentCoins + gained;
        const nextStreak = !last ? 1 : gap <= 1 ? currentStreak + 1 : 1;

        await supabase
          .from('profiles')
          .update({ coins: nextCoins, streak_count: nextStreak })
          .eq('id', userId);

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
  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) ?? AVATAR_OPTIONS[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <Pressable style={styles.heroAvatarCircle} onPress={() => setShowAvatarPicker((p) => !p)}>
            <Text style={styles.heroAvatarText}>{currentAvatar.emoji}</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTop}>MY TASKS</Text>
            <Text style={styles.heroTitle}>Mi Tablero</Text>
            <Text style={styles.heroHint}>Toca el avatar para cambiarlo</Text>
          </View>
        </View>
      </View>

      {showAvatarPicker && (
        <View style={styles.cardWhite}>
          <Text style={styles.sectionTitle}>Elige tu avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((a) => {
              const active = selectedAvatarId === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={async () => {
                    setSelectedAvatarId(a.id);
                    setShowAvatarPicker(false);
                    const session = await getCurrentSession();
                    const userId = session?.user?.id;
                    if (userId) {
                      const save = await supabase.from('profiles').update({ avatar_choice: a.id }).eq('id', userId);
                      if (save.error) {
                        // fallback silencioso cuando la columna aún no existe
                      }
                    }
                  }}
                  style={[styles.avatarOption, active && styles.avatarOptionActive]}
                >
                  <Text style={styles.avatarEmoji}>{a.emoji}</Text>
                  <Text style={styles.avatarAge}>{a.age}a</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.cardWhite}>
        <Text style={styles.sectionTitle}>Rachas y Coins</Text>
        <View style={styles.statsRow}>
          <View style={styles.coinCard}>
            <Text style={styles.coinLabel}>Coins</Text>
            <Text style={styles.coinValue}>🪙 {coins}</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: streakColor(streakCount), borderColor: streakColor(streakCount) }]}>
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
              const canBuy = !w.redeemed && coins >= (w.cost_coins ?? 0);
              return (
                <View key={w.id} style={[styles.wishItem, canBuy && styles.wishAffordable]}>
                  <Text style={styles.wishTitle}>{w.title}</Text>
                  <Text style={styles.wishCost}>🪙 {w.cost_coins} coins {w.redeemed ? '🎁 canjeado' : canBuy ? '✅' : ''}</Text>
                  {!w.redeemed && (
                    <Pressable
                      disabled={!canBuy}
                      onPress={async () => {
                        const session = await getCurrentSession();
                        const userId = session?.user?.id;
                        if (!userId || !canBuy) return;
                        await supabase.from('wishlists').update({ redeemed: true }).eq('id', w.id);
                        const nextCoins = coins - (w.cost_coins ?? 0);
                        await supabase.from('profiles').update({ coins: nextCoins }).eq('id', userId);
                        setCoins(nextCoins);
                        await loadTasks();
                      }}
                      style={[styles.redeemBtn, !canBuy && { opacity: 0.4 }]}
                    >
                      <Text style={styles.redeemBtnText}>Canjear</Text>
                    </Pressable>
                  )}
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
  heroHint: { color: '#e0e7ff', marginTop: 2, fontSize: 12, fontWeight: '700' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarOption: {
    width: '22%',
    minWidth: 66,
    borderWidth: 1,
    borderColor: '#dbe1ee',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarOptionActive: { borderColor: '#3E63DD', backgroundColor: '#e0e7ff' },
  avatarEmoji: { fontSize: 24 },
  avatarAge: { marginTop: 2, color: '#334155', fontWeight: '700', fontSize: 12 },
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
  redeemBtn: { marginTop: 6, backgroundColor: '#F7C948', borderRadius: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#D9A404' },
  redeemBtnText: { textAlign: 'center', color: '#5a3b00', fontWeight: '900' },
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
