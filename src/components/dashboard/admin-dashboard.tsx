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
  Calendar,
  AlertTriangle,
  Star,
  CheckCircle,
  FileText,
  MapPin,
  QrCode,
  HelpCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type BookingStatusRow = {
  status: string;
  count: number;
};

type BookingFormatRow = {
  format: string;
  count: number;
};

type SlotStatusRow = {
  status: string;
  count: number;
};

type BookingsBySubCategoryRow = {
  name: string;
  Bookings: number;
};

type StatsData = {
  totalAboutSlides: number;
  totalMetrics: number;
  totalGallery: number;
  totalQueries: number;
  pendingQueries: number;
  totalUsers: number;
  totalBookings: number;
  totalDrafts: number;
  totalSlots: number;
  totalCategories: number;
  totalOfferings: number;
  totalLocations: number;
  totalPaymentQrs: number;
  totalQuestions: number;
  bookingsByStatus: BookingStatusRow[];
  bookingsByFormat: BookingFormatRow[];
  slotsByStatus: SlotStatusRow[];
  averageRating: number;
  bookingsBySubCategory: BookingsBySubCategoryRow[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({
    totalAboutSlides: 0,
    totalMetrics: 0,
    totalGallery: 0,
    totalQueries: 0,
    pendingQueries: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalDrafts: 0,
    totalSlots: 0,
    totalCategories: 0,
    totalOfferings: 0,
    totalLocations: 0,
    totalPaymentQrs: 0,
    totalQuestions: 0,
    bookingsByStatus: [],
    bookingsByFormat: [],
    slotsByStatus: [],
    averageRating: 0,
    bookingsBySubCategory: [],
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  useRealtime(["users", "user_queries", "gallery", "about_slides", "metrics", "bookings", "booking_drafts", "offering_slots", "feedbacks"], fetchStats);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
        <p className="text-xs text-[#5a5e7a] font-medium">Synchronizing overview tracker...</p>
      </div>
    );
  }

  // Color mapping
  const STATUS_COLORS: Record<string, string> = {
    confirmed: "#6b8f71", // Sage green
    pending: "#b86a16",   // Brand amber
    completed: "#1c1f4a", // Navy
    cancelled: "#c4796a", // Terracotta
    cancellation_pending: "#7a5e9a", // Purple
  };

  const FORMAT_COLORS: Record<string, string> = {
    online: "#4a6fa5",  // Slate blue
    offline: "#b86a16", // Brand amber
  };

  // 1. KPI cards mapping (All titles uppercase!)
  const kpis = [
    {
      title: "TOTAL BOOKINGS",
      value: stats.totalBookings,
      description: "Successful registration checkouts",
      icon: Calendar,
      color: "border-[#b86a16]/30 text-[#b86a16] bg-[#b86a16]/5",
    },
    {
      title: "ACTIVE USERS",
      value: stats.totalUsers,
      description: "Registered seeker accounts",
      icon: Users,
      color: "border-[#6b8f71]/30 text-[#6b8f71] bg-[#6b8f71]/5",
    },
    {
      title: "ABANDONED LEADS",
      value: stats.totalDrafts,
      description: "Dropped out before payment",
      icon: AlertTriangle,
      color: "border-[#c4796a]/30 text-[#c4796a] bg-[#c4796a]/5",
    },
    {
      title: "FEEDBACK SCORE",
      value: `${stats.averageRating} / 5`,
      description: "Average customer rating score",
      icon: Star,
      color: "border-[#e5c158]/30 text-[#e5c158] bg-[#e5c158]/5",
    },
    {
      title: "PENDING QUERIES",
      value: stats.pendingQueries,
      description: "Awaiting WhatsApp gateway replies",
      icon: MessageSquare,
      color: "border-[#7a5e9a]/30 text-[#7a5e9a] bg-[#7a5e9a]/5",
    },
    {
      title: "ANNOUNCED SLOTS",
      value: stats.totalSlots,
      description: "Time blocks configured",
      icon: CheckCircle,
      color: "border-[#4a6fa5]/30 text-[#4a6fa5] bg-[#4a6fa5]/5",
    },
  ];

  // Pie chart data
  const pieData = stats.bookingsByStatus.map(item => ({
    name: item.status.replace("_", " ").toUpperCase(),
    value: item.count,
    color: STATUS_COLORS[item.status] || "#9396ae",
  }));

  // Bar chart data
  const barData = stats.bookingsByFormat.map(item => ({
    name: item.format.toUpperCase(),
    Bookings: item.count,
    color: FORMAT_COLORS[item.format] || "#b86a16",
  }));

  // Slots utilization
  const totalSlotsCount = stats.totalSlots;
  const bookedSlots = stats.slotsByStatus.find(s => s.status === "booked")?.count || 0;
  const availableSlots = stats.slotsByStatus.find(s => s.status === "available")?.count || 0;
  const utilizationRate = totalSlotsCount > 0 ? Math.round((bookedSlots / totalSlotsCount) * 100) : 0;

  // Static Assets mapping
  const staticAssets = [
    {
      label: "SLIDESHOW ASSETS",
      value: stats.totalAboutSlides,
      subLabel: "Active Carousel Slides",
      icon: Images,
      bgColor: "bg-[#c4796a]/10",
      textColor: "text-[#c4796a]",
    },
    {
      label: "GALLERY COLLECTION",
      value: stats.totalGallery,
      subLabel: "Uploaded Photos",
      icon: Camera,
      bgColor: "bg-[#4a6fa5]/10",
      textColor: "text-[#4a6fa5]",
    },
    {
      label: "IMPACT METRICS",
      value: stats.totalMetrics,
      subLabel: "Configured Statistics",
      icon: TrendingUp,
      bgColor: "bg-[#6b8f71]/10",
      textColor: "text-[#6b8f71]",
    },
    {
      label: "OFFERING CATEGORIES",
      value: stats.totalCategories,
      subLabel: "Configured Folders",
      icon: Layers,
      bgColor: "bg-[#b86a16]/10",
      textColor: "text-[#b86a16]",
    },
    {
      label: "PROGRAM OFFERINGS",
      value: stats.totalOfferings,
      subLabel: "Active Sessions",
      icon: Sparkles,
      bgColor: "bg-[#7a5e9a]/10",
      textColor: "text-[#7a5e9a]",
    },
    {
      label: "CLINIC LOCATIONS",
      value: stats.totalLocations,
      subLabel: "Clinic & virtual sites",
      icon: MapPin,
      bgColor: "bg-[#4a6fa5]/10",
      textColor: "text-[#4a6fa5]",
    },
    {
      label: "PAYMENT QR CODES",
      value: stats.totalPaymentQrs,
      subLabel: "Active QR mappings",
      icon: QrCode,
      bgColor: "bg-[#6b8f71]/10",
      textColor: "text-[#6b8f71]",
    },
    {
      label: "SCREENING QUESTIONS",
      value: stats.totalQuestions,
      subLabel: "Active form prompts",
      icon: HelpCircle,
      bgColor: "bg-[#c4796a]/10",
      textColor: "text-[#c4796a]",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-[#e8dcc4] pb-5">
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">ADMINISTRATOR DASHBOARD</h1>
        <p className="text-xs text-[#5a5e7a] mt-1 font-medium">Real-time business performance analytics, booking flows, and website engagement indicators.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={idx}
              className="flex flex-col justify-between py-4 border-[#e8dcc4] bg-white rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300"
            >
              <CardContent className="p-0 px-5 flex flex-col justify-between h-full min-h-[95px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider truncate">
                      {kpi.title}
                    </p>
                    <h3 className="text-xl font-bold text-[#1c1f4a] mt-1.5 truncate">
                      {kpi.value}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-xl border shrink-0 ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-[#5a5e7a] mt-3 font-semibold leading-tight flex items-center">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution Donut Chart */}
        <Card className="border-[#e8dcc4] bg-white rounded-2xl shadow-xs">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-xs font-bold text-[#1c1f4a] uppercase">Booking Status Distribution</CardTitle>
            <CardDescription className="text-[10px] text-[#5a5e7a] font-medium">Proportion of registrations by status code</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 h-72">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-[#5a5e7a]">
                No booking metrics available to analyze yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e8dcc4",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontFamily: "sans-serif",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[10px] font-bold text-[#1c1f4a] uppercase">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Format Delivery Preference */}
        <Card className="border-[#e8dcc4] bg-white rounded-2xl shadow-xs">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-xs font-bold text-[#1c1f4a] uppercase">Service Format Preference</CardTitle>
            <CardDescription className="text-[10px] text-[#5a5e7a] font-medium">Online video consults vs Clinic walk-in bookings</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 h-72">
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-[#5a5e7a]">
                No delivery format metrics recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#1c1f4a", fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#5a5e7a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(28, 31, 74, 0.03)" }}
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e8dcc4",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="Bookings" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Slot Booking Utilization + Program Sub-category analytics (Horizontal Bar Chart) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Slot Booking Utilization */}
        <Card className="border-[#e8dcc4] bg-white rounded-2xl shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1c1f4a] uppercase">Time Slot Utilization</h3>
            <p className="text-[10px] text-[#5a5e7a] mt-0.5 font-medium">Ratio of booked vs total active slots</p>
          </div>

          <div className="relative flex items-center justify-center py-6">
            {/* SVG Radial Progress */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="50"
                stroke="#faf7f2"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="50"
                stroke="#b86a16"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * utilizationRate) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-[#1c1f4a]">{utilizationRate}%</span>
              <p className="text-[8px] text-[#5a5e7a] font-bold uppercase tracking-wider mt-0.5">Booked Rate</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#e8dcc4]/50 pt-4">
            <div className="flex justify-between text-xs font-bold text-[#5a5e7a]">
              <span>BOOKED SLOTS</span>
              <span className="font-mono text-[#1c1f4a]">{bookedSlots}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-[#5a5e7a]">
              <span>AVAILABLE SLOTS</span>
              <span className="font-mono text-[#1c1f4a]">{availableSlots}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-[#5a5e7a]">
              <span>TOTAL CONFIGURED</span>
              <span className="font-mono text-[#1c1f4a]">{totalSlotsCount}</span>
            </div>
          </div>
        </Card>

        {/* Right: Program Subcategory Wise Stats (Horizontal Bar Chart) */}
        <Card className="border-[#e8dcc4] bg-white rounded-2xl shadow-xs md:col-span-2 p-6 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2 border-b border-gray-100 p-0 mb-4">
            <CardTitle className="text-xs font-bold text-[#1c1f4a] uppercase">Sub-category Booking Breakdown</CardTitle>
            <CardDescription className="text-[10px] text-[#5a5e7a] font-medium">Distribution of seeker registrations across offering programs</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 h-64">
            {stats.bookingsBySubCategory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-[#5a5e7a]">
                No offering registrations recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.bookingsBySubCategory}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: "#5a5e7a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 8, fill: "#1c1f4a", fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(184, 106, 22, 0.04)" }}
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e8dcc4",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar
                    dataKey="Bookings"
                    fill="#b86a16"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Website Static Assets Overview (Full width row only!) */}
      <Card className="border-[#e8dcc4] bg-white rounded-2xl shadow-xs p-6">
        <div className="border-b border-[#e8dcc4]/40 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#b86a16]" />
            <h3 className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider">Website Static Assets Overview</h3>
          </div>
          <p className="text-[10px] text-[#5a5e7a] mt-0.5 font-medium">Summary of active content, structures, payment gateways, and screening forms configured on the website.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {staticAssets.map((asset, idx) => {
            const Icon = asset.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#e8dcc4] p-5 rounded-2xl flex flex-col justify-between hover:border-[#b86a16] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider line-clamp-1">
                    {asset.label}
                  </span>
                  <div className={`p-2 rounded-xl shrink-0 ${asset.bgColor} ${asset.textColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-[#1c1f4a]">{asset.value}</div>
                  <div className="text-[9px] text-[#5a5e7a] font-bold uppercase mt-1">
                    {asset.subLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
