// SKYPage.jsx
"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import ChakraMeditation from "@/components/ChakraMeditation";
import {
  Brain,
  Heart,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Wind,
  Info,
  BookOpen,
  HelpCircle,
  AlertCircle
} from "lucide-react";

export default function SKYPage() {
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
      a: "The duration varies depending on the program and instructor, but regular home practice is typically shorter than the initial guided learning sessions.",
    },
    {
      q: "Can beginners learn it?",
      a: "Yes. The technique is designed to be learned through certified instructors, making it accessible to beginners.",
    },
    {
      q: "Is it connected to any religion?",
      a: "Sudarshan Kriya is generally taught as a breathing and wellness practice and is open to people of all backgrounds and beliefs.",
    },
  ];

  return (
    <>
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
          style={{
            position: "relative",
            width: "100%",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            color: "#faf7f2",
            backgroundImage: "url('/Gurudev/Gurudev.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "1000px",
              width: "100%",
              margin: "0 auto",
              padding: "0 1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
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
            <div></div>

            <div style={{ textAlign: "right", alignSelf: "center", zIndex: 3 }}>
              <span
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
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "4.5rem",
                  fontWeight: 600,
                  color: "#faf7f2",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.1,
                }}
              >
                Sudarshan Kriya Yoga (SKY)
              </h1>
              <p
                style={{
                  fontSize: "18px",
                  color: "#5a5e7a",
                  maxWidth: 500,
                  marginLeft: "auto",
                  lineHeight: 1.6,
                  marginBottom: "2rem",
                }}
              >
                Sudarshan Kriya Yoga (SKY) is a powerful rhythmic breathing technique introduced by Sri Sri Ravi Shankar. It combines specific breathing patterns with yoga, meditation, and relaxation practices to help harmonize the body, mind, and emotions.
              </p>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <a
                  href="https://www.artofliving.org/in-en/happiness-program"
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

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 1.5rem" }}>
          <p
            style={{
              fontSize: "16px",
              color: "#5a5e7a",
              lineHeight: 1.7,
              marginBottom: "3rem",
              textAlign: "center",
              maxWidth: "800px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Millions of people across the world practice Sudarshan Kriya as part of programs offered by the Art of Living Foundation. The technique is designed to help individuals experience greater calmness, clarity, and overall well-being.
          </p>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(28, 31, 74, 0.08)",
              borderLeft: "5px solid #b86a16",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(28, 31, 74, 0.02)",
              marginBottom: "2.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.75px",
                  background: "rgba(184, 106, 22, 0.08)",
                  color: "#b86a16",
                }}
              >
                <Info style={{ width: 12, height: 12 }} />
                Core Practice
              </span>
            </div>

            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#1c1f4a",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              What is Sudarshan Kriya?
            </h2>

            <p
              style={{
                fontSize: "15px",
                color: "#5a5e7a",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Sudarshan Kriya is a guided breathing practice that involves a sequence of slow, medium, and fast rhythmic breathing cycles. The word "Sudarshan" comes from Sanskrit:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0", color: "#1c1f4a" }}>
              <li style={{ marginBottom: "0.5rem" }}><strong>Su</strong> – Proper or Right</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Darshan</strong> – Vision or Perception</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Kriya</strong> – Purifying Action</li>
            </ul>
            <p
              style={{
                fontSize: "15px",
                color: "#5a5e7a",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Together, Sudarshan Kriya represents a practice that aims to bring a clearer perception of oneself and life through conscious breathing.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(28, 31, 74, 0.08)",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 4px 20px rgba(28, 31, 74, 0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1c1f4a", marginBottom: "1rem" }}>
                <BookOpen style={{ width: 24, height: 24, color: "#b86a16" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>The Philosophy Behind SKY</h3>
              </div>
              <p style={{ fontSize: "14px", color: "#5a5e7a", lineHeight: 1.6, marginBottom: "1rem" }}>
                Breath is closely connected to our emotions and state of mind. Different emotional states naturally create different breathing patterns. Sudarshan Kriya teaches conscious breathing techniques intended to:
              </p>
              <ul style={{ fontSize: "14px", color: "#5a5e7a", lineHeight: 1.6, paddingLeft: "1.2rem", margin: 0 }}>
                <li>Calm the nervous system</li>
                <li>Release accumulated stress</li>
                <li>Improved emotional balance</li>
                <li>Increase mental clarity</li>
                <li>Promote relaxation</li>
                <li>Foster inner peace</li>
              </ul>
              <p style={{ fontSize: "14px", color: "#5a5e7a", lineHeight: 1.6, marginTop: "1rem", fontStyle: "italic" }}>
                The practice emphasizes the connection between breath, body, mind, and consciousness.
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(28, 31, 74, 0.08)",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 4px 20px rgba(28, 31, 74, 0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1c1f4a", marginBottom: "1rem" }}>
                <Wind style={{ width: 24, height: 24, color: "#b86a16" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Why Breath Matters</h3>
              </div>
              <p style={{ fontSize: "14px", color: "#5a5e7a", lineHeight: 1.6, marginBottom: "1rem" }}>
                Our breath changes with every emotion:
              </p>
              <ul style={{ fontSize: "14px", color: "#5a5e7a", lineHeight: 1.6, paddingLeft: "1.2rem", margin: 0 }}>
                <li style={{ marginBottom: "0.5rem" }}><strong>Stress</strong> often leads to rapid, shallow breathing.</li>
                <li style={{ marginBottom: "0.5rem" }}><strong>Calmness</strong> is associated with slow, deep breathing.</li>
                <li style={{ marginBottom: "0.5rem" }}><strong>Conscious breathing</strong> can help influence our mental and emotional state.</li>
              </ul>
              <p style={{ fontSize: "14px", color: "#5a5e7a", lineHeight: 1.6, marginTop: "1rem" }}>
                Sudarshan Kriya uses these principles to encourage relaxation and emotional balance.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "4rem" }}>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2rem",
                fontWeight: 600,
                color: "#1c1f4a",
                marginBottom: "1.5rem",
                textAlign: "center"
              }}
            >
              Benefits of Sudarshan Kriya
            </h3>
            <p style={{ textAlign: "center", fontSize: "15px", color: "#5a5e7a", marginBottom: "2rem" }}>
              Many practitioners report experiencing benefits such as:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
              }}
            >
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(28, 31, 74, 0.05)",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    boxShadow: "0 2px 10px rgba(28, 31, 74, 0.01)",
                  }}
                >
                  <CheckCircle2 style={{ width: 18, height: 18, color: "#b86a16", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "#1c1f4a", fontWeight: 500 }}>{benefit}</span>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#888c9f", marginTop: "1.5rem", fontStyle: "italic" }}>
              *Some scientific studies have explored Sudarshan Kriya and found potential benefits for stress reduction and mental well-being, though individual experiences vary and it is not a substitute for medical treatment.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(28, 31, 74, 0.08)",
              borderTop: "5px solid #1c1f4a",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(28, 31, 74, 0.02)",
              marginBottom: "3rem",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#1c1f4a",
                margin: "0 0 1.5rem 0",
              }}
            >
              Key Components
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
              <div>
                <h4 style={{ fontSize: "15px", color: "#b86a16", margin: "0 0 0.5rem 0" }}>Breath Awareness</h4>
                <p style={{ fontSize: "14px", color: "#5a5e7a", margin: 0 }}>Learning to observe and regulate the breath.</p>
              </div>
              <div>
                <h4 style={{ fontSize: "15px", color: "#b86a16", margin: "0 0 0.5rem 0" }}>Pranayama</h4>
                <p style={{ fontSize: "14px", color: "#5a5e7a", margin: 0 }}>Preparatory breathing exercises that help balance energy.</p>
              </div>
              <div>
                <h4 style={{ fontSize: "15px", color: "#b86a16", margin: "0 0 0.5rem 0" }}>Sudarshan Kriya</h4>
                <p style={{ fontSize: "14px", color: "#5a5e7a", margin: 0 }}>The signature rhythmic breathing practice performed under the guidance of a certified instructor.</p>
              </div>
              <div>
                <h4 style={{ fontSize: "15px", color: "#b86a16", margin: "0 0 0.5rem 0" }}>Meditation</h4>
                <p style={{ fontSize: "14px", color: "#5a5e7a", margin: 0 }}>Quieting the mind and cultivating awareness.</p>
              </div>
              <div>
                <h4 style={{ fontSize: "15px", color: "#b86a16", margin: "0 0 0.5rem 0" }}>Relaxation</h4>
                <p style={{ fontSize: "14px", color: "#5a5e7a", margin: 0 }}>Allowing the body and mind to integrate the experience.</p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                borderTop: "1px solid rgba(28, 31, 74, 0.05)",
                paddingTop: "1rem",
                marginTop: "1.5rem",
              }}
            >
              <a
                href="/events?type=event"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1c1f4a",
                  textDecoration: "none",
                  transition: "gap 0.2s",
                }}
              >
                <span>Find Upcoming SKY Workshops</span>
                <ExternalLink style={{ width: 14, height: 14 }} />
              </a>
            </div>
          </div>
        </div>

        {/* CHANGED: 1. Add a divider from the previous section */}
        <hr style={{ border: 0, height: "1px", background: "rgba(28, 31, 74, 0.1)", margin: "0" }} />

        {/* CHANGED: 1. Give the chakra section its own premium section, Add 120-160px vertical padding, Subtle cream -> white radial gradient, Faint mandala pattern */}
        {/* CHANGED: 3. Increase overall width (max-width: 1400px, margin: auto, padding: 80px 40px) */}
        <div
          style={{
            position: "relative",
            padding: "140px 40px",
            background: "radial-gradient(circle at center, #ffffff 0%, #faf7f2 100%)",
            maxWidth: "1400px",
            margin: "0 auto",
            overflow: "hidden"
          }}
        >
          {/* Faint mandala pattern (3-5% opacity) */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: "radial-gradient(circle, rgba(184, 106, 22, 0.04) 2px, transparent 2px)",
              backgroundSize: "40px 40px",
              zIndex: 0,
              pointerEvents: "none"
            }}
          />

          {/* CHANGED: 2. Add a proper heading */}
          <div style={{ textAlign: "center", position: "relative", zIndex: 1, marginBottom: "4rem" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "3rem", fontWeight: 600, color: "#1c1f4a", marginBottom: "1rem" }}>
              The Seven Chakras
            </h2>
            <p style={{ fontSize: "16px", color: "#5a5e7a", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
              Explore the seven primary energy centers believed to influence physical vitality, emotional balance, mental clarity, and spiritual awareness.
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 1, marginBottom: "3rem" }}>
            {/* CHANGED: 4. Make meditation figure much larger (560px) */}
            <ChakraMeditation size={560} speed={1000} />
          </div>

          {/* CHANGED: 15. Add section ending */}
          <div style={{ textAlign: "center", position: "relative", zIndex: 1, marginTop: "5rem" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontStyle: "italic", color: "#1c1f4a", lineHeight: 1.6 }}>
              "When the breath flows freely,<br />
              the mind becomes calm,<br />
              and inner awareness naturally awakens."
            </p>
          </div>
        </div>

        {/* CHANGED: 15. Subtle divider before the next section */}
        <hr style={{ border: 0, height: "1px", background: "rgba(28, 31, 74, 0.1)", margin: "0", marginBottom: "4rem" }} />

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "4rem" }}>
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1c1f4a", marginBottom: "1rem" }}>Who Can Practice?</h3>
              <p style={{ fontSize: "15px", color: "#5a5e7a", lineHeight: 1.6, marginBottom: "1rem" }}>
                Sudarshan Kriya is generally suitable for adults of various backgrounds. Beginners typically learn the technique through certified instructors during official Art of Living programs.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", padding: "1rem", background: "rgba(184, 106, 22, 0.05)", borderRadius: "8px" }}>
                <AlertCircle style={{ width: 20, height: 20, color: "#b86a16", flexShrink: 0 }} />
                <p style={{ fontSize: "13px", color: "#b86a16", margin: 0, lineHeight: 1.5 }}>
                  Individuals with certain medical conditions or pregnancy should consult their healthcare provider and inform the instructor before participating.
                </p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1c1f4a", marginBottom: "1rem" }}>About Sri Sri Ravi Shankar</h3>
              <p style={{ fontSize: "15px", color: "#5a5e7a", lineHeight: 1.6 }}>
                Sri Sri Ravi Shankar is a globally recognized humanitarian, spiritual teacher, and peace ambassador. He founded the Art of Living Foundation in 1981 with the vision of creating a stress-free and violence-free society through breathing techniques, meditation, education, and service initiatives.
              </p>
              <p style={{ fontSize: "15px", color: "#5a5e7a", lineHeight: 1.6, marginTop: "1rem" }}>
                His teachings have reached millions of people across more than 180 countries through programs focused on personal development, mental well-being, and community service.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "4rem" }}>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2rem",
                fontWeight: 600,
                color: "#1c1f4a",
                marginBottom: "1.5rem",
                textAlign: "center"
              }}
            >
              Frequently Asked Questions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "800px", margin: "0 auto" }}>
              {faqs.map((faq, index) => (
                <div key={index} style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(28, 31, 74, 0.05)" }}>
                  <h4 style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "16px", color: "#1c1f4a", margin: "0 0 0.5rem 0" }}>
                    <HelpCircle style={{ width: 18, height: 18, color: "#b86a16", marginTop: "2px", flexShrink: 0 }} />
                    {faq.q}
                  </h4>
                  <p style={{ fontSize: "14px", color: "#5a5e7a", margin: 0, paddingLeft: "1.6rem", lineHeight: 1.6 }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto", borderTop: "1px solid rgba(28, 31, 74, 0.1)", paddingTop: "3rem" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#1c1f4a", marginBottom: "1rem" }}>Begin Your Journey</h3>
            <p style={{ fontSize: "16px", color: "#5a5e7a", lineHeight: 1.6, marginBottom: "2rem" }}>
              Experience the transformative potential of conscious breathing and discover greater calmness, clarity, and inner balance through Sudarshan Kriya Yoga. Whether you are seeking stress relief, emotional resilience, or personal growth, this timeless breathing practice offers a structured path toward holistic well-being.
            </p>
            <a
              href="https://www.artofliving.org/in-en/happiness-program"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "14px 32px",
                background: "#1c1f4a",
                color: "#ffffff",
                borderRadius: "100px",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "1px",
                transition: "all 0.2s",
                marginBottom: "3rem"
              }}
            >
              Register for a Program Today
            </a>
            <p style={{ fontSize: "12px", color: "#888c9f", lineHeight: 1.5 }}>
              <strong>Disclaimer:</strong> Sudarshan Kriya should be learned from a certified instructor. It is intended to support general well-being and is not a replacement for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}