
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function MyProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    surname: "",
    bio: "",
    phone: "",
    skills: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/auth/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await response.json();
        const profile = data.user;

        if (
          !profile ||
          !["mentor", "startup"].includes(profile.role)
        ) {
          router.replace("/");
          return;
        }

        if (!active) return;

        setUser(profile);

        setForm({
          name: profile.name || "",
          surname: profile.surname || "",
          bio: profile.bio || "",
          phone: profile.phone || "",
          skills: Array.isArray(profile.skills)
            ? profile.skills.join(", ")
            : "",
        });
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const skills = form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const response = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          bio: form.bio,
          phone: form.phone,
          skills,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save profile"
        );
      }

      setUser(data.user);

      setForm({
        name: data.user.name || "",
        surname: data.user.surname || "",
        bio: data.user.bio || "",
        phone: data.user.phone || "",
        skills: Array.isArray(data.user.skills)
          ? data.user.skills.join(", ")
          : "",
      });

      setMessage("Profile updated successfully.");

      window.dispatchEvent(
        new Event("profile-updated")
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG or WEBP image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be smaller than 5 MB."
      );
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("avatar", file);

      const response = await fetch(
        "/api/profile/avatar",
        {
          method: "PATCH",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to upload image"
        );
      }

      setUser((previous) => ({
        ...previous,
        avatar: data.avatar,
      }));

      setMessage(
        "Profile photo updated successfully."
      );

      window.dispatchEvent(
        new Event("profile-updated")
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function removeAvatar() {
    if (uploading) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/profile/avatar",
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove photo"
        );
      }

      setUser((previous) => ({
        ...previous,
        avatar: "",
      }));

      setMessage(
        "Profile photo removed successfully."
      );

      window.dispatchEvent(
        new Event("profile-updated")
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <p className={styles.loading}>
        Loading profile...
      </p>
    );
  }

  if (!user) {
    return (
      <p className={styles.loading}>
        {error || "Profile unavailable"}
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

        {/* TOP BAR */}
        <div className={styles.topbar}>
          <Link
            href={dashboard}
            className={styles.back}
          >
            ← Dashboard
          </Link>

          <Link
            href="/settings"
            className={styles.settingsLink}
          >
            Settings
          </Link>
        </div>

        {/* PAGE HEADING */}
        <div className={styles.heading}>
          <h1>My Profile</h1>

          <p>
            Manage your personal information
            and profile.
          </p>
        </div>

        {/* PROFILE PHOTO */}
        <section className={styles.card}>
          <div className={styles.avatarRow}>

            <div className={styles.avatar}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.name} ${user.surname}`}
                />
              ) : (
                <span>
                  {user.name?.charAt(0)?.toUpperCase()}
                  {user.surname?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h2>
                {user.name} {user.surname}
              </h2>

              <span className={styles.role}>
                {user.role === "mentor"
                  ? "Mentor"
                  : "Startup"}
              </span>

              <div className={styles.photoActions}>
                <label
                  className={styles.uploadButton}
                >
                  {uploading
                    ? "Uploading..."
                    : "Change Photo"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={changeAvatar}
                    disabled={uploading}
                    hidden
                  />
                </label>

                {user.avatar && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    disabled={uploading}
                    className={styles.removeButton}
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <p className={styles.photoHint}>
                JPG, PNG or WEBP. Maximum 5 MB.
              </p>
            </div>
          </div>
        </section>

        {/* EDIT PROFILE */}
        <form
          onSubmit={saveProfile}
          className={styles.card}
        >
          <div className={styles.sectionHeading}>
            <h2>Personal Information</h2>

            <p>
              Update the information displayed
              on your profile.
            </p>
          </div>

          <div className={styles.grid}>

            <label className={styles.field}>
              First Name

              <input
                name="name"
                value={form.name}
                onChange={updateField}
                maxLength={80}
                required
              />
            </label>

            <label className={styles.field}>
              Last Name

              <input
                name="surname"
                value={form.surname}
                onChange={updateField}
                maxLength={80}
                required
              />
            </label>

            <label className={styles.field}>
              Email Address

              <input
                type="email"
                value={user.email || ""}
                disabled
              />

              <small>
                Email changes are not available here.
              </small>
            </label>

            <label className={styles.field}>
              Phone Number

              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={updateField}
                placeholder="+389 70 123 456"
                maxLength={30}
              />
            </label>
          </div>

          <label className={styles.field}>
            About Me / Bio

            <textarea
              name="bio"
              rows={5}
              maxLength={1000}
              value={form.bio}
              onChange={updateField}
              placeholder="Tell others about yourself..."
            />

            <small>
              {form.bio.length}/1000 characters
            </small>
          </label>

          <label className={styles.field}>
            Skills

            <input
              name="skills"
              value={form.skills}
              onChange={updateField}
              placeholder="React, Marketing, Business Strategy"
            />

            <small>
              Separate skills with commas.
              Maximum 20 skills.
            </small>
          </label>

          {/* MESSAGES */}
          {error && (
            <p
              className={styles.error}
              role="alert"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              className={styles.success}
              role="status"
            >
              {message}
            </p>
          )}

          {/* SAVE */}
          <div className={styles.footer}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
