"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const sessionCategories = [
  { href: "#therapy", label: "Alternative Therapies" },
  { href: "#consultations", label: "Jyothishya Consultations" },
  { href: "#classes", label: "Music Classes" },
  { href: "#workshops", label: "Mind & Body Workshops" },
  { href: "#satsangs", label: "Satsangs" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isHome = pathname === "/";
  const getHref = (href: string) => (!isHome && href.startsWith("#") ? `/${href}` : href);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSessionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links: { href: string; label: string }[] = [];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 0.4s ease",
        background: scrolled || !isHome ? "rgba(250,247,242,0.92)" : "transparent",
        backdropFilter: scrolled || !isHome ? "blur(12px)" : "none",
        borderBottom: scrolled || !isHome ? "1px solid rgba(28,31,74,0.08)" : "none",
        padding: "0 2rem",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
        }}
      >
        <a
          href={getHref("#")}
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 600,
              color: scrolled || !isHome ? "var(--indigo)" : "var(--ivory)",
              letterSpacing: 0.5,
              transition: "color 0.4s",
            }}
          >
            Sharath Kancherla
          </span>
        </a>

        {/* Desktop nav */}
        <div
          style={{ display: "flex", gap: 36, alignItems: "center" }}
          className="desktop-nav"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={getHref(l.href)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: scrolled ? "var(--text-mid)" : "rgba(250,247,242,0.8)",
                textDecoration: "none",
                letterSpacing: 0.3,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = scrolled || !isHome
                  ? "var(--indigo)"
                  : "var(--ivory)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = scrolled || !isHome
                  ? "var(--text-mid)"
                  : "rgba(250,247,242,0.8)")
              }
            >
              {l.label}
            </a>
          ))}

          {/* Events & Updates Link */}
          <a
            href="/events-and-updates"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: scrolled || !isHome ? "var(--text-mid)" : "rgba(250,247,242,0.8)",
              textDecoration: "none",
              letterSpacing: 0.3,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = scrolled || !isHome
                ? "var(--indigo)"
                : "var(--ivory)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = scrolled || !isHome
                ? "var(--text-mid)"
                : "rgba(250,247,242,0.8)")
            }
          >
            Events & Updates
          </a>

          {/* Wall of Love Link */}
          <button
            onClick={() => {
              if (isHome) {
                const el = document.getElementById("Testimonials");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              } else {
                window.location.href = "/#Testimonials";
              }
            }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: scrolled || !isHome ? "var(--text-mid)" : "rgba(250,247,242,0.8)",
              background: "none",
              border: "none",
              cursor: "pointer",
              letterSpacing: 0.3,
              padding: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = scrolled || !isHome
                ? "var(--indigo)"
                : "var(--ivory)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = scrolled || !isHome
                ? "var(--text-mid)"
                : "rgba(250,247,242,0.8)")
            }
          >
            Wall of Love
          </button>

          {/* SKY Link */}
          <a
            href="/sky"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: scrolled || !isHome ? "var(--text-mid)" : "rgba(250,247,242,0.8)",
              textDecoration: "none",
              letterSpacing: 0.3,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = scrolled || !isHome
                ? "var(--indigo)"
                : "var(--ivory)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = scrolled || !isHome
                ? "var(--text-mid)"
                : "rgba(250,247,242,0.8)")
            }
          >
            SKY
          </a>

          {/* Offerings Link */}
          <a
            href="/offerings"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: scrolled || !isHome ? "var(--indigo)" : "var(--ivory)",
              border: scrolled || !isHome ? "1.5px solid rgba(28,31,74,0.15)" : "1.5px solid rgba(250,247,242,0.3)",
              padding: "7px 18px",
              borderRadius: 100,
              textDecoration: "none",
              letterSpacing: 0.5,
              transition: "all 0.2s ease",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = scrolled || !isHome ? "var(--indigo)" : "var(--ivory)";
              el.style.color = scrolled || !isHome ? "var(--ivory)" : "var(--indigo)";
              el.style.borderColor = scrolled || !isHome ? "var(--indigo)" : "var(--ivory)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "transparent";
              el.style.color = scrolled || !isHome ? "var(--indigo)" : "rgba(250,247,242,0.85)";
              el.style.borderColor = scrolled || !isHome ? "rgba(28,31,74,0.15)" : "rgba(250,247,242,0.3)";
            }}
          >
            Offerings
          </a>

          {/* Dynamic Login / Dashboard Button */}
          {session ? (
            <a
              href="/dashboard"
              style={{
                background: "var(--indigo)",
                color: "var(--ivory)",
                padding: "9px 22px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.3,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "var(--indigo)";
              }}
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/login"
              style={{
                background: "var(--indigo)",
                color: "var(--ivory)",
                padding: "9px 22px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.3,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "var(--indigo)";
              }}
            >
              Login
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            color: scrolled || !isHome ? "var(--indigo)" : "var(--ivory)",
          }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "var(--ivory)",
            padding: "1rem 2rem 1.5rem",
            borderTop: "1px solid rgba(28,31,74,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={getHref(l.href)}
              onClick={() => setMenuOpen(false)}
              style={{
                color: "var(--text-dark)",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 500,
                padding: "10px 0",
                borderBottom: "1px solid rgba(28,31,74,0.06)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {l.label}
            </a>
          ))}

          {/* Wall of Love Link */}
          <button
            onClick={() => {
              setMenuOpen(false);
              if (isHome) {
                const el = document.getElementById("Testimonials");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              } else {
                window.location.href = "/#Testimonials";
              }
            }}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
              background: "none",
              border: "none",
              textAlign: "left",
              width: "100%",
              cursor: "pointer",
            }}
          >
            Wall of Love
          </button>

          {/* Events & Updates Link */}
          <a
            href="/events-and-updates"
            onClick={() => setMenuOpen(false)}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Events & Updates
          </a>

          {/* SKY Link */}
          <a
            href="/sky"
            onClick={() => setMenuOpen(false)}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            SKY
          </a>

          {/* Offerings Link */}
          <a
            href="/offerings"
            onClick={() => setMenuOpen(false)}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Offerings
          </a>

          {/* Dynamic Login / Dashboard Link */}
          {session ? (
            <a
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "var(--text-dark)",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 500,
                padding: "10px 0",
                borderBottom: "1px solid rgba(28,31,74,0.06)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "var(--text-dark)",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 500,
                padding: "10px 0",
                borderBottom: "1px solid rgba(28,31,74,0.06)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Login
            </a>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
