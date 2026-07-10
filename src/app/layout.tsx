import type { Metadata } from "next";
import { Playfair_Display, Martel } from "next/font/google";
import "./globals.css";
import SecurityWrapper from "@/components/SecurityWrapper";

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const martelFont = Martel({
  variable: "--font-hindi",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Sharath Chandra Kancherla — Holistic Wellness Coach & Healer",
  description:
    "Life Skills Facilitator, Mind & Breath Expert, AOL Faculty, Professional Singer. CST, Rakkenho, Music Therapy, Vedic Astrology, NLP & more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${martelFont.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem("hasSeenIntro") !== "true") {
                  document.documentElement.classList.add("intro-active");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <SecurityWrapper>{children}</SecurityWrapper>
      </body>
    </html>
  );
}
