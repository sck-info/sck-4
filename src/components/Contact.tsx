"use client";

import { FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

export default function Contact() {
  return (
    <>
      <section
        id="contact"
        style={{
          background: "var(--indigo)",
          padding: "clamp(5rem, 10vw, 8rem) 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(232,150,46,0.5) 50%, transparent 100%)",
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "clamp(3rem, 5vw, 5rem)",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 1,
                    background: "rgba(232,150,46,0.5)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: "var(--gold)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  Get in Touch
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(36px, 5vw, 52px)",
                  fontWeight: 300,
                  color: "var(--ivory)",
                  lineHeight: 1.1,
                  marginBottom: "1.5rem",
                }}
              >
                Begin your
                <br />
                <span style={{ fontStyle: "italic", color: "var(--gold)" }}>
                  healing journey
                </span>
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: "rgba(250,247,242,0.55)",
                  lineHeight: 1.75,
                  fontWeight: 300,
                  maxWidth: 420,
                  marginBottom: "2.5rem",
                }}
              >
                Questions before you book?
              </p>

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: "rgba(250,247,242,0.55)",
                  lineHeight: 1.75,
                  fontWeight: 300,
                  maxWidth: 420,
                  marginBottom: "2.5rem",
                }}
              >
                Reach out directly and I&apos;ll help you figure out which
                session fits what you&apos;re looking for.
              </p>

              {/* Contact details */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {[
                  {
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ),
                    label: "Email",
                    value: "sharathchandra.kancherla@gmail.com",
                  },
                  {
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    ),
                    label: "Phone / WhatsApp",
                    value: "+91 8374896261",
                  },
                  {
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                    label: "Location",
                    value: "Hyderabad, Telangana",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(232,150,46,0.12)",
                        border: "1px solid rgba(232,150,46,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 11,
                          color: "rgba(250,247,242,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14,
                          color: "rgba(250,247,242,0.8)",
                          fontWeight: 400,
                        }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "2rem" }}>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: "rgba(250,247,242,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: "1rem",
                  }}
                >
                  Follow Sharath
                </p>

                <div style={{ display: "flex", gap: 14 }}>
                  {[
                    {
                      icon: <FaInstagram size={18} />,
                      url: "https://www.instagram.com/sharathkancherla?igsh=MWtvZXI1a3czbzdlYg==",
                      label: "Instagram",
                    },
                    {
                      icon: <FaLinkedin size={18} />,
                      url: "https://www.linkedin.com/in/sharath-chandra-kancherla-b38422108?utm_source=share_via&utm_content=profile&utm_medium=member_android",
                      label: "LinkedIn",
                    },
                    {
                      icon: <FaYoutube size={18} />,
                      url: "https://youtube.com/@sharathkancherla?si=d8kXq71Z1eJ0e18K",
                      label: "YouTube",
                    },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(232,150,46,0.12)",
                        border: "1px solid rgba(232,150,46,0.25)",
                        color: "var(--gold)",
                        transition: "all 0.3s ease",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--gold)";
                        e.currentTarget.style.color = "var(--indigo)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(232,150,46,0.12)";
                        e.currentTarget.style.color = "var(--gold)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(250,247,242,0.08)",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.5rem 2rem",
                  borderBottom: "1px solid rgba(250,247,242,0.08)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: "rgba(250,247,242,0.5)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Quick Registration
                </p>
              </div>
              {[
                {
                  label: "Alternative Therapies",
                  icon: "✦",
                  color: "#6B8F71",
                  url: "https://forms.gle/jjHiYLsS41csuk8x7",
                },
                {
                  label: "Jyothishya Consultations",
                  icon: "◈",
                  color: "#C4796A",
                  url: "https://forms.gle/9tzkrwSneeeAMoTW9",
                },
                {
                  label: "Music Classes",
                  icon: "♪",
                  color: "#4A6FA5",
                  url: "https://forms.gle/rriqtYCqQTi88Uyy6",
                },
                {
                  label: "Mind & Body Workshops",
                  icon: "◉",
                  color: "#C9873A",
                  url: "https://forms.gle/f5MNNoN6AGKs8TD89",
                },
                {
                  label: "Satsangs",
                  icon: "♫",
                  color: "#7A5E9A",
                  url: "https://forms.gle/y1XBLfrsLnNgsDXo6",
                },
              ].map((item, i, arr) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.25rem 2rem",
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid rgba(250,247,242,0.06)"
                        : "none",
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(250,247,242,0.04)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ color: item.color, fontSize: 18 }}>
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        color: "rgba(250,247,242,0.8)",
                        fontWeight: 400,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke={item.color}
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer
        style={{
          background: "#13163A",
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 16,
              color: "rgba(250,247,242,0.6)",
            }}
          >
            Sharath Chandra Kancherla — Holistic Lifestyle Coach
          </span>
        </div>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "rgba(250,247,242,0.3)",
          }}
        >
          © {new Date().getFullYear()} All rights reserved
        </p>
      </footer>
    </>
  );
}
