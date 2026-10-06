import { useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "../lib/auth";
import { submitPasswordResetRequest } from "../lib/passwordResetRequests";

type Mode = "login" | "forgot" | "sent";

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signIn(email.trim(), password);
      // App.tsx's onAuthStateChange listener picks up the new session from here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in. Check your email and password.");
      setSubmitting(false);
    }
  }

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitPasswordResetRequest(email.trim(), note.trim() || undefined);
      setMode("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "sent") {
    return (
      <div className="login-screen">
        <div className="login-card form-card">
          <img className="login-logo" src="/assets/images/logo/Icon.png" alt="" />
          <h1 className="login-title">Request sent</h1>
          <p className="login-sub">
            An admin will reset your password and reach out to you. You can close this page and try signing in again
            once they do.
          </p>
          <button
            type="button"
            className="btn-primary login-submit"
            onClick={() => {
              setMode("login");
              setNote("");
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="login-screen">
        <form className="login-card form-card" onSubmit={handleRequestReset}>
          <img className="login-logo" src="/assets/images/logo/Icon.png" alt="" />
          <h1 className="login-title">Forgot your password?</h1>
          <p className="login-sub">Let us know and an admin will reset it for you.</p>

          <div className="form-row">
            <label htmlFor="forgotEmail">Email</label>
            <input
              id="forgotEmail"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="forgotNote">Note (optional)</label>
            <textarea
              id="forgotNote"
              rows={3}
              placeholder="Anything that helps an admin reach you"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn-primary login-submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send request"}
          </button>
          <button
            type="button"
            className="btn-secondary login-submit"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            disabled={submitting}
          >
            Back to sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <form className="login-card form-card" onSubmit={handleSubmit}>
        <img className="login-logo" src="/assets/images/logo/Icon.png" alt="" />
        <h1 className="login-title">Quick Launch</h1>
        <p className="login-sub">Sign in to H&amp;H Medical Supply</p>

        <div className="form-row">
          <label htmlFor="loginEmail">Email</label>
          <input
            id="loginEmail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="loginPassword">Password</label>
          <input
            id="loginPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="field-error">{error}</p>}

        <button type="submit" className="btn-primary login-submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          className="login-forgot-link"
          onClick={() => {
            setError("");
            setMode("forgot");
          }}
        >
          Forgot your password?
        </button>
      </form>
    </div>
  );
}
