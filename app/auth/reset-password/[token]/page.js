"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import auth from "../../login/page.module.css";
import styles from "./page.module.css";

function BrandIcon() {
  return <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 3 29 10.5v15L16 33 3 25.5v-15L16 3Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m3 10.5 8 4.5m10 0 8-4.5M16 23v10" stroke="currentColor" strokeWidth="3" /><circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="3" /></svg>;
}

export default function ResetPasswordPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const validToken = /^[a-f0-9]{64}$/.test(token);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const submitting = useRef(false);
  const strength = !password ? "empty" : password.length < 8 ? "weak" : password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[\d\W_]/.test(password) ? "strong" : "good";

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current || success) return;
    if (!validToken) { setFeedback({ type: "error", message: "This reset link is invalid. Please request a new link." }); return; }
    if (password.length < 8) { setFeedback({ type: "error", message: "Your password must contain at least 8 characters." }); return; }
    if (password !== confirmPassword) { setFeedback({ type: "error", message: "The passwords do not match." }); return; }
    submitting.current = true;
    setLoading(true);
    setFeedback({ type: "idle", message: "" });
    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await response.json().catch(() => null);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        setFeedback({ type: "error", message: "The password reset service is unavailable. Please try again later." });
      } else if (!response.ok || data.ok !== true) {
        setFeedback({ type: "error", message: typeof data.message === "string" ? data.message : "We couldn’t reset your password. Please try again." });
      } else {
        setFeedback({ type: "success", message: data.message });
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");
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
      <section className={`${auth.panel} ${styles.panel}`} aria-labelledby="reset-title">
        <div className={auth.content}>
          <Link className={auth.logo} href="/" aria-label="Mentor Token home"><BrandIcon /></Link>
          <h1 className={styles.title} id="reset-title">{success ? "You’re All Set!" : "Create New Password"}</h1>
          {success ? <div className={styles.successPanel} role="status"><span className={styles.successIcon} aria-hidden="true">✓</span><h2>Password Reset Successfully</h2><p>{feedback.message}</p><Link className={`${auth.submit} ${styles.loginButton}`} href="/auth/login">Back to Login</Link></div> : !validToken ? <div className={`${styles.notice} ${styles.error}`} role="alert"><p>This reset link is invalid. Please <Link href="/auth/forgot-password">request a new link</Link>.</p></div> : <>
            <p className={styles.description}>Choose a new password to keep your Mentor Token account secure.</p>
            <form className={`${auth.form} ${styles.form}`} onSubmit={handleSubmit} noValidate aria-busy={loading}>
              <div className={styles.field}>
                <label htmlFor="reset-password">New Password</label>
                <div className={styles.passwordInput}><input id="reset-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required disabled={loading} aria-describedby="password-guidance" /><button className={styles.toggle} type="button" aria-label={showPassword ? "Hide passwords" : "Show passwords"} aria-pressed={showPassword} aria-controls="reset-password reset-confirm-password" onClick={() => setShowPassword((current) => !current)} disabled={loading}>{showPassword ? "Hide" : "Show"}</button></div>
              </div>
              <div className={styles.guidance} id="password-guidance"><div className={styles.strength} data-strength={strength} aria-hidden="true"><span /></div><p>{strength === "empty" ? "Use at least 8 characters." : `Password strength: ${strength}.`}</p><p>A longer mix of letters, numbers and symbols is harder to guess.</p></div>
              <div className={styles.field}><label htmlFor="reset-confirm-password">Confirm Password</label><input id="reset-confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required disabled={loading} /></div>
              {feedback.message && <div className={`${styles.notice} ${styles.error}`} role="alert"><p>{feedback.message}</p><Link href="/auth/forgot-password">Request a new reset link</Link></div>}
              <button className={`${auth.submit} ${styles.submit}`} type="submit" disabled={loading}>{loading ? "Resetting password…" : "Reset Password"}</button>
            </form>
          </>}
          {!success && <p className={styles.back}><Link href="/auth/login">Back to Login</Link></p>}
        </div>
      </section>
    </main>
  );
}
