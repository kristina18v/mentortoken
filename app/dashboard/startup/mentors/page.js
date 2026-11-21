
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function StartupMentorsPage() {
  const router = useRouter();
  const [mentors, setMentors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const authResponse = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (authResponse.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!authResponse.ok) {
          throw new Error("Session verification failed");
        }

        const authData = await authResponse.json();
        const user =
          authData.data?.user ||
          authData.user ||
          authData.data ||
          authData;

        if (user.role !== "startup") {
          router.replace("/dashboard");
          return;
        }

        const [mentorsResponse, jobsResponse] =
          await Promise.all([
            fetch("/api/mentors", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/jobs?scope=mine", {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        const mentorsData = await mentorsResponse.json();
        const jobsData = await jobsResponse.json();

        if (!mentorsResponse.ok || !jobsResponse.ok) {
          throw new Error("Failed to load mentors data");
        }

        if (!cancelled) {
          setMentors(
            Array.isArray(mentorsData.mentors)
              ? mentorsData.mentors
              : []
          );
          setJobs(
            Array.isArray(jobsData.jobs) ? jobsData.jobs : []
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredMentors = mentors.filter((mentor) => {
    const name = `${mentor.name || ""} ${mentor.surname || ""}`;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const assignedJobs = jobs.filter(
    (job) => job.mentorId && job.status !== "open"
  );

  const completedJobs = jobs.filter(
    (job) => job.status === "completed"
  );

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <svg className={styles.brandIcon} viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 3 29 10.5v15L16 33 3 25.5v-15Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="m3 10.5 8 4.5m10 0 8-4.5M16 24v9" stroke="currentColor" strokeWidth="3" /><circle cx="16" cy="18" r="6" stroke="currentColor" strokeWidth="3" /></svg>
          <span>Mentor Token</span>
        </div>
        <nav className={styles.navigation}>
          <Link href="/dashboard/startup"><span className={styles.dashboardIcon} aria-hidden="true" />Dashboard</Link>
          <Link href="/dashboard/startup/mentors" className={styles.activeLink}><span className={styles.mentorsIcon} aria-hidden="true" />Mentors</Link>
          <Link href="/dashboard/startup/jobs"><span className={styles.jobsIcon} aria-hidden="true" />Jobs</Link>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.pageIntro}>
            <h1>Mentors</h1>
            <p>Explore mentors and manage your job offers.</p>
          </div>
          <div className={styles.searchBox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="8.5" /><path d="m17 17 5 5" /></svg>
            <input type="search" placeholder="Search Mentor..." value={search} onChange={(event) => setSearch(event.target.value)} className={styles.searchInput} />
          </div>
        </header>

        {error && <p className={styles.error} role="alert">{error}</p>}

        {loading ? (
          <p className={styles.loading}>Loading mentors...</p>
        ) : (
          <div className={styles.content}>
            <section className={styles.mentorList}>
              {filteredMentors.length === 0 && <p className={styles.empty}>No mentors found.</p>}
              {filteredMentors.map((mentor) => (
                <article key={mentor._id} className={styles.mentorCard}>
                  {mentor.avatar ? (
                    <img src={mentor.avatar} alt="" className={styles.avatar} />
                  ) : (
                    <div className={`${styles.avatar} ${styles.initial}`}>{mentor.name?.charAt(0)}</div>
                  )}
                  <div className={styles.mentorInfo}>
                    <h3>{mentor.name} {mentor.surname}</h3>
                    {(Array.isArray(mentor.skills) ? mentor.skills.some((skill) => typeof skill === "string" && skill.trim()) : typeof mentor.skills === "string" && mentor.skills.trim()) && (
                      <p className={styles.skills}><span>Skills:</span> {Array.isArray(mentor.skills) ? mentor.skills.filter((skill) => typeof skill === "string" && skill.trim()).join(" | ") : mentor.skills}</p>
                    )}
                    <p className={styles.bio}>{mentor.bio || "No biography added yet."}</p>
                  </div>
                  <Link href={`/dashboard/startup/mentors/${mentor._id}`} className={styles.viewButton}>View Mentor</Link>
                </article>
              ))}
            </section>

            <aside className={styles.overview}>
              <h2>Quick Overview</h2>
              <p className={styles.overviewSubtitle}>Based on current data</p>
              {[
                ["Total Mentors", mentors.length],
                ["Total Assigned Jobs", assignedJobs.length],
                ["Finished Jobs", completedJobs.length],
              ].map(([label, value]) => (
                <div key={label} className={styles.overviewCard}>
                  <p>{label}</p>
                  <strong>{value}</strong>
                </div>
              ))}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
