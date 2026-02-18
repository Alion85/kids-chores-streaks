import { Link } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function AuthRoleScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>¿Quién entra?</Text>
      <Link href={{ pathname: '/(auth)/register', params: { role: 'parent' } }} asChild>
        <Pressable style={{ backgroundColor: '#1d4ed8', padding: 16, borderRadius: 12 }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Soy Padre/Madre</Text>
        </Pressable>
      </Link>
      <Link href={{ pathname: '/(auth)/register', params: { role: 'child' } }} asChild>
        <Pressable style={{ backgroundColor: '#16a34a', padding: 16, borderRadius: 12 }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Soy Niño/Niña</Text>
        </Pressable>
      </Link>
      <Link href="/(auth)/login" asChild>
        <Pressable style={{ borderColor: '#111827', borderWidth: 1, padding: 16, borderRadius: 12 }}>
          <Text style={{ color: '#111827', fontWeight: '700' }}>Ya tengo cuenta</Text>
        </Pressable>
      </Link>
    </View>
  );
}
