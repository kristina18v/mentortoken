
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function MentorDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [mentor, setMentor] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showOffer, setShowOffer] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDetails() {
    const [mentorResponse, offersResponse] = await Promise.all([
      fetch(`/api/mentors/${id}`, {
        credentials: "include",
        cache: "no-store",
      }),
      fetch(`/api/job-offers?mentorId=${id}`, {
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    if (mentorResponse.status === 401) {
      router.replace("/auth/login");
      return;
    }

    const mentorData = await mentorResponse.json();
    const offersData = await offersResponse.json();

    if (!mentorResponse.ok || !offersResponse.ok) {
      throw new Error(
        mentorData.message ||
        offersData.message ||
        "Failed to load mentor details"
      );
    }

    setMentor(mentorData.mentor);
    setJobs(mentorData.jobs || []);
    setOffers(offersData.offers || []);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        await loadDetails();
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function sendOffer(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/job-offers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: id,
          title,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send offer");
      }

      setShowOffer(false);
      setTitle("");
      setDescription("");
      setMessage("Job offer sent successfully.");
      await loadDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelOffer(offerId) {
    if (!window.confirm("Cancel this job offer?")) return;

    try {
      const response = await fetch(
        `/api/job-offers/${offerId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "canceled" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel offer");
      }

      setMessage("Offer canceled.");
      await loadDetails();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredJobs = jobs.filter(
    (job) =>
      filter === "all" ||
      (filter === "done" && job.status === "completed") ||
      (filter === "progress" && job.status === "assigned")
  );

  if (loading) return <p className={styles.loadingState}>Loading mentor...</p>;
  if (!mentor) return <p className={styles.loadingState}>{error || "Mentor not found."}</p>;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <svg className={styles.brandIcon} viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 3 29 10.5v15L16 33 3 25.5v-15Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m3 10.5 8 4.5m10 0 8-4.5M16 24v9" stroke="currentColor" strokeWidth="3" /><circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="3" /></svg>
          <span>Mentor Token</span>
        </div>
        <nav className={styles.navigation}>
          <Link href="/dashboard/startup/mentors" className={styles.backLink}>← Back to Mentors</Link>
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.profileLayout}>
          <section className={styles.profileCard}>
            {mentor.avatar ? (
              <img src={mentor.avatar} alt="" width={100} height={100} className={styles.profileAvatar} />
            ) : (
              <div className={`${styles.profileAvatar} ${styles.initial}`} aria-hidden="true">{mentor.name?.charAt(0)}</div>
            )}
            <h2>{mentor.name} {mentor.surname}</h2>
            {typeof mentor.role === "string" && <p className={styles.role}>{mentor.role}</p>}
            <p className={styles.email}>{mentor.email}</p>
            {(typeof mentor.phone === "string" || typeof mentor.phone === "number") && mentor.phone && <p className={styles.phone}>{mentor.phone}</p>}
          </section>

          <section className={styles.aboutCard}>
            <h2>About Mentor</h2>
            {(Array.isArray(mentor.skills) ? mentor.skills.some((skill) => typeof skill === "string" && skill.trim()) : typeof mentor.skills === "string" && mentor.skills.trim()) && (
              <div className={styles.skills}>
                <h3>Skills</h3>
                <div className={styles.skillList}>
                  {Array.isArray(mentor.skills) ? mentor.skills.filter((skill) => typeof skill === "string" && skill.trim()).map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>) : <span>{mentor.skills}</span>}
                </div>
              </div>
            )}
            <p className={styles.biography}>{mentor.bio || "No biography added yet."}</p>
            <button onClick={() => setShowOffer(true)} className={styles.offerButton}>+ Offer New Job</button>
          </section>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={styles.success} role="status">{message}</p>}

        <div className={styles.jobsLayout}>
          <section className={styles.assignedSection}>
            <h2>Assigned Jobs</h2>
            <div className={styles.tabs}>
              {["all", "done", "progress"].map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={filter === item ? styles.activeTab : undefined}>
                  {item === "progress" ? "In Progress" : item === "done" ? "Done" : "All"}
                </button>
              ))}
            </div>
            {filteredJobs.length === 0 && <p className={styles.empty}>No assigned jobs found.</p>}
            {filteredJobs.map((job) => (
              <div key={job._id} className={styles.jobRow}>
                <strong>{job.title}</strong>
                <p className={`${styles.status} ${job.status === "completed" ? styles.done : styles.inProgress}`}>
                  {job.status === "completed" ? "DONE" : job.status === "assigned" ? "IN PROGRESS" : "OPEN"}
                </p>
              </div>
            ))}
          </section>

          <section className={styles.offersSection}>
            <h2>Pending Job Offers</h2>
            {offers.filter((offer) => offer.status === "pending").length === 0 && <p className={styles.empty}>No pending offers.</p>}
            {offers.filter((offer) => offer.status === "pending").map((offer) => (
              <div key={offer._id} className={styles.offerRow}>
                <span>{offer.title}</span>
                <button onClick={() => cancelOffer(offer._id)} className={styles.cancelButton}>Cancel Offer</button>
              </div>
            ))}
          </section>
        </div>

        {showOffer && (
          <div className={styles.modalOverlay}>
            <section role="dialog" aria-modal="true" aria-labelledby="offer-title" className={styles.modal}>
              <button onClick={() => setShowOffer(false)} disabled={saving} className={styles.closeButton} aria-label="Close job offer">×</button>
              <h2 id="offer-title">OFFER JOB</h2>
              <p className={styles.modalSubtitle}>Create and offer job to a mentor</p>
              <form onSubmit={sendOffer} className={styles.offerForm}>
                <label className={styles.nameField}>
                  <span>Job Name</span>
                  <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label className={styles.descriptionField}>
                  <span>Short Description</span>
                  <textarea required maxLength={2000} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <button type="submit" disabled={saving} className={styles.submitButton}>{saving ? "Sending..." : "Send Job Offer"}</button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
