import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Role, UserProfile } from "../types";

/**
 * supabase.functions.invoke() only gives a generic "non-2xx status code"
 * message on failure -- the actual { error: "..." } body our function
 * returns is on the raw Response in FunctionsHttpError.context. Unwrap it
 * so the UI can show the real reason (e.g. "email rate limit exceeded").
 */
async function invokeManageUser(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("manage-user", { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const parsed = await error.context
        .clone()
        .json()
        .catch(() => null);
      if (parsed?.error) throw new Error(parsed.error);
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? undefined,
    role: row.role as Role,
    createdAt: row.created_at as string,
    lastSignInAt: (row.last_sign_in_at as string) ?? undefined,
  }));
}

export async function updateUserProfile(id: string, patch: { name?: string; role?: Role }): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ name: patch.name, role: patch.role })
    .eq("id", id);
  if (error) throw error;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role: Role;
}

export async function createUserAccount(input: CreateUserInput): Promise<void> {
  await invokeManageUser({
    action: "create",
    email: input.email,
    password: input.password,
    name: input.name,
    role: input.role,
  });
}

export async function deleteUser(id: string): Promise<void> {
  await invokeManageUser({ action: "delete", userId: id });
}
