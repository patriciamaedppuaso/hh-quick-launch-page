import { supabase } from "./supabaseClient";
import type { Role } from "../types";

export interface CurrentUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchCurrentUser(userId: string, email: string): Promise<CurrentUser> {
  const { data, error } = await supabase.from("profiles").select("name, role").eq("id", userId).single();
  if (error) throw error;
  return {
    id: userId,
    email,
    name: (data?.name as string) || undefined,
    role: (data?.role as Role) ?? "employee",
  };
}
