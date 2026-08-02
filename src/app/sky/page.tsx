"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Brain,
  Heart,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Wind,
  Info,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Activity,
  Shield,
  Award,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  Users,
  Compass,
} from "lucide-react";

export default function SKYPage() {
  const happinessProgramUrl =
    process.env.NEXT_PUBLIC_HAPPINESS_PROGRAM_URL ||
    "https://www.artofliving.org/in-en/lp/yes-plus-program";

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const benefits = [
    "Reduced feelings of stress",
    "Improved emotional well-being",
    "Better focus and concentration",
    "Enhanced energy levels",
    "Improved sleep quality",
    "Greater resilience in daily life",
    "Increased sense of happiness and positivity",
    "Deep relaxation",
    "Improved mindfulness",
    "Better work-life balance",
  ];

  const faqs = [
    {
      q: "Is Sudarshan Kriya a meditation?",
      a: "It is primarily a guided rhythmic breathing practice that is often taught alongside meditation and yoga techniques.",
    },
    {
      q: "How long does a session take?",
      a: "The duration varies depending on the program and instructor, but regular home practice is typically shorter (around 20-30 minutes) than the initial guided learning sessions.",
    },
    {
      q: "Can beginners learn it?",
      a: "Yes. The technique is designed to be learned through certified instructors in programs like the Happiness Program, making it fully accessible to beginners.",
    },
    {
      q: "Is it connected to any religion?",
      a: "Sudarshan Kriya is taught strictly as a breathing and wellness practice. It is completely non-religious and open to people of all backgrounds, faiths, and beliefs.",
    },
    {
      q: "Are there any side effects?",
      a: "Sudarshan Kriya is a safe, natural practice when learned from a certified instructor. If you have specific medical conditions, like pregnancy, high blood pressure, or cardiovascular concerns, please consult your doctor first and inform your Art of Living teacher.",
    },
    {
      q: "Where can I practice it after the workshop?",
      a: "Once you complete the Happiness Program or the Online Meditation & Breath Workshop, you can practice Sudarshan Kriya at home daily. You also get access to weekly group follow-up sessions (Satsang/Sadhana) held online or at local Art of Living centers worldwide.",
    },
  ];

  const researchStats = [
    {
      value: "60%",
      label: "Cortisol Reduction",
      detail:
        "Significant decrease in stress hormone levels documented within 3 months of practice.",
      icon: Activity,
    },
    {
      value: "37%",
      label: "Increased Calmness",
      detail:
        "Measurable enhancement of mental peace and relaxation observed in just 4 weeks.",
      icon: Brain,
    },
    {
      value: "23%",
      label: "Reduced Anxiety",
      detail:
        "Sustained relief from everyday anxiety and distress after 6 weeks of regular practice.",
      icon: Shield,
    },
    {
      value: "31%",
      label: "Reduced Insomnia",
      detail:
        "Restores deep sleep cycles (stages III & IV) and improves overall rest in 8 weeks.",
      icon: Wind,
    },
    {
      value: "34%",
      label: "Reduction in Depression",
      detail:
        "Noticeable boost in mood and positive emotional states within 4 weeks.",
      icon: Sparkles,
    },
    {
      value: "33%",
      label: "Increased Prolactin",
      detail:
        "Significant increase in the well-being hormone from the very first session.",
      icon: Heart,
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
      <style>{`
        .sky-hero {
          background-image: url('/Gurudev/Gurudev.png');
        }
        @media (max-width: 1160px) and (min-width: 767.6px) {
          .sky-hero {
            background-image: url('/Gurudev/hero.png') !important;
            padding-bottom: 4rem !important;
          }
        }
        .sky-hero .sky-hero-subtitle {
          text-shadow: 0 1px 8px rgba(255,255,255,0.7), 0 0 2px rgba(255,255,255,0.5);
        }
        @media (max-width: 767.5px) {
          .sky-hero {
            background-image: none !important;
            height: auto !important;
            min-height: unset !important;
            padding: 140px 0 2rem 0 !important;
          }
          .sky-hero .sky-hero-title {
            color: #1c1f4a !important;
          }
          .sky-hero .sky-hero-subtitle {
            text-shadow: none !important;
          }
          .sky-hero .sky-hero-desc {
            color: #5a5e7a !important;
          }
          .sky-hero .sky-hero-btn {
            background: #1c1f4a !important;
            color: #ffffff !important;
          }
        }
      `}</style>
      <Navbar />
      <main
        style={{
          minHeight: "100vh",
          background: "#faf7f2",
          paddingBottom: 64,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          className="sky-hero"
          style={{
            position: "relative",
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#faf7f2",
            backgroundSize: "cover",
            backgroundPosition: "center",
            paddingTop: "100px",
            paddingBottom: "3rem",
          }}
        >
          {/* Back button container centered with hero content */}
          <div
            className="absolute top-[96px] left-0 right-0 z-10 pointer-events-none"
            style={{ position: "absolute" }}
          >
            <div className="max-w-[1200px] mx-auto px-8 w-full pointer-events-auto">
              <div style={{ marginLeft: "-0.5rem" }}>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#b86a16] hover:text-[#1c1f4a] md:text-[#faf7f2]/80 md:hover:text-white uppercase tracking-widest transition-all cursor-pointer group"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Back to Home
                </a>
              </div>
            </div>
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "1000px",
              width: "100%",
              margin: "0 auto",
              padding: "0 1.5rem",
              alignItems: "center",
              gap: "2rem",
              height: "100%",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                paddingLeft: "2rem",
              }}
            ></div>

            <div className="hidden md:block"></div>

            <div
              className="text-center md:text-right"
              style={{ alignSelf: "center", zIndex: 3 }}
            >
              <span
                className="sky-hero-subtitle"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#b86a16",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Discover Inner Peace Through the Power of Breath
              </span>

              <img
                src="/Gurudev/hero1.jpg"
                alt="Gurudev Sri Sri Ravi Shankar"
                className="block md:hidden"
                style={{
                  width: "100%",
                  maxWidth: 320,
                  margin: "1rem auto",
                  borderRadius: 16,
                  objectFit: "cover",
                }}
              />

              <h1
                className="sky-hero-title text-5xl md:text-[4.5rem]"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  color: "#faf7f2",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.1,
                }}
              >
                Sudarshan Kriya Yoga (SKY)
              </h1>

              <p
                className="sky-hero-desc md:ml-auto mx-auto"
                style={{
                  fontSize: "18px",
                  color: "#5a5e7a",
                  maxWidth: 500,
                  lineHeight: 1.6,
                  marginBottom: "2rem",
                }}
              >
                Sudarshan Kriya Yoga (SKY) is a powerful rhythmic breathing
                technique introduced by Sri Sri Ravi Shankar. It combines
                specific breathing patterns with yoga, meditation, and
                relaxation practices to help harmonize the body, mind, and
                emotions.
              </p>

              <div
                className="flex justify-center md:justify-end"
                style={{ gap: "1rem" }}
              >
                <a
                  className="sky-hero-btn"
                  href={happinessProgramUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "12px 24px",
                    background: "#ffffff",
                    color: "#1c1f4a",
                    borderRadius: "100px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    transition: "all 0.2s",
                  }}
                >
                  Begin Your Journey
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Introduction & Etymology */}
        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "5rem 1.5rem 5rem 1.5rem",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#b86a16",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              The Core Practice
            </span>
            <h2
              className="text-3xl md:text-4xl"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                color: "#1c1f4a",
                marginBottom: "1.5rem",
              }}
            >
              What is Sudarshan Kriya?
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#5a5e7a",
                lineHeight: 1.7,
                maxWidth: "800px",
                margin: "0 auto",
              }}
            >
              Developed by spiritual leader Gurudev Sri Sri Ravi Shankar,
              Sudarshan Kriya is a scientific, rhythmic breathing technique
              taught globally through the{" "}
              <a
                href="https://www.artofliving.org/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#b86a16",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Art of Living Foundation
              </a>
              . By aligning the breath with the natural biological rhythms of
              our system, the practice helps release deep-seated stress, clear
              mental clutter, and harmonize our emotions.
            </p>
          </div>
        </section>

        {/* Section 2: Scientific Research & Statistics */}
        <section
          style={{
            background: "#ffffff",
            borderTop: "1px solid rgba(28, 31, 74, 0.05)",
            borderBottom: "1px solid rgba(28, 31, 74, 0.05)",
            padding: "5rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#b86a16",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Science & Validation
              </span>
              <h2
                className="text-3xl md:text-4xl"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  color: "#1c1f4a",
                  marginBottom: "1.5rem",
                }}
              >
                Clinical Research on Sudarshan Kriya
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  color: "#5a5e7a",
                  lineHeight: 1.7,
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                Over{" "}
                <a
                  href="https://www.artofliving.org/in-en/research-on-sudarshan-kriya"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#b86a16",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  100 independent peer-reviewed studies
                </a>{" "}
                conducted across four continents have clinically proven the
                physical, endocrine, immune, and cardiovascular system benefits
                of Sudarshan Kriya Yoga.
              </p>
            </div>

            {/* Statistics Cards Grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              style={{ marginBottom: "4rem" }}
            >
              {researchStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    style={{
                      background: "#faf7f2",
                      borderRadius: "20px",
                      padding: "2rem",
                      border: "1px solid rgba(28, 31, 74, 0.04)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: "-10px",
                        bottom: "-10px",
                        opacity: 0.04,
                        color: "#1c1f4a",
                      }}
                    >
                      <IconComponent size={120} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          background: "#fdf0dc",
                          padding: "10px",
                          borderRadius: "12px",
                          color: "#b86a16",
                        }}
                      >
                        <IconComponent size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: "2.25rem",
                          fontWeight: 700,
                          color: "#1c1f4a",
                        }}
                      >
                        {stat.value}
                      </span>
                    </div>
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1c1f4a",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {stat.label}
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#5a5e7a",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {stat.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* In-depth Research Bullet Points */}
            <div
              style={{
                background: "#faf7f2",
                borderRadius: "24px",
                padding: "2.5rem",
                border: "1px solid rgba(28, 31, 74, 0.06)",
                boxShadow: "0 10px 40px rgba(28, 31, 74, 0.01)",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1c1f4a",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Zap style={{ color: "#b86a16" }} /> Additional Key Scientific
                Discoveries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: "DNA & Cellular Longevity",
                    text: "Studies show that SKY impacts genetic expression, reaching down to the molecular level to increase cellular lifespan and optimize gene activity in immune cells.",
                  },
                  {
                    title: "Enhanced Immune Function",
                    text: "Measurably increases defensive immune cell counts, specifically lymphocytes and Natural Killer (NK) cells, bolstering natural defense systems.",
                  },
                  {
                    title: "Cardiovascular Health",
                    text: "Promotes cardiovascular wellness by significantly reducing blood pressure, calming heart rates, and lowering both LDL (bad) cholesterol and total cholesterol.",
                  },
                  {
                    title: "Deep Stress Resilience",
                    text: "In stress tests, blood lactate levels in police cadets who did not learn SKY were 4 times higher than their trained classmates, indicating massive stress resilience.",
                  },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "0.75rem" }}>
                    <CheckCircle2
                      style={{
                        width: 18,
                        height: 18,
                        color: "#b86a16",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <div>
                      <h5
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#1c1f4a",
                          margin: "0 0 0.25rem 0",
                        }}
                      >
                        {item.title}
                      </h5>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#5a5e7a",
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="flex flex-col sm:flex-row justify-between items-center gap-6"
                style={{
                  marginTop: "2.5rem",
                  borderTop: "1px solid rgba(28, 31, 74, 0.06)",
                  paddingTop: "1.5rem",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9396ae",
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  *Data source: Peer-reviewed studies published in Harvard
                  Health, Journal of Affective Disorders, and Indian Journal of
                  Physiology and Pharmacology.
                </p>
                <a
                  href="https://www.artofliving.org/in-en/research-on-sudarshan-kriya"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "#1c1f4a",
                    color: "#ffffff",
                    padding: "10px 20px",
                    borderRadius: "100px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 15px rgba(28, 31, 74, 0.1)",
                    transition: "transform 0.2s",
                  }}
                  className="hover:scale-105"
                >
                  View Research Details
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Philosophy & Breath Connection */}
        <section
          style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(28, 31, 74, 0.05)",
                borderRadius: "24px",
                padding: "3rem 2.5rem",
                boxShadow: "0 10px 30px rgba(28, 31, 74, 0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#1c1f4a",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    background: "#fdf4e8",
                    borderRadius: "10px",
                    padding: "8px",
                    color: "#b86a16",
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
                  The Philosophy Behind SKY
                </h3>
              </div>
              <p
                style={{
                  fontSize: "15px",
                  color: "#5a5e7a",
                  lineHeight: 1.7,
                  marginBottom: "1rem",
                }}
              >
                Every emotion we feel corresponds directly to a specific pattern
                in our breath. For example, when you are angry, your breath
                becomes rapid and short. When you are calm, it is deep, slow,
                and steady.
              </p>
              <p
                style={{
                  fontSize: "15px",
                  color: "#5a5e7a",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Sudarshan Kriya reverses this dynamic. By consciously guiding
                the breath through specific, rhythmic cycles, we can
                deliberately transition the mind from stress, frustration, and
                exhaustion into a state of profound calmness, balance, and alert
                awareness.
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(28, 31, 74, 0.05)",
                borderRadius: "24px",
                padding: "3rem 2.5rem",
                boxShadow: "0 10px 30px rgba(28, 31, 74, 0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#1c1f4a",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    background: "#eaf2eb",
                    borderRadius: "10px",
                    padding: "8px",
                    color: "#6b8f71",
                  }}
                >
                  <Wind size={24} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
                  Why Breath Matters
                </h3>
              </div>
              <p
                style={{
                  fontSize: "15px",
                  color: "#5a5e7a",
                  lineHeight: 1.7,
                  marginBottom: "1rem",
                }}
              >
                Though we can survive weeks without food and days without water,
                breath is our most immediate fuel. Over 90% of the body's energy
                is supplied by breath, and yet we typically utilize only 30% of
                our lung capacity.
              </p>
              <p
                style={{
                  fontSize: "15px",
                  color: "#5a5e7a",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Conscious breathing techniques act as a bridge between the
                physical body and the mind. It is the most direct tool to quiet
                the sympathetic nervous system (fight-or-flight response) and
                activate the parasympathetic nervous system (rest-and-digest
                response) on demand.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Key Components Timeline */}
        <section
          style={{
            background: "#ffffff",
            borderTop: "1px solid rgba(28, 31, 74, 0.05)",
            borderBottom: "1px solid rgba(28, 31, 74, 0.05)",
            padding: "5rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#b86a16",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                The SKY Workshop Journey
              </span>
              <h2
                className="text-3xl md:text-4xl"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  color: "#1c1f4a",
                  marginBottom: "1.5rem",
                }}
              >
                Key Components of the Practice
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  color: "#5a5e7a",
                  lineHeight: 1.7,
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                Sudarshan Kriya Yoga is taught as a structured experience,
                combining breathing rhythms, light stretches, guided meditation,
                and lifestyle wisdom to deliver a holistic shift.
              </p>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-5 gap-6"
              style={{ position: "relative" }}
            >
              {[
                {
                  step: "01",
                  title: "Breath Awareness",
                  desc: "Cultivating mindful connection to the breath, training the mind to return to the present moment.",
                },
                {
                  step: "02",
                  title: "Pranayama",
                  desc: "Preparatory breathing exercises (like Ujjayi and Bhastrika) to clear channels and balance energy flows.",
                },
                {
                  step: "03",
                  title: "Sudarshan Kriya",
                  desc: "The core rhythmic breathing technique practiced under certified guidance for profound purification.",
                },
                {
                  step: "04",
                  title: "Guided Meditation",
                  desc: "Effortless, deep rest following the breathing cycles to tap into inner stillness and clarity.",
                },
                {
                  step: "05",
                  title: "Relaxation & Wisdom",
                  desc: "Integrating the physical and emotional shifts while engaging in light, practical life wisdom.",
                },
              ].map((comp, i) => (
                <div
                  key={i}
                  style={{
                    background: "#faf7f2",
                    borderRadius: "20px",
                    padding: "2rem 1.5rem",
                    border: "1px solid rgba(28, 31, 74, 0.05)",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      color: "rgba(184, 106, 22, 0.15)",
                      display: "block",
                      lineHeight: 1,
                      marginBottom: "1rem",
                    }}
                  >
                    {comp.step}
                  </span>
                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1c1f4a",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {comp.title}
                  </h4>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#5a5e7a",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {comp.desc}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <a
                href={happinessProgramUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#b86a16",
                  textDecoration: "underline",
                }}
              >
                <span>Find Upcoming SKY Happiness Workshops</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* Section 5: Gurudev Sri Sri Ravi Shankar Bio */}
        <section
          style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #fdf4e8 100%)",
              borderRadius: "32px",
              padding: "4rem 3rem",
              border: "1px solid rgba(184, 106, 22, 0.1)",
              boxShadow: "0 20px 50px rgba(184, 106, 22, 0.03)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4" style={{ textAlign: "center" }}>
                <img
                  src="/Gurudev/hero1.jpg"
                  alt="Gurudev Sri Sri Ravi Shankar"
                  style={{
                    width: "240px",
                    height: "240px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    margin: "0 auto",
                    border: "6px solid #ffffff",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  }}
                />
                <h4
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1c1f4a",
                    marginTop: "1.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  Gurudev Sri Sri Ravi Shankar
                </h4>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#b86a16",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Spiritual Leader & Peace Ambassador
                </span>
              </div>

              <div className="md:col-span-8">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#b86a16",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    display: "block",
                    marginBottom: "1rem",
                  }}
                >
                  The Founder's Vision
                </span>
                <blockquote
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "20px",
                    fontStyle: "italic",
                    color: "#1c1f4a",
                    lineHeight: 1.5,
                    borderLeft: "4px solid #b86a16",
                    paddingLeft: "1.5rem",
                    margin: "0 0 2rem 0",
                  }}
                >
                  "A disease-free body, quiver-free breath, stress-free mind,
                  inhibition-free intellect, obsession-free memory, ego-free
                  soul and sorrow-free relate is the birthright of every human
                  being."
                </blockquote>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#5a5e7a",
                    lineHeight: 1.7,
                    marginBottom: "1.5rem",
                  }}
                >
                  Gurudev Sri Sri Ravi Shankar is a globally recognized
                  humanitarian, spiritual teacher, and peace ambassador. He
                  founded the Art of Living Foundation in 1981 with the vision
                  of creating a stress-free and violence-free society through
                  breathing techniques, meditation, and service initiatives.
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#5a5e7a",
                    lineHeight: 1.7,
                    marginBottom: "2rem",
                  }}
                >
                  His pioneering work has inspired millions of volunteers across
                  more than 180 countries to initiate community service,
                  environmental regeneration, and educational empowerment,
                  fostering global unity and peace.
                </p>
                <a
                  href="https://gurudev.artofliving.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "#b86a16",
                    color: "#ffffff",
                    padding: "12px 28px",
                    borderRadius: "100px",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(184, 106, 22, 0.15)",
                    transition: "transform 0.2s",
                  }}
                  className="hover:scale-105"
                >
                  Visit Gurudev's Website
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: The Art of Living Foundation */}
        <section
          style={{
            background: "#ffffff",
            borderTop: "1px solid rgba(28, 31, 74, 0.05)",
            borderBottom: "1px solid rgba(28, 31, 74, 0.05)",
            padding: "5rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#b86a16",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Global Impact
                </span>
                <h2
                  className="text-3xl md:text-4xl"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    color: "#1c1f4a",
                    marginBottom: "1.5rem",
                    lineHeight: 1.2,
                  }}
                >
                  About the Art of Living Foundation
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#5a5e7a",
                    lineHeight: 1.7,
                    marginBottom: "1.5rem",
                  }}
                >
                  Founded in 1981, the Art of Living is a multi-faceted,
                  volunteer-based humanitarian NGO active in over{" "}
                  <strong> 180 countries</strong>. The foundation's programs
                  integrate yoga, meditation, and breathing techniques to
                  eliminate stress and foster personal and societal wellbeing.
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#5a5e7a",
                    lineHeight: 1.7,
                    marginBottom: "2rem",
                  }}
                >
                  Beyond health and wellness education, the organization has
                  spearheaded extensive grassroots social service initiatives,
                  touching more than{" "}
                  <strong>500 million (50 crore+) lives worldwide.</strong>
                </p>
                <a
                  href="https://www.artofliving.org/in-en/about-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    border: "2px solid #1c1f4a",
                    color: "#1c1f4a",
                    padding: "10px 24px",
                    borderRadius: "100px",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  className="hover:bg-slate-light"
                >
                  Learn More About Us
                  <ArrowRight size={16} />
                </a>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    {
                      icon: Globe,
                      title: "180+ Countries",
                      desc: "A massive worldwide community spanning six continents, operating via 10,000+ local centers.",
                    },
                    {
                      icon: Users,
                      title: "500M+ Lives Touched",
                      desc: "Empowering individuals across diverse backgrounds to experience stress relief and mental clarity.",
                    },
                    {
                      icon: Award,
                      title: "Social Impact & Service",
                      desc: "Active in conflict resolution, prison rehabilitation (800k+ inmates), and disaster relief globally.",
                    },
                    {
                      icon: Compass,
                      title: "Eco & Environment",
                      desc: "Rejuvenating 40+ dying rivers, planting millions of trees, and training farmers in natural agriculture.",
                    },
                  ].map((feat, idx) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#faf7f2",
                          border: "1px solid rgba(28, 31, 74, 0.05)",
                          borderRadius: "20px",
                          padding: "1.75rem",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.01)",
                        }}
                      >
                        <div
                          style={{
                            color: "#b86a16",
                            marginBottom: "1rem",
                          }}
                        >
                          <FeatIcon size={28} />
                        </div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#1c1f4a",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {feat.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#5a5e7a",
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {feat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: FAQ & Safety Warnings */}
        <section
          style={{ maxWidth: 900, margin: "0 auto", padding: "5rem 1.5rem" }}
        >
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#b86a16",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Common Queries
            </span>
            <h2
              className="text-3xl md:text-4xl"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                color: "#1c1f4a",
                marginBottom: "1.5rem",
              }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          {/* Accordion Layout */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginBottom: "4rem",
            }}
          >
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid rgba(28, 31, 74, 0.06)",
                    boxShadow: "0 4px 15px rgba(28, 31, 74, 0.01)",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: "100%",
                      padding: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "none",
                      border: "none",
                      outline: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <HelpCircle
                        size={18}
                        style={{ color: "#b86a16", flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1c1f4a",
                        }}
                      >
                        {faq.q}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#b86a16",
                        marginLeft: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      {isOpen ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: "0 1.5rem 1.5rem 1.5rem",
                        borderTop: "1px solid rgba(28, 31, 74, 0.03)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#5a5e7a",
                          lineHeight: 1.6,
                          margin: 0,
                          paddingLeft: "1.75rem",
                        }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Medical disclaimer panel */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              padding: "1.75rem",
              background: "#fdf0dc",
              borderRadius: "20px",
              border: "1px solid rgba(184, 106, 22, 0.15)",
            }}
          >
            <AlertCircle
              style={{
                width: 24,
                height: 24,
                color: "#b86a16",
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <div>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#b86a16",
                  margin: "0 0 0.5rem 0",
                }}
              >
                Important Health & Suitability Disclaimer
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#5a5e7a",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Sudarshan Kriya Yoga (SKY) should always be learned from a
                certified Art of Living instructor. Individuals with certain
                medical conditions, cardiovascular history, respiratory
                ailments, clinical psychological conditions, or who are
                currently pregnant should consult their healthcare provider and
                inform the workshop instructor prior to enrolling.
              </p>
            </div>
          </div>
        </section>

        {/* Section 8: Bottom Call to Action */}
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 2rem 6rem 2rem",
          }}
        >
          <div
            style={{
              background: "#1c1f4a",
              borderRadius: "32px",
              padding: "clamp(2rem, 5vw, 4.5rem) clamp(1.5rem, 4vw, 3rem)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 55px rgba(28, 31, 74, 0.15)",
            }}
          >
            {/* Background elements */}
            <div
              style={{
                position: "absolute",
                top: "-10%",
                left: "-10%",
                width: "40%",
                height: "50%",
                background:
                  "radial-gradient(circle, rgba(184, 106, 22, 0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-10%",
                right: "-10%",
                width: "40%",
                height: "50%",
                background:
                  "radial-gradient(circle, rgba(184, 106, 22, 0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: 600,
                color: "#faf7f2",
                marginBottom: "1.25rem",
                lineHeight: 1.2,
              }}
            >
              Begin Your Journey of Breath & Calm
            </h2>
            <p
              style={{
                fontSize: "clamp(14px, 2vw, 16px)",
                color: "#faf7f2",
                opacity: 0.85,
                lineHeight: 1.7,
                maxWidth: "700px",
                margin: "0 auto 2.5rem auto",
              }}
            >
              Experience the profound benefits of conscious breathing. Join the
              upcoming **Art of Living Happiness Program** to learn the
              Sudarshan Kriya from certified professionals, and receive support
              to sustain your practice for life.
            </p>

            <a
              href={happinessProgramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "16px 36px",
                background: "#faf7f2",
                color: "#1c1f4a",
                borderRadius: "100px",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "1px",
                transition: "all 0.2s",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
              className="hover:scale-105"
            >
              Register for a Program Today
              <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
