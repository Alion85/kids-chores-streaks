import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { ensureProfileFromSession, getCurrentSession, getMyRole, signIn } from '@/lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      const session = await getCurrentSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('No session');
      let role = await getMyRole(userId);
      if (!role) {
        role = await ensureProfileFromSession();
      }

      if (role === 'parent') router.replace('/parent');
      else if (role === 'child') router.replace('/child');
      else {
        Alert.alert('Perfil incompleto', 'No se pudo resolver el rol de esta cuenta.');
        router.replace('/(auth)');
      }
    } catch (e: any) {
      Alert.alert('Error al iniciar sesión', e?.message ?? 'Intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>Iniciar sesión</Text>
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
        placeholder="Contraseña"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12 }}
      />
      <Pressable
        onPress={onLogin}
        disabled={loading}
        style={{ backgroundColor: '#111827', padding: 14, borderRadius: 12 }}
      >
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </Pressable>
    </View>
  );
}
