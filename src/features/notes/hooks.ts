import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { fetchNotes,fetchNote,searchNotes,createNote,updateNote,deleteNote,fetchFolders,createFolder,deleteFolder } from './api';
import type { Note } from '../../types';
export const NOTES_KEY='notes', FOLDERS_KEY='note_folders';
export const useNotes=(folderId?:string|null)=>{ const uid=useAuthStore(s=>s.user?.id); return useQuery({ queryKey:[NOTES_KEY,uid,folderId??'all'], queryFn:()=>fetchNotes(uid!,folderId), enabled:Boolean(uid), staleTime:30_000 }); };
export const useNote=(id:string)=>useQuery({ queryKey:[NOTES_KEY,id], queryFn:()=>fetchNote(id), enabled:Boolean(id) });
export const useSearchNotes=(q:string)=>{ const uid=useAuthStore(s=>s.user?.id); return useQuery({ queryKey:[NOTES_KEY,'search',uid,q], queryFn:()=>searchNotes(uid!,q), enabled:Boolean(uid)&&q.length>1 }); };
export const useFolders=()=>{ const uid=useAuthStore(s=>s.user?.id); return useQuery({ queryKey:[FOLDERS_KEY,uid], queryFn:()=>fetchFolders(uid!), enabled:Boolean(uid) }); };
export function useCreateNote(){ const uid=useAuthStore(s=>s.user?.id); const qc=useQueryClient(); return useMutation({ mutationFn:(v:Partial<Note>)=>createNote(uid!,v), onSuccess:()=>qc.invalidateQueries({queryKey:[NOTES_KEY]}) }); }
export function useUpdateNote(){ const qc=useQueryClient(); return useMutation({ mutationFn:({id,updates}:{id:string;updates:Partial<Note>})=>updateNote(id,updates), onSuccess:(n)=>{ qc.setQueryData([NOTES_KEY,n.id],n); qc.invalidateQueries({queryKey:[NOTES_KEY]}); } }); }
export function useDeleteNote(){ const qc=useQueryClient(); return useMutation({ mutationFn:deleteNote, onSuccess:()=>qc.invalidateQueries({queryKey:[NOTES_KEY]}) }); }
export function useCreateFolder(){ const uid=useAuthStore(s=>s.user?.id); const qc=useQueryClient(); return useMutation({ mutationFn:({name,color,icon}:{name:string;color?:string;icon?:string})=>createFolder(uid!,name,color,icon), onSuccess:()=>qc.invalidateQueries({queryKey:[FOLDERS_KEY]}) }); }
