import { router } from 'expo-router';
import { View, Text, Pressable, Alert } from 'react-native';
import { signOut } from '@/lib/auth';

export default function ChildHome() {
  async function onLogout() {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cerrar sesión');
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Mi Tablero</Text>
      <Text>- Mis tareas de hoy</Text>
      <Text>- Marcar completadas</Text>
      <Text>- Ver mi racha</Text>
      <Text>- Ver puntos y logros</Text>

      <Pressable onPress={onLogout} style={{ marginTop: 20, backgroundColor: '#111827', padding: 12, borderRadius: 10 }}>
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
