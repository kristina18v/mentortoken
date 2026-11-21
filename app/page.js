
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

const features = [
  {
    icon: "goal",
    title: "Goal Setting",
    description:
      "Set clear objectives and milestones for your startup.",
  },
  {
    icon: "tracking",
    title: "Performance Tracking",
    description:
      "Monitor progress and track key performance indicators.",
  },
  {
    icon: "reward",
    title: "Reward System",
    description:
      "Motivate your team and celebrate achievements with our innovative reward system.",
  },
  {
    icon: "library",
    title: "Knowledge Library",
    description:
      "Access a comprehensive knowledge library to equip your startup with the insights and resources it needs.",
  },
];

const companies = [
  "Adobe",
  "braze",
  "HELLOSIGN",
  "maze",
  "ghost",
  "ATLASSIAN",
  "treehouse",
  "INTERCOM",
  "Opendoor",
  "HubSpot",
];

function FeatureIcon({ type }) {
  const icons = {
    goal: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <path d="m12 12 9-9m-5 0h5v5" />
      </>
    ),
    tracking: (
      <>
        <rect x="3" y="4" width="18" height="15" rx="2" />
        <path d="m6 14 4-4 4 5 4-7M8 22h8M12 19v3" />
      </>
    ),
    reward: (
      <>
        <path d="M7 3h10v5a5 5 0 0 1-10 0V3Z" />
        <path d="M7 5H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4M12 13v6m-5 2h10" />
      </>
    ),
    library: (
      <>
        <path d="M4 20V4h5v16M10 20V4h5v16m2-15 4-1 4 15-4 1Z" />
        <path d="M5 8h3m3 0h3" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  );
}

function BrandLogo() {
  return (
    <span className={styles.brandLogo}>
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
    </span>
  );
}

export default function Home() {
  return (
    <main className={styles.page}>
      {/* NAVBAR */}
      <header className={styles.header}>
        <Navbar />
      </header>

      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div
          className={styles.facets}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className={styles.heroCopy}>
          <h1>
            Grow your StartUp!
            <br />
            Monitoring and
            <br />
            Evaluating now is easy!
          </h1>

          <p>
            Welcome to Mentor Token, where we redefine
            the dynamics of startup success. Our
            innovative platform offers a transformative
            approach to mentorship, fostering connections
            that propel emerging businesses toward
            their full potential.
          </p>

          <div className={styles.actions}>
            <Link
              href="/auth/register"
              className={styles.primaryButton}
            >
              <span aria-hidden="true">＋</span>
              Get Started
            </Link>

            <Link
              href="/contact"
              className={styles.secondaryButton}
            >
              Get in Touch
            </Link>
          </div>
        </div>

        <img
          className={styles.laptop}
          src="/images/Scene%202.png"
          alt="Mentor Token platform on a laptop"
          width="935"
          height="701"
          fetchPriority="high"
        />
      </section>

      {/* COMPANIES */}
      <section
        className={styles.companies}
        aria-label="Trusted startups"
      >
        <div className={styles.companyGrid}>
          {companies.map((company, index) => (
            <span
              key={company}
              className={styles[`company${index + 1}`]}
            >
              {company}
            </span>
          ))}
        </div>

        <p>
          More than 25+ Startups around the
          <br />
          world trusted Mentor Token.
        </p>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <img
          className={styles.rocket}
          src="/images/3D%20Rocket%20on%20a%20Purple%20Horizon.png"
          width="1311"
          height="1211"
          alt=""
          loading="lazy"
        />

        <p className={styles.eyebrow}>
          FEATURES
        </p>

        <h2>
          Boost Your Startup&apos;s Journey:
          <br />
          Discover Mentor Token&apos;s Robust
          <br />
          Features
        </h2>

        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article key={feature.title}>
              <FeatureIcon type={feature.icon} />

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SUCCESS */}
      <section className={styles.success}>
        <h2>
          Every <span>success</span> is rewarded!
        </h2>

        <div className={styles.dashboardPreview}>
          <img
            src="/images/mentors-dashboard.png"
            width="1764"
            height="1254"
            alt="Mentor Token dashboard preview"
            loading="lazy"
          />
        </div>

        <img
          className={styles.dashboardIllustration}
          src="/images/dashboard-illustration.png"
          width="620"
          height="600"
          alt=""
          loading="lazy"
        />
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerIntro}>
            <Link
              href="/"
              className={styles.brand}
            >
              <BrandLogo />
            </Link>

            <p>
              With Mentor Token, every failure
              transforms into an opportunity
              for growth.
            </p>
          </div>

          <div className={styles.footerColumn}>
            <h3>Pages</h3>

            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact US</Link>
          </div>

          <div className={styles.footerColumn}>
            <h3>Contact</h3>

            <a href="mailto:info@mentortoken.com">
              info@mentortoken.com
            </a>

            <a href="tel:+389123456789">
              + (389) 123 456 789
            </a>
          </div>

          <div className={styles.footerColumn}>
            <h3>Follow Us</h3>

            <div className={styles.socials}>
              <span aria-label="LinkedIn">in</span>
              <span aria-label="Twitter">𝕏</span>
              <span aria-label="Facebook">f</span>
            </div>
          </div>
        </div>

        <p className={styles.copyright}>
          © 2024 Mentor Token. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
