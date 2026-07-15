import type { Metadata } from "next";
import { Playfair_Display, Martel } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://www.sharathkancherla.com"),
  title: {
    default: "Sharath Chandra Kancherla — Holistic Wellness Coach & Healer",
    template: "%s | Sharath Chandra Kancherla",
  },
  description:
    "Life Skills Facilitator, Mind & Breath Expert, AOL Faculty, Professional Singer. CST, Rakkenho, Music Therapy, Vedic Astrology, NLP & more.",
  keywords: [
    "Sharath Chandra Kancherla",
    "Holistic Wellness Coach",
    "Healer",
    "Life Skills Facilitator",
    "Mind & Breath Expert",
    "AOL Faculty",
    "Professional Singer",
    "CranioSacral Therapy",
    "CST",
    "Rakkenho",
    "Music Therapy",
    "Vedic Astrology",
    "NLP Coach",
    "Wellness Coach India",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sharath Chandra Kancherla — Holistic Wellness Coach & Healer",
    description:
      "Transformative 1-on-1 sessions and workshops in CranioSacral Therapy, Rakkenho, Music Therapy, Vedic Astrology, and NLP by Sharath Chandra Kancherla.",
    url: "https://www.sharathkancherla.com",
    siteName: "Sharath Chandra Kancherla",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/profile-hero.jpg",
        width: 1200,
        height: 630,
        alt: "Sharath Chandra Kancherla — Holistic Wellness Coach & Healer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sharath Chandra Kancherla — Holistic Wellness Coach & Healer",
    description:
      "Transformative 1-on-1 sessions and workshops in CranioSacral Therapy, Rakkenho, Music Therapy, Vedic Astrology, and NLP by Sharath Chandra Kancherla.",
    images: ["/images/profile-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${martelFont.variable}`}
    >
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
      <body>{children}</body>
    </html>
  );
}
