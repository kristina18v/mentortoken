"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

function BrandIcon() {
  return <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 3 29 10.5v15L16 33 3 25.5v-15L16 3Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m3 10.5 8 4.5m10 0 8-4.5M16 23v10" stroke="currentColor" strokeWidth="3" /><circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="3" /></svg>;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("startup");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const mentor = role === "mentor";
  const passwordChecks = [
    { text: `Password Strength: ${password.length >= 8 && /[\d\W_]/.test(password) ? "Strong" : "Weak"}`, met: password.length >= 8 && /[\d\W_]/.test(password) },
    { text: "Cannot contain your name or email address", met: Boolean(password) && ![name, surname, email.split("@")[0]].filter((value) => value.length >= 3).some((value) => password.toLowerCase().includes(value.toLowerCase())) },
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "Contains a number or symbol", met: /[\d\W_]/.test(password) },
  ];

  async function handleRegister(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, surname, email, password, role }),
      });
      const data = await response.json().catch(() => null);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        setMessage(
          `The registration service is unavailable (HTTP ${response.status}). Please try again later.`
        );
        return;
      }
      if (!response.ok) {
        setMessage(
          typeof data.message === "string"
            ? data.message
            : "Registration failed. Please try again."
        );
        return;
      }
      router.push("/auth/login");
    } catch {
      setMessage("Unable to reach the registration service. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} ${mentor ? styles.mentor : styles.startup}`} data-role={role}>
      <aside className={styles.visual} aria-label="Mentor Token">
        <div className={styles.pitch}><h2>GROW<br />YOUR<br />STARTUP!</h2><p>MONITORING AND EVALUATING NOW IS EASY!</p></div>
        <div className={styles.rocket} aria-hidden="true" />
        <div className={styles.brand}><Link href="/"><BrandIcon /><span>Mentor Token</span></Link><span>mentortoken.com</span></div>
      </aside>
      <section className={styles.panel} aria-labelledby="register-title">
        <div className={styles.content}>
          <Link className={styles.logo} href="/" aria-label="Mentor Token home"><BrandIcon /></Link>
          <h1 id="register-title">{mentor ? "SETUP MENTOR ACCOUNT" : "CHOOSE ACCOUNT TYPE"}</h1>
          <fieldset className={styles.roles} disabled={loading}>
            <legend className={styles.srOnly}>Choose account type</legend>
            <button type="button" className={!mentor ? styles.activeRole : ""} aria-pressed={!mentor} onClick={() => setRole("startup")}>Startup</button>
            <button type="button" className={mentor ? styles.activeRole : ""} aria-pressed={mentor} onClick={() => setRole("mentor")}>Mentor</button>
          </fieldset>
          {mentor && <div className={styles.profile} aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="24" cy="16" r="6" /><path d="M13 36v-4a7 7 0 0 1 7-7h8a7 7 0 0 1 7 7v4" /></svg><span className={styles.camera}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 6l2-2h4l2 2h3a2 2 0 0 1 2 2v10H3V8a2 2 0 0 1 2-2Z" /><circle cx="12" cy="12" r="4" /></svg></span></div>}
          <form className={styles.form} onSubmit={handleRegister} aria-busy={loading}>
            <div className={styles.nameRow}>
              <div><label className={styles.srOnly} htmlFor="register-name">Name</label><input id="register-name" name="name" type="text" autoComplete="given-name" placeholder={mentor ? "Mentor name" : "Name"} value={name} onChange={(event) => setName(event.target.value)} required disabled={loading} /></div>
              <div><label className={styles.srOnly} htmlFor="register-surname">Surname</label><input id="register-surname" name="surname" type="text" autoComplete="family-name" placeholder="Surname" value={surname} onChange={(event) => setSurname(event.target.value)} required disabled={loading} /></div>
            </div>
            <div className={styles.emailField}><label htmlFor="register-email">Email</label><input id="register-email" name="email" type="email" autoComplete="email" placeholder="mentortoken@mail.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} /></div>
            <div className={styles.passwordField}><label htmlFor="register-password">Password</label><input id="register-password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required disabled={loading} aria-describedby={!mentor ? "password-guidance" : undefined} /></div>
            {!mentor && <ul id="password-guidance" className={styles.passwordGuidance}>{passwordChecks.map(({ text, met }) => <li key={text} className={met ? styles.met : ""}><span aria-hidden="true">✓</span>{text}</li>)}</ul>}
            {message && <p className={styles.error} role="alert">{message}</p>}
            <button className={styles.submit} type="submit" disabled={loading}>{loading ? "Creating account…" : mentor ? "Register" : "Continue"}</button>
            {mentor && <p className={styles.terms}>By signing up to create an account I accept Company&apos;s <span>Terms of use &amp; Privacy Policy.</span></p>}
          </form>
          <p className={styles.switch}>Already have account? <Link href="/auth/login">Login.</Link></p>
        </div>
      </section>
    </main>
  );
}
