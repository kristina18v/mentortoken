"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

function BrandIcon() {
  return <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 3 29 10.5v15L16 33 3 25.5v-15L16 3Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m3 10.5 8 4.5m10 0 8-4.5M16 23v10" stroke="currentColor" strokeWidth="3" /><circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="3" /></svg>;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleLogin(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => null);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        setMessage(
          `The login service is unavailable (HTTP ${response.status}). Please try again later.`
        );
        return;
      }
      if (!response.ok) {
        setMessage(
          typeof data.message === "string" ? data.message : "Login failed. Please try again."
        );
        return;
      }
      const role = data.data?.user?.role;
      if (role === "mentor") {
        router.push("/dashboard/mentor");
      } else if (role === "startup") {
        router.push("/dashboard/startup");
      } else {
        setMessage("The login response was incomplete. Please try again.");
      }
    } catch {
      setMessage("We couldn’t log you in. Please try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <aside className={styles.visual} aria-label="Mentor Token">
        <div className={styles.pitch}><h2>GROW<br />YOUR<br />STARTUP!</h2><p>MONITORING AND EVALUATING NOW IS EASY!</p></div>
        <div className={styles.rocket} aria-hidden="true" />
        <div className={styles.brand}><Link href="/"><BrandIcon /><span>Mentor Token</span></Link><span>mentortoken.com</span></div>
      </aside>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.content}>
          <Link className={styles.logo} href="/" aria-label="Mentor Token home"><BrandIcon /></Link>
          <h1 id="login-title">LOG IN TO MENTOR TOKEN</h1>
          <p className={styles.subtitle}>Enter your email and pass to login.</p>
          <form className={styles.form} onSubmit={handleLogin} aria-busy={loading}>
            <div className={styles.emailField}><label htmlFor="login-email">Email</label><input id="login-email" name="email" type="email" autoComplete="email" placeholder="mentortoken@mail.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} /></div>
            <div className={styles.passwordField}><label className={styles.srOnly} htmlFor="login-password">Password</label><input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} /></div>
            <Link className={styles.forgot} href="/auth/forgot-password">Forgot password?</Link>
            {message && <p className={styles.error} role="alert">{message}</p>}
            <button className={styles.submit} type="submit" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
          </form>
          <p className={styles.switch}>Don&apos;t have account? <Link href="/auth/register">Register.</Link></p>
        </div>
      </section>
    </main>
  );
}
