
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M16 2.5 28 9.5v13L16 29.5 4 22.5v-13L16 2.5Z"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>

        <span>Mentor Token</span>
      </Link>

      <div className={styles.navLinks}>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>

      <div className={styles.authLinks}>
        {!loading &&
          (user ? (
            <Link
              className={styles.dashboardLink}
              href={
                user.role === "mentor"
                  ? "/dashboard/mentor"
                  : "/dashboard/startup"
              }
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login">Login</Link>

              <Link
                href="/auth/register"
                className={styles.getStarted}
              >
                <span aria-hidden="true">+</span>
                Get Started
              </Link>
            </>
          ))}
      </div>
    </nav>
  );
}
