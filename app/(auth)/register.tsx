import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { createProfile, getCurrentSession, signUp, type UserRole } from '@/lib/auth';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role === 'child' ? 'child' : 'parent') as UserRole;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    try {
      setLoading(true);
      await signUp(email.trim(), password, role, displayName.trim() || 'Usuario');
      const session = await getCurrentSession();
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert('Revisa tu correo', 'Si activaste confirmación por email, confirma tu cuenta y luego inicia sesión.');
        router.replace('/(auth)/login');
        return;
      }

      await createProfile({
        id: userId,
        displayName: displayName.trim() || 'Usuario',
        role,
      });

      router.replace(role === 'parent' ? '/parent' : '/child');
    } catch (e: any) {
      Alert.alert('Error al registrarte', e?.message ?? 'Intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>
        Registro {role === 'parent' ? 'Padre/Madre' : 'Niño/Niña'}
      </Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Nombre"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12 }}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Correo"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Contraseña (mínimo 6)"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12 }}
      />
      <Pressable
        onPress={onRegister}
        disabled={loading}
        style={{ backgroundColor: role === 'parent' ? '#1d4ed8' : '#16a34a', padding: 14, borderRadius: 12 }}
      >
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Text>
      </Pressable>
    </View>
  );
}
