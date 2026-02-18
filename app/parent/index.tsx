import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, TextInput, ScrollView } from 'react-native';
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
      Alert.alert('Listo', 'Tarea creada y asignada');
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
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Panel de Padres</Text>

      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8 }}>Crear y asignar tarea</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Tender cama"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12 }}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => setFrequency('daily')}
          style={{
            backgroundColor: frequency === 'daily' ? '#1d4ed8' : '#e5e7eb',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: frequency === 'daily' ? 'white' : '#111827', fontWeight: '700' }}>Diaria</Text>
        </Pressable>
        <Pressable
          onPress={() => setFrequency('weekly')}
          style={{
            backgroundColor: frequency === 'weekly' ? '#1d4ed8' : '#e5e7eb',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: frequency === 'weekly' ? 'white' : '#111827', fontWeight: '700' }}>Semanal</Text>
        </Pressable>
      </View>

      <TextInput
        value={points}
        onChangeText={setPoints}
        keyboardType="number-pad"
        placeholder="Puntos"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, maxWidth: 120 }}
      />

      <Text style={{ fontWeight: '700' }}>Asignar a:</Text>
      {children.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>
          No hay perfiles de niños aún. Crea una cuenta Niño/Niña primero desde la app.
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          {children.map((kid) => {
            const active = selectedChildId === kid.id;
            return (
              <Pressable
                key={kid.id}
                onPress={() => setSelectedChildId(kid.id)}
                style={{
                  borderWidth: 1,
                  borderColor: active ? '#16a34a' : '#d1d5db',
                  backgroundColor: active ? '#dcfce7' : 'white',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontWeight: '700' }}>{kid.display_name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        onPress={onCreateAndAssign}
        disabled={loading || children.length === 0}
        style={{
          backgroundColor: loading || children.length === 0 ? '#9ca3af' : '#16a34a',
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>
          {loading ? 'Guardando...' : 'Crear y asignar'}
        </Text>
      </Pressable>

      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 10 }}>Mis tareas creadas</Text>
      {myChores.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>Aún no has creado tareas.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {myChores.map((c) => (
            <View key={c.id} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12 }}>
              <Text style={{ fontWeight: '700' }}>{c.title}</Text>
              <Text style={{ color: '#374151' }}>
                {c.frequency === 'daily' ? 'Diaria' : 'Semanal'} · {c.points} pts
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={refreshData} style={{ backgroundColor: '#e5e7eb', padding: 12, borderRadius: 10 }}>
        <Text style={{ textAlign: 'center', fontWeight: '700' }}>Recargar</Text>
      </Pressable>

      <Pressable onPress={onLogout} style={{ marginTop: 8, backgroundColor: '#111827', padding: 12, borderRadius: 10 }}>
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
