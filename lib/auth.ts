import { supabase } from './supabase';

export type UserRole = 'parent' | 'child';

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, role: UserRole, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        display_name: displayName,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function createProfile(params: {
  id: string;
  displayName: string;
  role: UserRole;
}) {
  const { error } = await supabase.from('profiles').upsert({
    id: params.id,
    display_name: params.displayName,
    role: params.role,
  });

  if (error) throw error;
}

export async function getMyRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return (data?.role as UserRole) ?? null;
}

export async function ensureProfileFromSession() {
  const session = await getCurrentSession();
  const user = session?.user;
  if (!user?.id) return null;

  const existingRole = await getMyRole(user.id);
  if (existingRole) return existingRole;

  const metaRole = user.user_metadata?.role;
  const role: UserRole = metaRole === 'child' ? 'child' : 'parent';
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario';

  await createProfile({
    id: user.id,
    role,
    displayName,
  });

  return role;
}
