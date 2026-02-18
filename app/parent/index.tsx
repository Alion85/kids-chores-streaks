import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { getCurrentSession, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
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

const WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function next7Days(from = new Date()) {
  const now = from;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return d;
  });
}

export default function ParentHome() {
  const [children, setChildren] = useState<ProfileLite[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [points, setPoints] = useState('10');
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [myChores, setMyChores] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [monthCursor, setMonthCursor] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [parentName, setParentName] = useState('Adrián Román');

  const weekDates = useMemo(() => next7Days(viewDate), [viewDate]);

  function toggleDay(day: number) {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  async function refreshData() {
    try {
      const session = await getCurrentSession();
      const userId = session?.user?.id;

      const [kids, chores] = await Promise.all([listChildrenForMyFamily(), listMyCreatedChores()]);
      setChildren(kids);
      if (!selectedChildId && kids[0]?.id) setSelectedChildId(kids[0].id);
      setMyChores(chores);

      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle();
        if (data?.display_name) setParentName(data.display_name);
      }
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
    if (!activeDays.length) return Alert.alert('Faltan días', 'Selecciona al menos un día');

    try {
      setLoading(true);
      await createChoreAndAssign({
        title: title.trim(),
        frequency,
        points: Number(points) || 10,
        childId: selectedChildId,
        activeDays,
      });
      setTitle('');
      setPoints('10');
      setFrequency('daily');
      setActiveDays([1, 2, 3, 4, 5]);
      await refreshData();
      Alert.alert('Listo', 'Tarea creada y asignada ✅');
    } catch (e: any) {
      Alert.alert('Error al crear tarea', e?.message ?? 'Tip: ejecuta el SQL nuevo para active_days');
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
  const choresForSelectedDay = myChores.filter((c) => {
    if (!Array.isArray(c.active_days) || c.active_days.length === 0) return true;
    return c.active_days.includes(selectedWeekday);
  });

  const monthLabel = `${MONTHS[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;
  const monthFirst = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthLast = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  const leadingBlanks = monthFirst.getDay();
  const monthCells: Array<Date | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: monthLast.getDate() }, (_, i) => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), i + 1)),
  ];

  function shiftMonth(delta: number) {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroAvatarCircle}>
            <Text style={styles.heroAvatarText}>👨🏻</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTop}>WORKSPACE</Text>
            <Text style={styles.heroName}>{parentName}</Text>
            <Text style={styles.heroTitle}>Panel de Padres</Text>
          </View>
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
          <Pressable onPress={() => setFrequency('daily')} style={[styles.pill, frequency === 'daily' ? styles.pillBlue : styles.pillGray]}>
            <Text style={[styles.pillText, frequency === 'daily' ? styles.whiteText : styles.darkText]}>Diaria</Text>
          </Pressable>
          <Pressable onPress={() => setFrequency('weekly')} style={[styles.pill, frequency === 'weekly' ? styles.pillOrange : styles.pillGray]}>
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

        <Text style={styles.label}>Días asignados:</Text>
        <View style={styles.weekRowWrap}>
          {WEEK.map((label, i) => {
            const active = activeDays.includes(i);
            return (
              <Pressable key={label} onPress={() => toggleDay(i)} style={[styles.dayChip, active && styles.dayChipActive]}>
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Asignar a:</Text>
        {children.length === 0 ? (
          <View style={styles.emptyBox}><Text style={styles.emptyText}>No hay niños todavía. Crea un usuario Niño/Niña primero.</Text></View>
        ) : (
          <View style={{ gap: 8 }}>
            {children.map((kid, idx) => {
              const active = selectedChildId === kid.id;
              const bg = [COLORS.yellow, COLORS.blue, COLORS.orange, COLORS.green][idx % 4];
              return (
                <Pressable key={kid.id} onPress={() => setSelectedChildId(kid.id)} style={[styles.kidTile, { backgroundColor: bg }, active && styles.kidTileActive]}>
                  <Text style={styles.kidName}>{kid.display_name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable onPress={onCreateAndAssign} disabled={loading || children.length === 0} style={[styles.mainButton, (loading || children.length === 0) && { opacity: 0.5 }]}>
          <Text style={styles.mainButtonText}>{loading ? 'Guardando...' : 'Crear y asignar'}</Text>
        </Pressable>
      </View>

      <View style={styles.cardWhite}>
        <View style={styles.calendarHeaderRow}>
          <Text style={styles.sectionTitle}>Calendario de tareas</Text>
          <Pressable
            onPress={() => {
              setShowMonthCalendar((prev) => !prev);
              setMonthCursor(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
            }}
            style={styles.calendarToggleBtn}
          >
            <Text style={styles.calendarToggleText}>{showMonthCalendar ? 'Ver semana' : 'Ver mes'}</Text>
          </Pressable>
        </View>

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

        {showMonthCalendar && (
          <View style={styles.monthWrap}>
            <View style={styles.monthTopRow}>
              <Pressable onPress={() => shiftMonth(-1)} style={styles.monthNavBtn}><Text style={styles.monthNavText}>‹</Text></Pressable>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Pressable onPress={() => shiftMonth(1)} style={styles.monthNavBtn}><Text style={styles.monthNavText}>›</Text></Pressable>
            </View>

            <View style={styles.monthWeekRow}>
              {WEEK.map((w) => (
                <Text key={w} style={styles.monthWeekLabel}>{w}</Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {monthCells.map((d, idx) => {
                if (!d) return <View key={`blank-${idx}`} style={styles.monthCellBlank} />;
                const active = d.toDateString() === viewDate.toDateString();
                return (
                  <Pressable key={d.toISOString()} onPress={() => setViewDate(d)} style={[styles.monthCell, active && styles.monthCellActive]}>
                    <Text style={[styles.monthCellText, active && styles.monthCellTextActive]}>{d.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {choresForSelectedDay.length === 0 ? (
          <Text style={[styles.emptyText, { marginTop: 10 }]}>No hay tareas para este día.</Text>
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            {choresForSelectedDay.map((c: any, i: number) => (
              <View key={c.id} style={[styles.taskTile, { backgroundColor: [COLORS.yellow, COLORS.orange, COLORS.blue, COLORS.green][i % 4] }]}>
                <Text style={styles.taskTitle}>{c.title}</Text>
                <Text style={styles.taskMeta}>{c.frequency === 'daily' ? 'Diaria' : 'Semanal'} · {c.points} pts</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={refreshData} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Recargar</Text></Pressable>
      </View>

      <Pressable onPress={onLogout} style={styles.logoutBtn}><Text style={styles.logoutBtnText}>Cerrar sesión</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, gap: 14, paddingBottom: 34 },
  hero: { backgroundColor: COLORS.blue, borderRadius: 28, padding: 20 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ffffff33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff66',
  },
  heroAvatarText: { fontSize: 30 },
  heroTop: { color: '#dbeafe', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heroName: { color: '#e0e7ff', marginTop: 2, fontSize: 15, fontWeight: '800' },
  heroTitle: { marginTop: 1, color: COLORS.white, fontSize: 30, fontWeight: '900' },
  cardWhite: { backgroundColor: COLORS.white, borderRadius: 26, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  label: { fontWeight: '800', color: COLORS.text },
  input: { borderWidth: 1, borderColor: '#dbe1ee', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: '#f8fafc' },
  row: { flexDirection: 'row', gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  pillBlue: { backgroundColor: COLORS.blue },
  pillOrange: { backgroundColor: COLORS.orange },
  pillGray: { backgroundColor: '#e2e8f0' },
  pillText: { fontWeight: '900', fontSize: 15 },
  whiteText: { color: COLORS.white },
  darkText: { color: COLORS.text },
  weekRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { borderRadius: 999, borderWidth: 1, borderColor: '#dbe1ee', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  dayChipActive: { backgroundColor: COLORS.yellow, borderColor: COLORS.yellow },
  dayChipText: { color: COLORS.text, fontWeight: '800' },
  dayChipTextActive: { color: '#111827' },
  emptyBox: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  kidTile: { borderRadius: 18, padding: 12, minHeight: 54, justifyContent: 'center' },
  kidTileActive: { borderWidth: 3, borderColor: '#0f172a' },
  kidName: { color: '#0b1020', fontWeight: '900', fontSize: 16 },
  mainButton: { marginTop: 4, backgroundColor: COLORS.yellow, borderRadius: 18, paddingVertical: 14 },
  mainButtonText: { textAlign: 'center', color: '#111827', fontSize: 17, fontWeight: '900' },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calendarToggleBtn: { backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  calendarToggleText: { color: '#1e3a8a', fontWeight: '800' },
  datePill: { width: 66, borderRadius: 18, borderWidth: 1, borderColor: '#dbe1ee', paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  datePillActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  datePillTop: { color: '#334155', fontWeight: '700' },
  datePillNum: { color: '#0f172a', fontWeight: '900', fontSize: 18 },
  monthWrap: { marginTop: 10, backgroundColor: '#f8fafc', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#dbe1ee' },
  monthTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  monthNavBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  monthNavText: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginTop: -2 },
  monthTitle: { fontWeight: '900', color: '#0f172a', fontSize: 16 },
  monthWeekRow: { flexDirection: 'row', marginBottom: 6 },
  monthWeekLabel: { width: `${100 / 7}%`, textAlign: 'center', color: '#64748b', fontWeight: '700', fontSize: 12 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCellBlank: { width: `${100 / 7}%`, height: 38 },
  monthCell: { width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  monthCellActive: { backgroundColor: COLORS.blue },
  monthCellText: { color: '#0f172a', fontWeight: '700' },
  monthCellTextActive: { color: '#fff' },
  taskTile: { borderRadius: 20, padding: 14 },
  taskTitle: { color: '#0b1020', fontSize: 18, fontWeight: '900' },
  taskMeta: { color: '#1f2937', marginTop: 4, fontWeight: '700' },
  secondaryBtn: { backgroundColor: COLORS.orange, borderRadius: 18, paddingVertical: 12, marginTop: 6 },
  secondaryBtnText: { color: COLORS.white, textAlign: 'center', fontWeight: '900', fontSize: 16 },
  logoutBtn: { backgroundColor: '#0f172a', borderRadius: 18, paddingVertical: 14 },
  logoutBtnText: { color: COLORS.white, textAlign: 'center', fontWeight: '900', fontSize: 16 },
});
