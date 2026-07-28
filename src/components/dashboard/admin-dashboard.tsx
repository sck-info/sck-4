import React from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aboutSlides, metrics, gallery, userQueries, users } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import {
  TrendingUp,
  Images,
  Camera,
  MessageSquare,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboard() {
  const session = await auth();

  let totalAboutSlides = 0;
  let totalMetrics = 0;
  let totalGallery = 0;
  let totalQueries = 0;
  let pendingQueries = 0;
  let totalUsers = 0;

  try {
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

    const queriesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(userQueries);
    totalQueries = Number(queriesCount[0]?.count || 0);

    const pendingQueriesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(userQueries)
      .where(eq(userQueries.status, "pending"));
    pendingQueries = Number(pendingQueriesCount[0]?.count || 0);

    const usersCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    totalUsers = Number(usersCount[0]?.count || 0);
  } catch (err) {
    console.error("Failed to query dashboard statistics:", err);
  }

  const cards = [
    {
      title: "User Queries",
      value: `${totalQueries} Messages`,
      description: `${pendingQueries} pending WhatsApp replies remaining`,
      icon: MessageSquare,
      color: "border-[#7a5e9a]/30 text-[#7a5e9a] bg-[#7a5e9a]/5",
    },
    {
      title: "Registered Users",
      value: `${totalUsers} Accounts`,
      description: "Active logins for client portals and dashboard",
      icon: Users,
      color: "border-[#6b8f71]/30 text-[#6b8f71] bg-[#6b8f71]/5",
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
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
          Overview
        </h1>
        <p className="text-xs text-[#5a5e7a] mt-1">
          Welcome, {session?.user?.name || "Administrator"}. Here is the
          overview of your system.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}
