import { View, Text } from 'react-native';

export default function ParentHome() {
  return (
    <View style={{ flex: 1, padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Panel de Padres</Text>
      <Text>- Crear tareas</Text>
      <Text>- Asignar a hijos</Text>
      <Text>- Validar completadas</Text>
      <Text>- Ver progreso y rachas</Text>
    </View>
  );
}
