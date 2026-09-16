import { useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "../lib/auth";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      </form>
    </div>
  );
}
