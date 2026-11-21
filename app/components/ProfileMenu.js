
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./ProfileMenu.module.css";

export default function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) setUser(null);
          return;
        }

        const data = await response.json();
        if (active) setUser(data.user);
      } catch {
        if (active) setUser(null);
      }
    }

    loadProfile();

    window.addEventListener("profile-updated", loadProfile);

    return () => {
      active = false;
      window.removeEventListener("profile-updated", loadProfile);
    };
  }, []);

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout failed");

      router.replace("/auth/login");
      router.refresh();
    } catch {
      alert("Unable to log out. Please try again.");
    }
  }

  if (!user) return null;

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <div className={styles.avatar}>
          {user.avatar ? (
            <img src={user.avatar} alt="" />
          ) : (
            <span>{user.name?.charAt(0)}</span>
          )}
        </div>

        <div className={styles.info}>
          <strong>{user.name} {user.surname}</strong>
          <small>
            {user.role === "mentor" ? "Mentor" : "Startup"}
          </small>
        </div>

        <span className={styles.chevron}>⌄</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <Link href="/profile" onClick={() => setOpen(false)}>
            My Profile
          </Link>

          <Link href="/settings" onClick={() => setOpen(false)}>
            Settings
          </Link>

          <button type="button" onClick={logout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
