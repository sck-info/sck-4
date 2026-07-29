"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import {
  TrendingUp,
  Images,
  Camera,
  MessageSquare,
  Users,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAboutSlides: 0,
    totalMetrics: 0,
    totalGallery: 0,
    totalQueries: 0,
    pendingQueries: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load dashboard metrics.");
      const json = await res.json();
      if (json.data) {
        setStats(json.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time synchronization
  useRealtime(["users", "user_queries", "gallery", "about_slides", "metrics"], fetchStats);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
        <p className="text-xs text-[#5a5e7a] font-medium">Synchronizing overview tracker...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "User Queries",
      value: `${stats.totalQueries} Messages`,
      description: `${stats.pendingQueries} pending WhatsApp replies remaining`,
      icon: MessageSquare,
      color: "border-[#7a5e9a]/30 text-[#7a5e9a] bg-[#7a5e9a]/5",
    },
    {
      title: "Registered Users",
      value: `${stats.totalUsers} Accounts`,
      description: "Active logins for client portals and dashboard",
      icon: Users,
      color: "border-[#6b8f71]/30 text-[#6b8f71] bg-[#6b8f71]/5",
    },
    {
      title: "Gallery Collection",
      value: `${stats.totalGallery} Items`,
      description: "Total uploaded masonry gallery photos",
      icon: Camera,
      color: "border-[#4a6fa5]/30 text-[#4a6fa5] bg-[#4a6fa5]/5",
    },
    {
      title: "Slideshow Assets",
      value: `${stats.totalAboutSlides} Slides`,
      description: "Rotating slides in the About section carousel",
      icon: Images,
      color: "border-[#c4796a]/30 text-[#c4796a] bg-[#c4796a]/5",
    },
    {
      title: "Landing Page Metrics",
      value: `${stats.totalMetrics} Stats`,
      description: "Dynamic performance markers inside our impact bar",
      icon: TrendingUp,
      color: "border-[#6b8f71]/30 text-[#6b8f71] bg-[#6b8f71]/5",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Administrator Overview</h1>
        <p className="text-xs text-[#5a5e7a] mt-1">Real-time status updates across database channels.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
