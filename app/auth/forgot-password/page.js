"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import auth from "../login/page.module.css";
import styles from "./page.module.css";

function BrandIcon() {
  return <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 3 29 10.5v15L16 33 3 25.5v-15L16 3Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m3 10.5 8 4.5m10 0 8-4.5M16 23v10" stroke="currentColor" strokeWidth="3" /><circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="3" /></svg>;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFeedback({ type: "error", field: "email", message: "Please enter a valid email address." });
      return;
    }
    submitting.current = true;
    setLoading(true);
    setFeedback({ type: "idle", message: "" });
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json().catch(() => null);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        setFeedback({ type: "error", message: "The password reset service is unavailable. Please try again later." });
      } else if (!response.ok || data.ok !== true) {
        setFeedback({ type: "error", message: typeof data.message === "string" ? data.message : "We couldn’t process your request. Please try again." });
      } else {
        setFeedback({ type: "success", message: data.message });
        setEmail("");
      }
    } catch {
      setFeedback({ type: "error", message: "Unable to connect. Please check your connection and try again." });
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <main className={`${auth.page} ${styles.page}`}>
      <aside className={auth.visual} aria-label="Mentor Token">
        <div className={auth.pitch}><h2>GROW<br />YOUR<br />STARTUP!</h2><p>MONITORING AND EVALUATING NOW IS EASY!</p></div>
        <div className={auth.rocket} aria-hidden="true" />
        <div className={auth.brand}><Link href="/"><BrandIcon /><span>Mentor Token</span></Link><span>mentortoken.com</span></div>
      </aside>
      <section className={`${auth.panel} ${styles.panel}`} aria-labelledby="forgot-title">
        <div className={auth.content}>
          <Link className={auth.logo} href="/" aria-label="Mentor Token home"><BrandIcon /></Link>
          <h1 className={styles.title} id="forgot-title">Forgot Password?</h1>
          <p className={styles.description}>It happens. Enter the email address associated with your account and we’ll help you get back to growing your startup.</p>
          <form className={`${auth.form} ${styles.form}`} onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <div className={auth.emailField}>
              <label htmlFor="forgot-email">Email</label>
              <input id="forgot-email" name="email" type="email" autoComplete="email" placeholder="mentortoken@mail.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} disabled={loading} aria-invalid={feedback.field === "email"} aria-describedby={feedback.message ? "forgot-feedback" : undefined} />
            </div>
            {feedback.message && <div id="forgot-feedback" className={`${styles.notice} ${feedback.type === "success" ? styles.success : styles.error}`} role={feedback.type === "success" ? "status" : "alert"}>{feedback.type === "success" && <span className={styles.check} aria-hidden="true">✓</span>}<p>{feedback.message}</p></div>}
            <button className={`${auth.submit} ${styles.submit}`} type="submit" disabled={loading}>{loading ? "Sending reset link…" : "Send Reset Link"}</button>
          </form>
          <p className={styles.back}><Link href="/auth/login">Back to Login</Link></p>
          <p className={styles.note}>Reset links expire after 15 minutes.</p>
        </div>
      </section>
    </main>
  );
}
