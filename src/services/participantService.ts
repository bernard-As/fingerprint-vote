// src/services/participantService.ts
import { supabase } from '../lib/supabaseClient';
import type { Participant } from '../lib/types';

const PARTICIPANTS_TABLE = 'participants'; // Your Supabase table name

export const getParticipants = async (): Promise<{ data: Participant[] | null, error: any }> => {
  const { data, error } = await supabase
    .from(PARTICIPANTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const addParticipant = async (participantData: Omit<Participant, 'id' | 'created_at'>): Promise<{ data: Participant | null, error: any }> => {
  const { data, error } = await supabase
    .from(PARTICIPANTS_TABLE)
    .insert([participantData])
    .select()
    .single(); // .single() is useful if you expect only one row back and want it as an object not an array
  return { data, error };
};

export const updateParticipant = async (id: string, updates: Partial<Omit<Participant, 'id' | 'created_at' | 'participant'>>): Promise<{ data: Participant | null, error: any }> => {
  const { data, error } = await supabase
    .from(PARTICIPANTS_TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const deleteParticipant = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase
    .from(PARTICIPANTS_TABLE)
    .delete()
    .eq('id', id);
  return { error };
};

// Pro-Tip for Image Uploads (if you enhance later):
// You'd need functions to upload to Supabase Storage and get the public URL.
// Example:
// export const uploadParticipantImage = async (file: File, participantId: string) => {
//   const fileName = `participant_${participantId}_${Date.now()}.${file.name.split('.').pop()}`;
//   const { data, error } = await supabase.storage
//     .from('participant-images') // Your storage bucket name
//     .upload(fileName, file);
//   if (error) return { url: null, error };
//   const { data: { publicUrl } } = supabase.storage.from('participant-images').getPublicUrl(fileName);
//   return { url: publicUrl, error: null };
// };