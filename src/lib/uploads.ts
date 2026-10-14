import { supabase } from "./supabaseClient";
import { newId } from "../utils";

const BUCKET = "uploads";

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i);
}

/** Uploads a file to the shared public bucket under `folder/` and returns its public URL. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const path = `${folder}/${newId("f")}${extFromName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort cleanup for a file previously returned by uploadFile -- failures are swallowed. */
export async function deleteUploadedFile(url: string | undefined): Promise<void> {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const path = decodeURIComponent(url.slice(i + marker.length));
  await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
}
