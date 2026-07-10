import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
