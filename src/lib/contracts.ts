import { supabase } from "./supabaseClient";
import type { ContractField, ContractTemplate, ServiceContractRecord } from "../types";
import { newId, newShareToken } from "../utils";

function rowToTemplate(row: Record<string, unknown>): ContractTemplate {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    fields: (row.fields as ContractField[] | null) ?? [],
    updatedAt: (row.updated_at as string) ?? undefined,
  };
}

function rowToContract(row: Record<string, unknown>): ServiceContractRecord {
  return {
    id: row.id as string,
    templateId: row.template_id as string,
    shareToken: row.share_token as string,
    internalLabel: (row.internal_label as string) ?? undefined,
    status: row.status as ServiceContractRecord["status"],
    fieldValues: (row.field_values as Record<string, string> | null) ?? {},
    agreed: (row.agreed as boolean) ?? undefined,
    signatureDataUrl: (row.signature_data_url as string) ?? undefined,
    signedAt: (row.signed_at as string) ?? undefined,
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string) ?? undefined,
  };
}

/** Replaces {{key}} tokens in a template body with field_values, or a blank for anything unfilled. */
export function fillTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = values[key];
    return v && v.trim() ? v : "_____________";
  });
}

export interface ParsedParagraph {
  centered: boolean;
  twoColumn: boolean;
  indent: number;
  text: string;
}

/** Strips a paragraph's leading layout markers: ^^ centers it, ## makes it a two-column
 * block (each \n-separated line split on " | " into left/right, for side-by-side signature
 * blocks -- justified text-align collapses literal whitespace padding, so that doesn't work),
 * and each leading tab is one indent level -- all conventions for matching a source
 * document's layout (see migrations 0048/0049/0050). */
export function parseParagraph(raw: string): ParsedParagraph {
  let text = raw;
  let centered = false;
  let twoColumn = false;
  if (text.startsWith("^^")) {
    centered = true;
    text = text.slice(2);
  } else if (text.startsWith("##")) {
    twoColumn = true;
    text = text.slice(2);
  }
  let indent = 0;
  while (text.startsWith("\t")) {
    indent++;
    text = text.slice(1);
  }
  return { centered, twoColumn, indent, text };
}

/** Whether a paragraph starts with a list marker (A., i., 1., etc.) worth a hanging indent. */
export function startsWithListMarker(text: string): boolean {
  const probe = text.replace(/^\*{1,2}/, "");
  return /^\w{1,5}\.\s/.test(probe);
}

export type RichSegment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "token"; key: string };

const RICH_RE = /(\{\{\w+\}\}|\*\*[^*]+\*\*|\*[^*]+\*)/g;

/** Splits template text into plain/bold/italic/{{token}} segments -- **bold**, *italic*,
 * same convention as basic markdown, so templates can match the source document's formatting. */
export function splitRichText(text: string): RichSegment[] {
  return text
    .split(RICH_RE)
    .filter((part) => part !== "")
    .map((part): RichSegment => {
      const tokenMatch = part.match(/^\{\{(\w+)\}\}$/);
      if (tokenMatch) return { type: "token", key: tokenMatch[1] };
      if (part.startsWith("**") && part.endsWith("**")) return { type: "bold", value: part.slice(2, -2) };
      if (part.startsWith("*") && part.endsWith("*")) return { type: "italic", value: part.slice(1, -1) };
      return { type: "text", value: part };
    });
}

// ===== Staff-side (authenticated) =====

export async function fetchTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await supabase.from("contract_templates").select("*").order("title");
  if (error) throw error;
  return (data ?? []).map(rowToTemplate);
}

export async function saveTemplate(id: string, title: string, body: string, fields: ContractField[]): Promise<void> {
  const { error } = await supabase
    .from("contract_templates")
    .update({ title, body, fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchContracts(): Promise<ServiceContractRecord[]> {
  const { data, error } = await supabase
    .from("service_contracts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToContract);
}

export async function createContract(
  templateId: string,
  internalLabel: string | undefined,
  createdBy: string,
): Promise<ServiceContractRecord> {
  const row = {
    id: newId("contract"),
    template_id: templateId,
    share_token: newShareToken(),
    internal_label: internalLabel || null,
    status: "pending",
    created_by: createdBy,
  };
  const { data, error } = await supabase.from("service_contracts").insert(row).select().single();
  if (error) throw error;
  return rowToContract(data);
}

export async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase.from("service_contracts").delete().eq("id", id);
  if (error) throw error;
}

/** Lets staff pre-fill a contract's blanks before sharing the link, so the recipient only has to review and sign. */
export async function updateContractFieldValues(id: string, fieldValues: Record<string, string>): Promise<void> {
  const { error } = await supabase.from("service_contracts").update({ field_values: fieldValues }).eq("id", id);
  if (error) throw error;
}

const CONTRACTOR_SIGNATURE_ID = "contractor";

/** H&H's own signature, drawn once and reused on every contract's Contractor block (see {{contractor_signature}}). */
export async function fetchContractorSignature(): Promise<string | null> {
  const { data, error } = await supabase
    .from("company_signatures")
    .select("data_url")
    .eq("id", CONTRACTOR_SIGNATURE_ID)
    .maybeSingle();
  if (error) throw error;
  return (data?.data_url as string | undefined) ?? null;
}

export async function saveContractorSignature(dataUrl: string): Promise<void> {
  const { error } = await supabase
    .from("company_signatures")
    .upsert({ id: CONTRACTOR_SIGNATURE_ID, data_url: dataUrl, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ===== Public (unauthenticated, token-gated via RPC) =====

export async function fetchContractByToken(token: string): Promise<ServiceContractRecord | null> {
  const { data, error } = await supabase.rpc("get_contract_by_token", { p_token: token });
  if (error) throw error;
  if (!data || !(data as Record<string, unknown>).id) return null;
  return rowToContract(data as Record<string, unknown>);
}

export async function fetchTemplateById(id: string): Promise<ContractTemplate> {
  const { data, error } = await supabase.from("contract_templates").select("*").eq("id", id).single();
  if (error) throw error;
  return rowToTemplate(data);
}

export interface ContractSubmission {
  fieldValues: Record<string, string>;
  agreed: boolean;
  signatureDataUrl: string;
}

export async function submitContract(token: string, input: ContractSubmission): Promise<ServiceContractRecord> {
  const { data, error } = await supabase.rpc("submit_contract", {
    p_token: token,
    p_field_values: input.fieldValues,
    p_agreed: input.agreed,
    p_signature_data_url: input.signatureDataUrl,
  });
  if (error) throw error;
  return rowToContract(data as Record<string, unknown>);
}
