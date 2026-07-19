import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema/contacts";
import { sql } from "drizzle-orm";
import {
  Contact,
  Globe,
  Database,
  Radio,
  ArrowRight,
  TrendingUp,
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

  // Query stats
  let totalContacts = 0;
  let activeContactEmail = "None";
  try {
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(contacts);
    totalContacts = Number(countResult[0]?.count || 0);

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
      description: "Currently displayed on the landing page",
      icon: Contact,
      color: "border-[#b86a16]/30 text-[#b86a16] bg-[#b86a16]/5",
    },
    {
      title: "Contact History Sets",
      value: totalContacts,
      description: "Total contact records in database",
      icon: Database,
      color: "border-[#c4796a]/30 text-[#c4796a] bg-[#c4796a]/5",
    },
    {
      title: "Database Sync",
      value: "Postgres",
      description: "Connected to Supabase Postgres",
      icon: TrendingUp,
      color: "border-[#6b8f71]/30 text-[#6b8f71] bg-[#6b8f71]/5",
    },
    {
      title: "Realtime Server",
      value: "Active",
      description: "Listening to db triggers via Supabase",
      icon: Radio,
      color: "border-[#4a6fa5]/30 text-[#4a6fa5] bg-[#4a6fa5]/5",
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
          Welcome, {session?.user?.name || "Administrator"}. Here is the overview of your system.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="flex flex-col justify-between py-4 border-[#e8dcc4] bg-white rounded-xl shadow-xs">
              <CardContent className="p-0 px-4 flex flex-col justify-between h-full min-h-[90px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[#9396ae] uppercase tracking-wider truncate">
                      {card.title}
                    </p>
                    <h3 className="text-sm font-bold text-[#1c1f4a] mt-1 truncate">
                      {card.value}
                    </h3>
                  </div>
                  <div className={`p-1.5 rounded-lg border shrink-0 ${card.color}`}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Manage Contacts Card */}
        <Card className="border-[#e8dcc4] bg-white p-1 rounded-xl shadow-xs">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base font-bold text-[#1c1f4a] font-display">
              Manage Contact Details
            </CardTitle>
            <CardDescription className="text-[11px] text-[#5a5e7a] mt-0.5 leading-relaxed">
              Create, read, update, or delete dynamic contact details (email, phone, location, and social links) displayed publicly.
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
        <Card className="border-[#e8dcc4] bg-white p-1 rounded-xl shadow-xs">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base font-bold text-[#1c1f4a] font-display">
              View Public Website
            </CardTitle>
            <CardDescription className="text-[11px] text-[#5a5e7a] mt-0.5 leading-relaxed">
              Open the main public facing portfolio. Any changes in the contact CRUD dashboard reflect immediately on the site.
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
