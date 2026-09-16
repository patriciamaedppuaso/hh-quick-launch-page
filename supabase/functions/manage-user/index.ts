// Handles the two account operations that require the Supabase service role
// key (create + delete) and therefore can never run in the browser. Deploy
// with `supabase functions deploy manage-user --no-verify-jwt` -- JWT
// verification is off because the dashboard doesn't have real login sessions
// yet (see the security note in supabase/migrations/0001_init.sql).
//
// Accounts are created directly with an admin-set temporary password
// (email_confirm: true) rather than emailed an invite, so this has no
// dependency on Supabase's SMTP/email setup at all.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const action = body.action;
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (action === "create") {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email) return jsonResponse({ error: "Email is required." }, 400);
    if (!password || password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters." }, 400);
    }
    const role = body.role === "admin" ? "admin" : "employee";
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, name },
    });
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ user: data.user });
  }

  if (action === "delete") {
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!userId) return jsonResponse({ error: "userId is required." }, 400);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: `Unknown action: ${String(action)}` }, 400);
});
