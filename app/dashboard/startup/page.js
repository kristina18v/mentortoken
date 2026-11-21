
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileMenu from "@/app/components/ProfileMenu";
import styles from "./page.module.css";

const filters = ["All", "Done", "Rejected", "In Progress"];

function getJobStatus(status) {
  if (status === "completed") return "Done";
  if (status === "rejected") return "Rejected";
  if (status === "assigned") return "In Progress";
  return "Open";
}

function extractUser(data) {
  return data?.data?.user || data?.user || data?.data || data;
}

function extractList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function StartupDashboard() {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState("All");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [mentorsError, setMentorsError] = useState("");
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          if (!cancelled) {
            router.replace("/auth/login");
          }
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Authentication check failed (HTTP ${response.status})`
          );
        }

        const data = await response.json();
        const currentUser = extractUser(data);

        if (!currentUser || !currentUser.role) {
          throw new Error("Invalid user data from /api/auth/me");
        }

        if (currentUser.role !== "startup") {
          if (!cancelled) {
            router.replace(
              currentUser.role === "mentor"
                ? "/dashboard/mentor"
                : "/dashboard"
            );
          }
          return;
        }

        if (cancelled) return;

        setUser(currentUser);

        const [jobsResult, mentorsResult] =
          await Promise.allSettled([
            fetch("/api/jobs", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/mentors", {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        if (cancelled) return;

        if (jobsResult.status === "fulfilled") {
          const jobsResponse = jobsResult.value;

          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            const jobsList = extractList(jobsData, "jobs");

            const startupId = String(
              currentUser._id || currentUser.id || ""
            );

            const ownJobs = jobsList.filter((job) => {
              const ownerId =
                typeof job.startupId === "object"
                  ? job.startupId?._id || job.startupId?.id
                  : job.startupId;

              return String(ownerId || "") === startupId;
            });

            if (!cancelled) {
              setJobs(ownJobs);
              setJobsError("");
            }
          } else if (!cancelled) {
            setJobsError("Could not load jobs.");
          }
        } else if (!cancelled) {
          setJobsError("Could not load jobs.");
        }

        if (mentorsResult.status === "fulfilled") {
          const mentorsResponse = mentorsResult.value;

          if (mentorsResponse.ok) {
            const mentorsData = await mentorsResponse.json();
            const mentorsList = extractList(
              mentorsData,
              "mentors"
            );

            const rankedMentors = mentorsList
              .filter(
                (mentor) =>
                  mentor &&
                  (mentor.role === "mentor" ||
                    mentor.role === undefined)
              )
              .sort(
                (a, b) =>
                  (Number(b.completedJobs) || 0) -
                  (Number(a.completedJobs) || 0)
              );

            if (!cancelled) {
              setMentors(rankedMentors);
              setMentorsError("");
            }
          } else if (!cancelled) {
            setMentorsError("Could not load mentors.");
          }
        } else if (!cancelled) {
          setMentorsError("Could not load mentors.");
        }
      } catch (error) {
        console.error("Startup dashboard error:", error);

        if (!cancelled) {
          setJobsError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutError("Could not log out.");
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const status = getJobStatus(job.status);
    return activeFilter === "All" || status === activeFilter;
  });

  const filteredMentors = mentors
    .filter((mentor) => {
      const fullName = [
        mentor.name,
        mentor.surname,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fullName.includes(search.trim().toLowerCase());
    })
    .slice(0, 3);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!user) {
    return (
      <div>
        <p>Unable to load your dashboard.</p>
        {jobsError && <p role="alert">{jobsError}</p>}
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <aside
        className={`${styles.sidebar} ${
          sidebarCollapsed ? styles.collapsed : ""
        }`}
      >
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>

          {!sidebarCollapsed && <span>Mentor Token</span>}

          <button
            type="button"
            className={styles.collapseButton}
            onClick={() =>
              setSidebarCollapsed((previous) => !previous)
            }
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className={styles.navigation}>
          <Link
            href="/dashboard/startup"
            className={styles.activeLink}
          >
            <span>▦</span>
            {!sidebarCollapsed && "Dashboard"}
          </Link>

          <Link href="/dashboard/startup/mentors">
            <span>♙</span>
            {!sidebarCollapsed && "Mentors"}
          </Link>

          <Link href="/dashboard/startup/jobs">
            <span>◎</span>
            {!sidebarCollapsed && "Jobs"}
          </Link>
        </nav>

        <button
          type="button"
          className={styles.logout}
          onClick={handleLogout}
        >
          <span>↪</span>
          {!sidebarCollapsed && "Logout"}
        </button>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.searchBox}>
            <span>⌕</span>

            <input
              type="search"
              placeholder="Search Mentor..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <ProfileMenu />
        </header>

        {logoutError && (
          <p role="alert">{logoutError}</p>
        )}

        <div className={styles.content}>
          <section className={styles.jobsSection}>
            <h2>Assigned Jobs</h2>

            <div className={styles.filters}>
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={
                    activeFilter === filter
                      ? styles.activeFilter
                      : ""
                  }
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className={styles.jobsList}>
              {jobsError ? (
                <p role="alert">{jobsError}</p>
              ) : filteredJobs.length === 0 ? (
                <p>No jobs found.</p>
              ) : (
                filteredJobs.map((job) => {
                  const status = getJobStatus(job.status);

                  return (
                    <div
                      className={styles.jobRow}
                      key={job._id || job.id}
                    >
                      <span>{job.title}</span>

                      <span
                        className={`${styles.status} ${
                          status === "Done"
                            ? styles.done
                            : status === "Rejected"
                            ? styles.rejected
                            : status === "In Progress"
                            ? styles.inProgress
                            : styles.open
                        }`}
                      >
                        {status.toUpperCase()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <div className={styles.rightColumn}>
            <section className={styles.mentorsSection}>
              <h2>Best Performing Mentors</h2>

              <div className={styles.mentorsList}>
                {mentorsError ? (
                  <p role="alert">{mentorsError}</p>
                ) : filteredMentors.length === 0 ? (
                  <p>
                    {search.trim()
                      ? "No mentors match your search."
                      : "No mentors available."}
                  </p>
                ) : (
                  filteredMentors.map((mentor) => {
                    const fullName =
                      [mentor.name, mentor.surname]
                        .filter(Boolean)
                        .join(" ") || "Mentor";

                    const mentorAvatar =
                      mentor.avatar ||
                      mentor.photoUrl ||
                      mentor.profileImage ||
                      "";

                    return (
                      <div
                        className={styles.mentorRow}
                        key={mentor._id || mentor.id}
                      >
                        <div className={styles.mentorAvatar}>
                          {mentorAvatar ? (
                            <img
                              src={mentorAvatar}
                              alt={fullName}
                              width={42}
                              height={42}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                            />
                          ) : (
                            fullName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <span className={styles.mentorName}>
                          {fullName}
                        </span>

                        <div className={styles.achievements}>
                          <strong>
                            {mentor.completedJobs ?? 0}
                          </strong>
                          <small>Achieved Jobs</small>
                        </div>

                        <span
                          className={styles.arrow}
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className={styles.statisticsSection}>
              <h3>OVERALL STATISTIC</h3>

              <div className={styles.chartCard}>
                <h4>STATISTICS</h4>

                <p>Completed jobs over the last 12 months</p>

                <p>
                  Analytics will appear when statistics
                  are connected.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
