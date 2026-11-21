
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const emptyForm = {
  title: "",
  description: "",
  category: "General",
};

const categories = [
  "General",
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Marketing",
  "Business",
  "Data Analysis",
  "Other",
];

export default function StartupJobsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("mine");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadJobs = useCallback(async (scope) => {
    setJobsLoading(true);

    try {
      const response = await fetch(
        `/api/jobs?scope=${scope}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load jobs");
      }

      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setError("");
    } catch (err) {
      setJobs([]);
      setError(err.message);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not verify session");
        }

        const data = await response.json();
        const currentUser =
          data.data?.user || data.user || data.data || data;

        if (currentUser.role !== "startup") {
          router.replace(
            currentUser.role === "mentor"
              ? "/dashboard/mentor"
              : "/auth/login"
          );
          return;
        }

        setUser(currentUser);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [router]);

 useEffect(() => {
  if (!user) return;

  let cancelled = false;

  async function fetchJobs() {
    try {
      const response = await fetch(
        `/api/jobs?scope=${activeTab}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load jobs");
      }

      if (!cancelled) {
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        setJobs([]);
        setError(err.message);
      }
    } finally {
      if (!cancelled) {
        setJobsLoading(false);
      }
    }
  }

  fetchJobs();

  return () => {
    cancelled = true;
  };
}, [user, activeTab]);
  async function handleCreateJob(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create job"
        );
      }

      setShowForm(false);
      setForm(emptyForm);
      setActiveTab("mine");
      setMessage("Job created successfully.");

      await loadJobs("mine");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/auth/login");
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredJobs = jobs
    .filter((job) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        `${job.title || ""} ${job.description || ""}`
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "all" || job.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const displayName =
    [user?.name, user?.surname].filter(Boolean).join(" ") ||
    user?.email ||
    "Startup";

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard/startup" className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span>Mentor Token</span>
        </Link>

        <nav className={styles.navigation}>
          <Link href="/dashboard/startup">
            <span>▦</span> Dashboard
          </Link>

          <Link href="/dashboard/startup/mentors">
            <span>♙</span> Mentors
          </Link>

          <Link
            href="/dashboard/startup/jobs"
            className={styles.activeLink}
          >
            <span>◎</span> Jobs
          </Link>
        </nav>

        <button
          type="button"
          className={styles.logout}
          onClick={handleLogout}
        >
          ↪ Logout
        </button>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.searchBox}>
            <span>⌕</span>

            <input
              type="search"
              placeholder="Search jobs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.profile}>
            <div className={styles.avatar}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <strong>{displayName}</strong>
              <p>Startup</p>
            </div>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.pageHeading}>
            <div>
              <h1>
                {activeTab === "mine"
                  ? "Your Startup Jobs"
                  : "Startup Open Jobs"}
              </h1>
              <p>
                {activeTab === "mine"
                  ? "Manage jobs created by your startup."
                  : "Explore open jobs from startups."}
              </p>
            </div>

            <button
              type="button"
              className={styles.createButton}
              onClick={() => {
                setForm(emptyForm);
                setError("");
                setShowForm(true);
              }}
            >
              + Create New Job
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={
                activeTab === "mine" ? styles.activeTab : ""
              }
              onClick={() => setActiveTab("mine")}
            >
              My Startup Jobs
            </button>

            <button
              type="button"
              className={
                activeTab === "open" ? styles.activeTab : ""
              }
              onClick={() => setActiveTab("open")}
            >
              Startup Open Jobs
            </button>
          </div>

          <div className={styles.toolbar}>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <p className={styles.success}>{message}</p>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          {jobsLoading ? (
            <p>Loading jobs...</p>
          ) : filteredJobs.length === 0 ? (
            <div className={styles.empty}>
              <h3>No jobs found</h3>
              <p>
                {activeTab === "mine"
                  ? "Create your first job to get started."
                  : "There are no open jobs right now."}
              </p>
            </div>
          ) : (
            <div className={styles.jobsGrid}>
              {filteredJobs.map((job) => {
                const startup =
                  typeof job.startupId === "object"
                    ? job.startupId
                    : null;

                const startupName = startup
                  ? [startup.name, startup.surname]
                      .filter(Boolean)
                      .join(" ")
                  : activeTab === "mine"
                  ? displayName
                  : "Startup";

                return (
                  <article
                    className={styles.jobCard}
                    key={job._id}
                  >
                    <div className={styles.company}>
                      <div className={styles.companyAvatar}>
                        {startup?.avatar ? (
                          <img src={startup.avatar} alt="" />
                        ) : (
                          startupName.charAt(0).toUpperCase()
                        )}
                      </div>

                      <span>{startupName}</span>
                    </div>

                    <h3>{job.title}</h3>

                    <p className={styles.description}>
                      {job.description}
                    </p>

                    <div className={styles.jobFooter}>
                      <span className={styles.status}>
                        {job.status === "assigned"
                          ? "In Progress"
                          : job.status === "completed"
                          ? "Completed"
                          : "Open"}
                      </span>

                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => setSelectedJob(job)}
                      >
                        View More
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <div className={styles.modalOverlay}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="create-job-title">
            <div className={styles.modalHeader}>
              <h2 id="create-job-title">Create New Job</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateJob} className={styles.form}>
              <label>
                Job Title
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="Enter job title"
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe your job..."
                />
              </label>

              <button type="submit" disabled={saving} className={styles.createButton}>
                {saving ? "Creating..." : "Create Job"}
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedJob && (
        <div className={styles.modalOverlay}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="job-details-title">
            <div className={styles.modalHeader}>
              <h2 id="job-details-title">{selectedJob.title}</h2>
              <button type="button" onClick={() => setSelectedJob(null)}>
                ×
              </button>
            </div>

            <p>{selectedJob.description}</p>
            <p>Category: {selectedJob.category}</p>
            <p>Status: {selectedJob.status}</p>
          </section>
        </div>
      )}
    </div>
  );
}
