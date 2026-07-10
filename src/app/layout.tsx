import type { Metadata } from "next";
import "./globals.css";
import SecurityWrapper from "@/components/SecurityWrapper";

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
