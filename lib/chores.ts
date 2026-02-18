import { supabase } from './supabase';
import { getCurrentSession } from './auth';

export type ProfileLite = {
  id: string;
  display_name: string;
  role: 'parent' | 'child';
  family_id: string | null;
};

async function getMyProfile() {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('No session');

  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,role,family_id')
    .eq('id', userId)
    .single();

  if (error || !data) throw new Error('No se encontró perfil');
  return data as ProfileLite;
}

export async function ensureParentFamily() {
  const me = await getMyProfile();
  if (me.role !== 'parent') throw new Error('Solo padres pueden crear tareas');

  if (me.family_id) return { profile: me, familyId: me.family_id };

  const familyName = `Familia de ${me.display_name}`;
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name: familyName })
    .select('id')
    .single();

  if (familyError || !family?.id) throw new Error('No se pudo crear familia');

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('id', me.id);

  if (updateError) throw new Error('No se pudo ligar perfil a familia');

  return { profile: { ...me, family_id: family.id }, familyId: family.id };
}

export async function listChildrenForMyFamily() {
  const { familyId } = await ensureParentFamily();

  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,role,family_id')
    .eq('role', 'child')
    .or(`family_id.eq.${familyId},family_id.is.null`)
    .order('display_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProfileLite[];
}

export async function createChoreAndAssign(params: {
  title: string;
  frequency: 'daily' | 'weekly';
  points: number;
  childId: string;
}) {
  const { profile, familyId } = await ensureParentFamily();

  const { error: childPatchError } = await supabase
    .from('profiles')
    .update({ family_id: familyId })
    .eq('id', params.childId)
    .eq('role', 'child');

  if (childPatchError) throw new Error('No se pudo asociar niño a la familia');

  const { data: chore, error: choreError } = await supabase
    .from('chores')
    .insert({
      family_id: familyId,
      title: params.title,
      frequency: params.frequency,
      points: params.points,
      created_by: profile.id,
    })
    .select('id,title,frequency,points,created_at')
    .single();

  if (choreError || !chore?.id) throw new Error('No se pudo crear la tarea');

  const { error: assignmentError } = await supabase.from('chore_assignments').insert({
    chore_id: chore.id,
    child_id: params.childId,
  });

  if (assignmentError) throw new Error('No se pudo asignar la tarea');

  return chore;
}

export async function listMyCreatedChores() {
  const me = await getMyProfile();
  const { data, error } = await supabase
    .from('chores')
    .select('id,title,frequency,points,created_at')
    .eq('created_by', me.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
