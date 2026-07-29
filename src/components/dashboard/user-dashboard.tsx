"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  ClipboardList,
  Activity,
  CheckCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate, formatTimeRange } from "@/lib/format";

type Booking = {
  id: string;
  status:
    | "pending"
    | "confirmed"
    | "cancellation_pending"
    | "cancelled"
    | "completed";
  selectedFormat: string | null;
  paymentReceiptUrl: string | null;
  createdAt: string;
  subCategory: {
    id: string;
    name: string;
  };
  slot: {
    id: string;
    slotDate: string;
    startTime: string;
    endTime: string;
  } | null;
};

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?page=1&limit=100`);
      if (!res.ok) throw new Error("Failed to load bookings");
      const json = await res.json();
      setBookings(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchBookings();
    }
  }, [status, fetchBookings]);

  // Real-time synchronization
  useRealtime(["bookings"], fetchBookings);

  // Calculate statistics
  const totalCount = bookings.length;
  const activeCount = bookings.filter(
    (b) =>
      b.status === "pending" ||
      b.status === "confirmed" ||
      b.status === "cancellation_pending",
  ).length;
  const completedCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;
  const cancelledCount = bookings.filter(
    (b) => b.status === "cancelled",
  ).length;

  const upcomingConfirmed = bookings.filter((b) => b.status === "confirmed");

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-[#1c1f4a]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2">
      {/* Header section card */}
      <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#b86a16]/10 text-[#b86a16]">
            <Sparkles className="w-3.5 h-3.5" /> Seeker Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-[#1c1f4a] font-display">
            Hi, {session?.user?.name || "Seeker"}
          </h1>
          <p className="text-xs text-[#5a5e7a] leading-relaxed max-w-lg">
            Welcome to your seeker dashboard. Here you can track your registered
            sessions, inspect booking statuses, and access confirmed meeting
            locations.
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats 1: Total Booked */}
        <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1c1f4a]/5 flex items-center justify-center text-[#1c1f4a] shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#9396ae] tracking-wider leading-none mb-1">
              Total booked
            </div>
            <div className="text-2xl font-black text-[#1c1f4a] leading-none">
              {totalCount}
            </div>
          </div>
        </div>

        {/* Stats 2: Active Sessions */}
        <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#b86a16]/10 flex items-center justify-center text-[#b86a16] shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#9396ae] tracking-wider leading-none mb-1">
              Active Slots
            </div>
            <div className="text-2xl font-black text-[#b86a16] leading-none">
              {activeCount}
            </div>
          </div>
        </div>

        {/* Stats 3: Completed Sessions */}
        <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#9396ae] tracking-wider leading-none mb-1">
              Completed
            </div>
            <div className="text-2xl font-black text-emerald-600 leading-none">
              {completedCount}
            </div>
          </div>
        </div>

        {/* Stats 4: Cancelled Sessions */}
        <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#c4796a] shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#9396ae] tracking-wider leading-none mb-1">
              Cancelled
            </div>
            <div className="text-2xl font-black text-[#c4796a] leading-none">
              {cancelledCount}
            </div>
          </div>
        </div>
      </div>

      {/* Active / Confirmed Bookings list */}
      <div className="bg-white border border-[#e8dcc4]/60 rounded-[2rem] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#faf7f2] pb-3">
          <h2 className="text-base font-bold text-[#1c1f4a] font-display">
            Upcoming confirmed sessions
          </h2>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/bookings")}
            className="text-xs text-[#b86a16] font-bold hover:underline cursor-pointer hover:bg-transparent"
          >
            View all bookings &rarr;
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#b86a16] mb-2" size={24} />
            <p className="text-xs text-[#5a5e7a]">
              Fetching recent sessions...
            </p>
          </div>
        ) : upcomingConfirmed.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5a5e7a] italic space-y-3">
            <p>No confirmed upcoming sessions scheduled.</p>
            <Button
              onClick={() => router.push("/offerings")}
              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-8 px-5 text-xs font-semibold"
            >
              Browse & Book Offerings
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#faf7f2]">
            {upcomingConfirmed.slice(0, 5).map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#1c1f4a]">
                    {booking.subCategory.name}
                  </h3>
                  <div className="text-xs text-[#5a5e7a] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#b86a16] shrink-0" />
                    <span className="capitalize">
                      {booking.selectedFormat} (
                      {booking.paymentReceiptUrl ? "Paid" : "Receipt Pending"})
                    </span>
                  </div>
                </div>

                {booking.slot && (
                  <div className="text-right text-xs">
                    <div className="font-bold text-[#1c1f4a] flex items-center justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#b86a16]" />{" "}
                      {formatDate(booking.slot.slotDate)}
                    </div>
                    <div className="text-[#5a5e7a] text-[10px] mt-0.5">
                      {formatTimeRange(booking.slot.startTime, booking.slot.endTime)}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
