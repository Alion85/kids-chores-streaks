import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { ensureProfileFromSession, getCurrentSession, getMyRole } from '@/lib/auth';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session?.user?.id) {
          setTarget('/(auth)');
          return;
        }

        let role = await getMyRole(session.user.id);
        if (!role) role = await ensureProfileFromSession();

        if (role === 'parent') setTarget('/parent');
        else if (role === 'child') setTarget('/child');
        else setTarget('/(auth)');
      } catch {
        setTarget('/(auth)');
      }
    })();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
