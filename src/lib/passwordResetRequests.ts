import { supabase } from "./supabaseClient";
import type { PasswordResetRequest } from "../types";

export async function submitPasswordResetRequest(email: string, note?: string): Promise<void> {
  const { error } = await supabase.from("password_reset_requests").insert({
    email: email.trim(),
    note: note?.trim() || null,
  });
  if (error) throw error;
}

export async function fetchPasswordResetRequests(): Promise<PasswordResetRequest[]> {
  const { data, error } = await supabase
    .from("password_reset_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    note: (row.note as string) ?? undefined,
    status: row.status as PasswordResetRequest["status"],
    createdAt: row.created_at as string,
    resolvedAt: (row.resolved_at as string) ?? undefined,
  }));
}

export async function resolvePasswordResetRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from("password_reset_requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function dismissPasswordResetRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from("password_reset_requests")
    .update({ status: "dismissed", resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
