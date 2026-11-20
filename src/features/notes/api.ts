import { supabase } from '../../lib/supabase/client';
import type { Note, NoteFolder } from '../../types';
export async function fetchNotes(uid:string,folderId?:string|null):Promise<Note[]> {
  let q=supabase.from('notes').select('*').eq('user_id',uid).eq('is_archived',false).order('pinned',{ascending:false}).order('updated_at',{ascending:false});
  if(folderId) q=q.eq('folder_id',folderId);
  const { data,error }=await q; if(error)throw new Error(error.message); return data as Note[];
}
export async function fetchNote(id:string):Promise<Note> { const { data,error }=await supabase.from('notes').select('*').eq('id',id).single(); if(error)throw new Error(error.message); return data as Note; }
export async function searchNotes(uid:string,query:string):Promise<Note[]> { const { data,error }=await supabase.from('notes').select('*').eq('user_id',uid).eq('is_archived',false).or(`title.ilike.%${query}%,content.ilike.%${query}%`).order('updated_at',{ascending:false}).limit(30); if(error)throw new Error(error.message); return data as Note[]; }
export async function createNote(uid:string,values:Partial<Note>):Promise<Note> { const { data,error }=await supabase.from('notes').insert({ user_id:uid, title:values.title??'Untitled', content:values.content??'', content_type:values.content_type??'text', folder_id:values.folder_id??null, tags:values.tags??[], is_favorite:false, is_archived:false, pinned:false, linked_task_ids:[] }).select().single(); if(error)throw new Error(error.message); return data as Note; }
export async function updateNote(id:string,updates:Partial<Note>):Promise<Note> { const { data,error }=await supabase.from('notes').update({ ...updates, updated_at:new Date().toISOString() }).eq('id',id).select().single(); if(error)throw new Error(error.message); return data as Note; }
export async function deleteNote(id:string):Promise<void> { const { error }=await supabase.from('notes').delete().eq('id',id); if(error)throw new Error(error.message); }
export async function fetchFolders(uid:string):Promise<NoteFolder[]> { const { data,error }=await supabase.from('note_folders').select('*').eq('user_id',uid).order('position',{ascending:true}); if(error)throw new Error(error.message); return data as NoteFolder[]; }
export async function createFolder(uid:string,name:string,color?:string,icon?:string):Promise<NoteFolder> {
  const { data:ex }=await supabase.from('note_folders').select('position').eq('user_id',uid).order('position',{ascending:false}).limit(1).single();
  const { data,error }=await supabase.from('note_folders').insert({ user_id:uid, name, color:color??null, icon:icon??null, position:(ex?.position??-1)+1 }).select().single();
  if(error)throw new Error(error.message); return data as NoteFolder;
}
export async function deleteFolder(id:string):Promise<void> { const { error }=await supabase.from('note_folders').delete().eq('id',id); if(error)throw new Error(error.message); }
