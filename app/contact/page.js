"use client";

import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function Contact() {
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const submitting = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = Object.fromEntries(["name", "email", "message", "website"].map((field) => [field, String(data.get(field) || "").trim()]));
    const nextErrors = {};
    if (values.name.length < 2 || values.name.length > 100 || /[\u0000-\u001f\u007f]/.test(values.name)) nextErrors.name = "Enter your full name (2–100 characters).";
    if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (values.message.length < 10 || values.message.length > 5000) nextErrors.message = "Enter a message between 10 and 5,000 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus({ type: "error", message: "Please check the highlighted fields." });
      form.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }

    submitting.current = true;
    setStatus({ type: "loading", message: "" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setErrors(result.errors || {});
        setStatus({ type: "error", message: result.message || "We couldn’t send your message. Please try again." });
        const firstField = ["name", "email", "message"].find((field) => result.errors?.[field]);
        if (firstField) form.elements.namedItem(firstField)?.focus();
        return;
      }
      form.reset();
      setStatus({ type: "success", message: result.message });
    } catch {
      setStatus({ type: "error", message: "We couldn’t confirm your submission. Please check your connection and try again, or email info@mentortoken.com." });
    } finally {
      submitting.current = false;
    }
  }

  function clearFieldError(event) {
    const field = event.target.name;
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (status.type !== "loading") setStatus({ type: "idle", message: "" });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}><Navbar /></header>
      <main className={styles.main}>
        <section className={styles.contact} aria-labelledby="contact-heading">
          <div className={styles.intro}>
            <h1 id="contact-heading">Let&apos;s Talk!</h1>
            <p>We&apos;re thrilled to connect with you! Whether you have a question, need assistance, or want to discuss a potential project, we&apos;re here to listen and help. At Mentor Token, we believe in the power of collaboration and are committed to providing you with the best support and solutions. Fill out the form below, and one of our team members will get back to you as soon as possible.<br /><strong>Let&apos;s create something amazing together!</strong></p>
          </div>
          <form className={styles.form} onSubmit={handleSubmit} onInput={clearFieldError} noValidate aria-busy={status.type === "loading"}>
            <div className={styles.inputRow}>
              <div className={styles.field}>
                <label className={styles.srOnly} htmlFor="contact-name">Full Name</label>
                <input id="contact-name" name="name" type="text" placeholder="Full Name" autoComplete="name" required minLength={2} maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} />
                {errors.name && <p id="contact-name-error" className={styles.fieldError}>{errors.name}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.srOnly} htmlFor="contact-email">Email Address</label>
                <input id="contact-email" name="email" type="email" placeholder="Email address" autoComplete="email" required maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} />
                {errors.email && <p id="contact-email-error" className={styles.fieldError}>{errors.email}</p>}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.srOnly} htmlFor="contact-message">Your Message</label>
              <textarea id="contact-message" name="message" placeholder="Your message" required minLength={10} maxLength={5000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined} />
              {errors.message && <p id="contact-message-error" className={styles.fieldError}>{errors.message}</p>}
            </div>
            <div className={styles.honeypot} aria-hidden="true"><label htmlFor="contact-website">Leave this field empty</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></div>
            <div className={styles.submitRow}>
              <div className={status.type === "success" ? styles.success : styles.formError} role="status" aria-live="polite" aria-atomic="true">{status.message}</div>
              <button type="submit" disabled={status.type === "loading"}>{status.type === "loading" ? "Sending…" : "Send Message"}</button>
            </div>
          </form>
        </section>
      </main>
      <div className={styles.footer}><Footer /></div>
    </div>
  );
}
