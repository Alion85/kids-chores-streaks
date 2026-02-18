import { View, Text } from 'react-native';

export default function ChildHome() {
  return (
    <View style={{ flex: 1, padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Mi Tablero</Text>
      <Text>- Mis tareas de hoy</Text>
      <Text>- Marcar completadas</Text>
      <Text>- Ver mi racha</Text>
      <Text>- Ver puntos y logros</Text>
    </View>
  );
}
