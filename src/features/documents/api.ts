import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../lib/supabase/client';
import type { Document, DocumentCategory } from '../../types';

export async function fetchDocuments(uid: string, category?: DocumentCategory): Promise<Document[]> {
  let q = supabase.from('documents').select('*').eq('user_id', uid).order('created_at', { ascending: false });
  if (category && category !== 'other') {
    q = q.eq('category', category);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as Document[];
}

export async function fetchDocument(id: string): Promise<Document> {
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as Document;
}

export async function uploadAvatarImage(uid: string, localUri: string): Promise<string> {
  let fileData: ArrayBuffer | Blob;
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    fileData = bytes.buffer;
  } catch {
    const res = await fetch(localUri);
    fileData = await res.blob();
  }

  const cleanUid = uid.replace(/[^a-zA-Z0-9-]/g, '');
  const filePath = `${cleanUid}/avatar_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from('documents')
    .upload(filePath, fileData, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadDocumentFile(
  uid: string,
  localUri: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${uid}/${Date.now()}_${cleanName}`;
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('documents')
    .upload(path, blob, {
      contentType: mimeType || 'application/octet-stream',
      upsert: true
    });

  if (error) throw new Error(error.message);
  return path;
}

export async function getDocumentDownloadUrl(storagePath: string): Promise<string> {
  const { data: signedData, error: signedError } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600);

  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath);

  return publicData.publicUrl;
}

export async function createDocument(
  uid: string,
  values: {
    title: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    category: DocumentCategory;
    tags?: string[];
    description?: string | null;
  }
): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: uid,
      title: values.title,
      file_name: values.file_name,
      file_size: values.file_size,
      mime_type: values.mime_type,
      storage_path: values.storage_path,
      category: values.category,
      tags: values.tags ?? [],
      description: values.description ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Document;
}

export async function deleteDocument(id: string): Promise<void> {
  // Retrieve document to delete file from storage too
  try {
    const { data } = await supabase.from('documents').select('storage_path').eq('id', id).single();
    if (data?.storage_path) {
      await supabase.storage.from('documents').remove([data.storage_path]);
    }
  } catch {}

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
