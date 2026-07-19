"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const sessionCategories = [
  { href: "#therapy", label: "Alternative Therapies" },
  { href: "#consultations", label: "Jyothishya Consultations" },
  { href: "#classes", label: "Music Classes" },
  { href: "#workshops", label: "Mind & Body Workshops" },
  { href: "#satsangs", label: "Satsangs" },
];

export default function Navbar() {
  const pathname = usePathname();
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

          {/* Sessions dropdown */}
          <div
            ref={dropdownRef}
            style={{ position: "relative" }}
            // onMouseEnter={() => setSessionsOpen(true)}
            // onMouseLeave={() => setSessionsOpen(false)}
          >
            <button
              onClick={() => setSessionsOpen((o) => !o)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: scrolled || !isHome ? "var(--text-mid)" : "rgba(250,247,242,0.8)",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: 0.3,
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: 0,
                transition: "color 0.2s",
              }}
              aria-expanded={sessionsOpen}
              aria-haspopup="true"
            >
              Sessions
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                style={{
                  transition: "transform 0.2s",
                  transform: sessionsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  marginTop: 1,
                }}
              >
                <polyline points="2,4 6,8 10,4" />
              </svg>
            </button>

            {/* Dropdown panel */}
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 14px)",
                left: "50%",
                // transform: "translateX(-50%)",
                background: "var(--ivory)",
                border: "1px solid rgba(28,31,74,0.1)",
                borderRadius: 12,
                padding: "8px 0",
                minWidth: 210,
                boxShadow: "0 12px 40px rgba(28,31,74,0.12)",
                opacity: sessionsOpen ? 1 : 0,
                pointerEvents: sessionsOpen ? "auto" : "none",
                transform: sessionsOpen
                  ? "translateX(-50%) translateY(0)"
                  : "translateX(-50%) translateY(-6px)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }}
            >
              {/* Pointer triangle */}
              <div
                style={{
                  position: "absolute",
                  top: -6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 12,
                  height: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    background: "var(--ivory)",
                    border: "1px solid rgba(28,31,74,0.1)",
                    transform: "rotate(45deg)",
                    margin: "3px auto 0",
                  }}
                />
              </div>

              {sessionCategories.map((cat) => (
                <a
                  key={cat.href}
                  href={getHref(cat.href)}
                  onClick={() => setSessionsOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 20px",
                    textDecoration: "none",
                    color: "var(--text-dark)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 400,
                    letterSpacing: 0.2,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(28,31,74,0.04)";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--indigo)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--text-dark)";
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--gold)",
                      flexShrink: 0,
                    }}
                  />
                  {cat.label}
                </a>
              ))}
            </div>
          </div>

          <a
            href={getHref("#satsangs")}
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
            Book a Satsang
          </a>
          <a
            href={getHref("#sessions")}
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
            Book a Session
          </a>
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

          {/* Sessions expandable on mobile */}
          <div>
            <button
              onClick={() => setMobileSessionsOpen((o) => !o)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                borderBottom: "1px solid rgba(28,31,74,0.06)",
                padding: "10px 0",
                cursor: "pointer",
                color: "var(--text-dark)",
                fontSize: 16,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
              }}
              aria-expanded={mobileSessionsOpen}
            >
              Sessions
              <svg
                width="14"
                height="14"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                style={{
                  transition: "transform 0.2s",
                  transform: mobileSessionsOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                <polyline points="2,4 6,8 10,4" />
              </svg>
            </button>

            {mobileSessionsOpen && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  paddingLeft: 12,
                  borderLeft: "2px solid var(--gold)",
                  marginLeft: 4,
                  marginTop: 4,
                  marginBottom: 8,
                }}
              >
                {sessionCategories.map((cat) => (
                  <a
                    key={cat.href}
                    href={getHref(cat.href)}
                    onClick={() => {
                      setMenuOpen(false);
                      setMobileSessionsOpen(false);
                    }}
                    style={{
                      color: "var(--text-mid)",
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 400,
                      padding: "9px 0",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        flexShrink: 0,
                      }}
                    />
                    {cat.label}
                  </a>
                ))}
              </div>
            )}
          </div>
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
