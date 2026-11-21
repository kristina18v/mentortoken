
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const THEMES = ["light", "dark", "system"];

const DEFAULT_SETTINGS = {
  profileVisible: true,
  showPhone: false,
  availableForJobs: true,
  jobInterests: [],
  language: "en",
  dateFormat: "DD/MM/YYYY",
  timezone: "Europe/Skopje",
};

const SECTIONS = [
  { id: "profile", title: "Profile Information", icon: "👤" },
  { id: "security", title: "Password & Security", icon: "🔒" },
  { id: "privacy", title: "Privacy & Visibility", icon: "🛡️" },
  { id: "appearance", title: "Appearance", icon: "🎨" },
  { id: "preferences", title: "Preferences", icon: "⚙️" },
  { id: "jobs", title: "Job Preferences", icon: "💼" },
  { id: "danger", title: "Danger Zone", icon: "⚠️" },
];

function subscribeTheme(callback) {
  window.addEventListener("theme-updated", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("theme-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getTheme() {
  const value = localStorage.getItem("mentorTokenTheme");
  return THEMES.includes(value) ? value : "system";
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${
        checked ? styles.toggleOn : ""
      }`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const theme = useSyncExternalStore(
    subscribeTheme,
    getTheme,
    () => "system"
  );

  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [section, setSection] = useState("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [interests, setInterests] = useState("");

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [profileResponse, settingsResponse] =
          await Promise.all([
            fetch("/api/profile", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/settings", {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        if (
          profileResponse.status === 401 ||
          settingsResponse.status === 401
        ) {
          router.replace("/auth/login");
          return;
        }

        if (!profileResponse.ok || !settingsResponse.ok) {
          throw new Error("Failed to load settings.");
        }

        const profileData = await profileResponse.json();
        const settingsData = await settingsResponse.json();

        if (
          !["startup", "mentor"].includes(
            profileData.user?.role
          )
        ) {
          router.replace("/");
          return;
        }

        if (!active) return;

        const loaded = {
          ...DEFAULT_SETTINGS,
          ...settingsData.settings,
          language: "en",
        };

        setUser(profileData.user);
        setSettings(loaded);
        setInterests((loaded.jobInterests || []).join(", "));
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [router]);

  function updateSetting(key, value) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setMessage("");
  }

  function changeTheme(nextTheme) {
    if (!THEMES.includes(nextTheme)) return;

    localStorage.setItem("mentorTokenTheme", nextTheme);
    window.dispatchEvent(new Event("theme-updated"));
  }

  async function saveSettings() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const jobInterests = interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          language: "en",
          jobInterests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save settings."
        );
      }

      const updated = {
        ...DEFAULT_SETTINGS,
        ...data.settings,
        language: "en",
      };

      setSettings(updated);
      setInterests((updated.jobInterests || []).join(", "));
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.newPassword !== password.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (password.newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/settings/password",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(password),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Password update failed."
        );
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage("Password updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      router.replace("/auth/login");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoggingOut(false);
    }
  }

  function openDeleteForm() {
    setDeleteOpen(true);
    setDeletePassword("");
    setDeleteConfirm("");
    setError("");
    setMessage("");
  }

  function cancelDelete() {
    setDeleteOpen(false);
    setDeletePassword("");
    setDeleteConfirm("");
    setError("");
    setMessage("");
  }

  async function deleteAccount(event) {
    event.preventDefault();

    if (user?.role !== "startup") {
      setError("Account deletion is only available for startups.");
      return;
    }

    if (!deletePassword) {
      setError("Please enter your current password.");
      return;
    }

    if (deleteConfirm !== "DELETE") {
      setError("Type DELETE to confirm account deletion.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/settings/account",
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: deletePassword,
            confirmation: "DELETE",
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success !== true) {
        throw new Error(
          data?.message || "Failed to delete account."
        );
      }

      setDeletePassword("");
      setDeleteConfirm("");
      setDeleteOpen(false);

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: settings.timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).formatToParts(date);

      const p = Object.fromEntries(
        parts
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value])
      );

      if (settings.dateFormat === "YYYY-MM-DD") {
        return `${p.year}-${p.month}-${p.day}`;
      }

      if (settings.dateFormat === "MM/DD/YYYY") {
        return `${p.month}/${p.day}/${p.year}`;
      }

      return `${p.day}/${p.month}/${p.year}`;
    } catch {
      return date.toLocaleDateString();
    }
  }

  if (loading) {
    return (
      <p className={styles.loading}>Loading...</p>
    );
  }

  if (!user) {
    return (
      <p className={styles.loading}>
        {error || "Settings unavailable."}
      </p>
    );
  }

  const dashboard =
    user.role === "mentor"
      ? "/dashboard/mentor"
      : "/dashboard/startup";

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* TOPBAR */}
        <div className={styles.topbar}>
          <Link href={dashboard} className={styles.back}>
            ← Back to Dashboard
          </Link>

          <span className={styles.brand}>
            MentorToken
          </span>
        </div>

        {/* HEADER */}
        <header className={styles.heading}>
          <h1>Settings</h1>
          <p>
            Manage your account, privacy,
            security and preferences.
          </p>
        </header>

        <div className={styles.layout}>

          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarTitle}>
              ACCOUNT SETTINGS
            </div>

            <nav className={styles.nav}>
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${
                    section === item.id
                      ? styles.navActive
                      : ""
                  }`}
                  onClick={() => {
                    setSection(item.id);
                    setError("");
                    setMessage("");
                  }}
                >
                  <span aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <div className={styles.mainContent}>

            {/* PROFILE INFORMATION */}
            {section === "profile" && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <h2>Profile Information</h2>
                  <p>
                    Review your account details
                    and public profile.
                  </p>
                </div>

                <div className={styles.profileSummary}>
                  <div className={styles.avatar}>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                      />
                    ) : (
                      <span>
                        {user.name?.[0]?.toUpperCase()}
                        {user.surname?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3>
                      {user.name} {user.surname}
                    </h3>
                    <p>{user.email}</p>
                    <span className={styles.roleBadge}>
                      {user.role === "mentor"
                        ? "Mentor"
                        : "Startup"}
                    </span>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <span>Full Name</span>
                  <strong>
                    {user.name} {user.surname}
                  </strong>
                </div>

                <div className={styles.infoRow}>
                  <span>Email</span>
                  <strong>{user.email}</strong>
                </div>

                <div className={styles.infoRow}>
                  <span>Account Role</span>
                  <strong>
                    {user.role === "mentor"
                      ? "Mentor"
                      : "Startup"}
                  </strong>
                </div>

                <div className={styles.infoRow}>
                  <span>Member Since</span>
                  <strong>
                    {formatDate(user.createdAt)}
                  </strong>
                </div>

                <Link
                  href="/profile"
                  className={styles.primaryButton}
                >
                  Edit My Profile
                </Link>
              </section>
            )}

            {/* PASSWORD AND SECURITY */}
            {section === "security" && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <h2>Password & Security</h2>
                  <p>
                    Manage your password and
                    account session.
                  </p>
                </div>

                <form onSubmit={updatePassword}>
                  {[
                    {
                      key: "currentPassword",
                      label: "Current Password",
                      autoComplete: "current-password",
                    },
                    {
                      key: "newPassword",
                      label: "New Password",
                      autoComplete: "new-password",
                    },
                    {
                      key: "confirmPassword",
                      label: "Confirm New Password",
                      autoComplete: "new-password",
                    },
                  ].map((field) => (
                    <label
                      className={styles.field}
                      key={field.key}
                    >
                      {field.label}

                      <input
                        type={
                          showPasswords
                            ? "text"
                            : "password"
                        }
                        autoComplete={field.autoComplete}
                        value={password[field.key]}
                        onChange={(event) =>
                          setPassword((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                        minLength={
                          field.key === "currentPassword"
                            ? undefined
                            : 8
                        }
                        maxLength={128}
                        required
                      />
                    </label>
                  ))}

                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={showPasswords}
                      onChange={(event) =>
                        setShowPasswords(event.target.checked)
                      }
                    />
                    Show passwords
                  </label>

                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Update Password"}
                  </button>
                </form>

                <div className={styles.subsection}>
                  <h3>Current Session</h3>
                  <p>
                    You are signed in on this device.
                  </p>

                  <button
                    type="button"
                    className={styles.outlineButton}
                    onClick={logout}
                    disabled={loggingOut}
                  >
                    {loggingOut
                      ? "Logging out..."
                      : "Log Out"}
                  </button>
                </div>
              </section>
            )}

            {/* PRIVACY */}
            {section === "privacy" && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <h2>Privacy & Visibility</h2>
                  <p>
                    Control which information
                    other users can see.
                  </p>
                </div>

                <div className={styles.settingRow}>
                  <div>
                    <h3>Public Profile</h3>
                    <p>
                      Allow other users to
                      discover your profile.
                    </p>
                  </div>

                  <Toggle
                    checked={settings.profileVisible}
                    onChange={(value) =>
                      updateSetting("profileVisible", value)
                    }
                  />
                </div>

                <div className={styles.settingRow}>
                  <div>
                    <h3>Show Phone Number</h3>
                    <p>
                      Allow other users to
                      view your phone number.
                    </p>
                  </div>

                  <Toggle
                    checked={settings.showPhone}
                    onChange={(value) =>
                      updateSetting("showPhone", value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Privacy Settings"}
                </button>
              </section>
            )}

            {/* APPEARANCE */}
            {section === "appearance" && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <h2>Appearance</h2>
                  <p>
                    Choose how MentorToken
                    looks on your device.
                  </p>
                </div>

                <div className={styles.themeGrid}>
                  {[
                    {
                      value: "light",
                      title: "Light",
                      icon: "☀",
                    },
                    {
                      value: "dark",
                      title: "Dark",
                      icon: "☾",
                    },
                    {
                      value: "system",
                      title: "System",
                      icon: "◐",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={theme === option.value}
                      className={`${styles.themeOption} ${
                        theme === option.value
                          ? styles.selected
                          : ""
                      }`}
                      onClick={() =>
                        changeTheme(option.value)
                      }
                    >
                      <span className={styles.themeIcon}>
                        {option.icon}
                      </span>

                      <strong>{option.title}</strong>

                      <span className={styles.radio}>
                        {theme === option.value
                          ? "●"
                          : "○"}
                      </span>
                    </button>
                  ))}
                </div>

                <p className={styles.hint}>
                  Your theme preference is
                  saved automatically.
                </p>
              </section>
            )}

            {/* GENERAL PREFERENCES */}
            {section === "preferences" && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <h2>General Preferences</h2>
                  <p>
                    Customize your regional preferences.
                  </p>
                </div>

                <label className={styles.field}>
                  Date Format

                  <select
                    value={settings.dateFormat}
                    onChange={(event) =>
                      updateSetting(
                        "dateFormat",
                        event.target.value
                      )
                    }
                  >
                    <option value="DD/MM/YYYY">
                      DD/MM/YYYY
                    </option>
                    <option value="MM/DD/YYYY">
                      MM/DD/YYYY
                    </option>
                    <option value="YYYY-MM-DD">
                      YYYY-MM-DD
                    </option>
                  </select>
                </label>

                <label className={styles.field}>
                  Time Zone

                  <select
                    value={settings.timezone}
                    onChange={(event) =>
                      updateSetting(
                        "timezone",
                        event.target.value
                      )
                    }
                  >
                    <option value="Europe/Skopje">
                      Europe/Skopje
                    </option>
                    <option value="Europe/Berlin">
                      Europe/Berlin
                    </option>
                    <option value="Europe/London">
                      Europe/London
                    </option>
                    <option value="UTC">
                      UTC
                    </option>
                  </select>
                </label>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Preferences"}
                </button>
              </section>
            )}

            {/* JOB PREFERENCES */}
            {section === "jobs" && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <h2>Job Preferences</h2>
                  <p>
                    Customize your work-related preferences.
                  </p>
                </div>

                {user.role === "mentor" && (
                  <div className={styles.settingRow}>
                    <div>
                      <h3>Available for New Jobs</h3>
                      <p>
                        Indicate whether you accept
                        new opportunities.
                      </p>
                    </div>

                    <Toggle
                      checked={settings.availableForJobs}
                      onChange={(value) =>
                        updateSetting(
                          "availableForJobs",
                          value
                        )
                      }
                    />
                  </div>
                )}

                <label className={styles.field}>
                  {user.role === "mentor"
                    ? "Areas of Interest"
                    : "Preferred Job Categories"}

                  <input
                    value={interests}
                    onChange={(event) =>
                      setInterests(event.target.value)
                    }
                    placeholder="Development, Design, Marketing"
                  />

                  <small>
                    Separate interests with commas.
                  </small>
                </label>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Job Preferences"}
                </button>
              </section>
            )}

            {/* DANGER ZONE */}
            {section === "danger" && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <h2>Danger Zone</h2>
                  <p>
                    Sensitive actions related
                    to your account.
                  </p>
                </div>

                <div className={styles.settingRow}>
                  <div>
                    <h3>Log Out</h3>
                    <p>
                      End your current session
                      on this device.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.outlineButton}
                    onClick={logout}
                    disabled={loggingOut || deleting}
                  >
                    {loggingOut
                      ? "Logging out..."
                      : "Log Out"}
                  </button>
                </div>

                <div className={styles.dangerBox}>
                  <h3>Delete Account</h3>

                  <p>
                    Permanently delete your account.
                    Your jobs may remain visible
                    under Deleted User.
                  </p>

                  {user.role !== "startup" ? (
                    <p>
                      Account deletion for mentors
                      is not available yet.
                    </p>
                  ) : !deleteOpen ? (
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={openDeleteForm}
                    >
                      Delete Account
                    </button>
                  ) : (
                    <form onSubmit={deleteAccount}>
                      <p
                        style={{
                          marginTop: 16,
                          marginBottom: 16,
                        }}
                      >
                        This action cannot be undone.
                        Enter your current password and
                        type DELETE to permanently
                        delete your account.
                      </p>

                      <label className={styles.field}>
                        Current Password

                        <input
                          id="delete-account-password"
                          name="deleteAccountPassword"
                          type="password"
                          autoComplete="new-password"
                          value={deletePassword}
                          onChange={(event) =>
                            setDeletePassword(
                              event.target.value
                            )
                          }
                          placeholder="Enter your current password"
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        Type DELETE to confirm

                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(event) =>
                            setDeleteConfirm(
                              event.target.value
                            )
                          }
                          placeholder="DELETE"
                          autoComplete="off"
                          required
                        />
                      </label>

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 18,
                        }}
                      >
                        <button
                          type="button"
                          className={styles.outlineButton}
                          disabled={deleting}
                          onClick={cancelDelete}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className={styles.dangerButton}
                          disabled={
                            deleting ||
                            !deletePassword ||
                            deleteConfirm !== "DELETE"
                          }
                        >
                          {deleting
                            ? "Deleting..."
                            : "Permanently Delete Account"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            )}

            {/* ERROR */}
            {error && (
              <p
                className={styles.error}
                role="alert"
              >
                {error}
              </p>
            )}

            {/* SUCCESS */}
            {message && (
              <p
                className={styles.success}
                role="status"
              >
                {message}
              </p>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
