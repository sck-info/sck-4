import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema/contacts";
import { aboutSlides } from "@/db/schema/about_slides";
import { metrics } from "@/db/schema/metrics";
import { gallery } from "@/db/schema/gallery";
import { sql } from "drizzle-orm";
import {
  Contact,
  Globe,
  Database,
  ArrowRight,
  TrendingUp,
  Images,
  Camera,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  // Query database statistics
  let totalContacts = 0;
  let totalAboutSlides = 0;
  let totalMetrics = 0;
  let totalGallery = 0;
  let activeContactEmail = "None";

  try {
    const contactCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);
    totalContacts = Number(contactCount[0]?.count || 0);

    const aboutCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(aboutSlides);
    totalAboutSlides = Number(aboutCount[0]?.count || 0);

    const metricsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(metrics);
    totalMetrics = Number(metricsCount[0]?.count || 0);

    const galleryCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(gallery);
    totalGallery = Number(galleryCount[0]?.count || 0);

    const activeList = await db
      .select({ email: contacts.email })
      .from(contacts)
      .where(sql`${contacts.isActive} = true`)
      .limit(1);

    if (activeList.length > 0 && activeList[0].email) {
      activeContactEmail = activeList[0].email;
    }
  } catch (err) {
    console.error("Failed to query dashboard statistics:", err);
  }

  const cards = [
    {
      title: "Active Contact Detail",
      value: activeContactEmail,
      description: "Currently displayed on the website contact links",
      icon: Contact,
      color: "border-[#b86a16]/30 text-[#b86a16] bg-[#b86a16]/5",
    },
    {
      title: "Gallery Collection",
      value: `${totalGallery} Items`,
      description: "Total uploaded masonry gallery photos",
      icon: Camera,
      color: "border-[#4a6fa5]/30 text-[#4a6fa5] bg-[#4a6fa5]/5",
    },
    {
      title: "Slideshow Assets",
      value: `${totalAboutSlides} Slides`,
      description: "Rotating slides in the About section carousel",
      icon: Images,
      color: "border-[#c4796a]/30 text-[#c4796a] bg-[#c4796a]/5",
    },
    {
      title: "Landing Page Metrics",
      value: `${totalMetrics} Stats`,
      description: "Dynamic performance markers inside our impact bar",
      icon: TrendingUp,
      color: "border-[#6b8f71]/30 text-[#6b8f71] bg-[#6b8f71]/5",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
          Overview
        </h1>
        <p className="text-xs text-[#5a5e7a] mt-1">
          Welcome, {session?.user?.name || "Administrator"}. Here is the
          overview of your system.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="flex flex-col justify-between py-4 border-[#e8dcc4] bg-white rounded-xl shadow-xs"
            >
              <CardContent className="p-0 px-4 flex flex-col justify-between h-full min-h-[90px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[#9396ae] uppercase tracking-wider truncate">
                      {card.title}
                    </p>
                    <h3
                      className="text-sm font-bold text-[#1c1f4a] mt-1 truncate"
                      title={card.value.toString()}
                    >
                      {card.value}
                    </h3>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg border shrink-0 ${card.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-[#5a5e7a] mt-3 font-medium leading-tight">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {/* Manage Gallery Card */}
        <Card className="border-[#e8dcc4] bg-white p-1 rounded-xl shadow-xs flex flex-col justify-between">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base font-bold text-[#1c1f4a] font-display">
              Manage Public Gallery
            </CardTitle>
            <CardDescription className="text-[11px] text-[#5a5e7a] mt-0.5 leading-relaxed">
              Upload picture files directly to your Cloudinary storage folder,
              add captions, and choose highlights to feature in the marquee
              scroll.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-1">
            <Link
              href="/dashboard/gallery"
              className="inline-flex items-center justify-center gap-2 h-8.5 px-4 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              Open Gallery CRUD
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Manage About Slides Card */}
        <Card className="border-[#e8dcc4] bg-white p-1 rounded-xl shadow-xs flex flex-col justify-between">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base font-bold text-[#1c1f4a] font-display">
              Manage About Slideshow
            </CardTitle>
            <CardDescription className="text-[11px] text-[#5a5e7a] mt-0.5 leading-relaxed">
              Configure and upload slideshow images, tags, and display weight
              metrics in the landing page About carousel.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-1">
            <Link
              href="/dashboard/about-slides"
              className="inline-flex items-center justify-center gap-2 h-8.5 px-4 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              Open About Slides CRUD
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Manage Metrics Card */}
        <Card className="border-[#e8dcc4] bg-white p-1 rounded-xl shadow-xs flex flex-col justify-between">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base font-bold text-[#1c1f4a] font-display">
              Manage Impact Metrics
            </CardTitle>
            <CardDescription className="text-[11px] text-[#5a5e7a] mt-0.5 leading-relaxed">
              Update statistics, numbers, and impact labels displayed in the
              dynamic counts bar.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-1">
            <Link
              href="/dashboard/metrics"
              className="inline-flex items-center justify-center gap-2 h-8.5 px-4 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              Open Metrics CRUD
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Manage Contacts Card */}
        <Card className="border-[#e8dcc4] bg-white p-1 rounded-xl shadow-xs flex flex-col justify-between">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base font-bold text-[#1c1f4a] font-display">
              Manage Contact Details
            </CardTitle>
            <CardDescription className="text-[11px] text-[#5a5e7a] mt-0.5 leading-relaxed">
              Create, read, update, or delete dynamic contact details (email,
              phone, location, and social links) displayed publicly.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-1">
            <Link
              href="/dashboard/contacts"
              className="inline-flex items-center justify-center gap-2 h-8.5 px-4 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              Open Contact CRUD
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* View Landing Page Card */}
        <Card className="border-[#e8dcc4] bg-white p-1 rounded-xl shadow-xs flex flex-col justify-between">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base font-bold text-[#1c1f4a] font-display">
              View Public Website
            </CardTitle>
            <CardDescription className="text-[11px] text-[#5a5e7a] mt-0.5 leading-relaxed">
              Open the main public facing portfolio. All dynamic database
              changes reflect instantly in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-8.5 px-4 rounded-full border border-[#e8dcc4] bg-[#faf7f2] hover:bg-white text-[#1c1f4a] font-semibold text-xs transition-all cursor-pointer"
            >
              Visit Landing Page
              <Globe className="w-3.5 h-3.5" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
