"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, Trash2, Play, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate } from "@/lib/format";

interface ScheduledMessage {
  id: string;
  message: string;
  scheduledDate: string;
  isSent: boolean;
  sentAt: string | null;
  createdAt: string;
}

function ScheduledMessagesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";

  const pushParams = useCallback((params: URLSearchParams, replace = false) => {
    const url = `${pathname}?${params.toString()}`;
    if (replace) router.replace(url);
    else router.push(url);
  }, [pathname, router]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!params.has("page")) {
      params.set("page", "1");
      changed = true;
    }
    if (!params.has("limit")) {
      params.set("limit", "25");
      changed = true;
    }
    if (changed) {
      pushParams(params, true);
    }
  }, [pathname, router, searchParams, pushParams]);

  // Data states
  const [scheduledList, setScheduledList] = useState<ScheduledMessage[]>([]);
  const isInitialLoadRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");

  // Scheduling states
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // Dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [runningCron, setRunningCron] = useState(false);

  // Fetch scheduled messages
  const fetchScheduled = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const res = await fetch(
        `/api/communication/scheduled?page=${page}&limit=${limit}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load scheduled messages.");
      }
      const result = await res.json();
      setScheduledList(result.data || []);
      setPagination(result.pagination || {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 1,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load scheduled messages.");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  // Real-time synchronization
  useRealtime(["scheduled_messages"], () => {
    console.log("[Realtime Trigger] Scheduled messages modified, refetching...");
    fetchScheduled();
  });

  const handleOpenCreate = () => {
    setMessage("");
    setScheduledDate("");
    setSelectedDateObj(undefined);
    setModalOpen(true);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      setScheduledDate(`${yyyy}-${mm}-${dd}`);
      setSelectedDateObj(date);
    } else {
      setScheduledDate("");
      setSelectedDateObj(undefined);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter the message content.");
      return;
    }
    if (!scheduledDate) {
      toast.error("Please select a target date using the calendar.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/communication/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          scheduledDate,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to schedule message");
      }

      toast.success("Broadcast message scheduled successfully!");
      setModalOpen(false);
      setMessage("");
      setScheduledDate("");
      setSelectedDateObj(undefined);
      fetchScheduled();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save scheduled message.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/communication/scheduled/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to cancel scheduled message");
      }

      toast.success("Scheduled message cancelled successfully!");
      fetchScheduled();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to cancel scheduled message.");
    } finally {
      setActionId(null);
    }
  };

  const handleForceRunCron = async () => {
    setRunningCron(true);
    try {
      const res = await fetch("/api/cron/scheduled-messages?force=true");
      if (!res.ok) throw new Error("Failed to trigger dispatches");
      const json = await res.json();
      
      const processed = json.processedCount || 0;
      const dispatched = json.dispatchedMessagesCount || 0;
      
      toast.success(`Dispatches complete! Processed ${processed} queue dispatches and sent ${dispatched} messages to all active seekers.`);
      fetchScheduled();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to run today's scheduled dispatches.");
    } finally {
      setRunningCron(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl w-full">
      {/* Header section (Gallery Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Scheduled WhatsApp Messages
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Create text notification templates. The system will broadcast them to all active seekers automatically at 6:00 AM IST on the selected date.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
          <Button
            onClick={handleForceRunCron}
            disabled={runningCron}
            className="rounded-full border border-[#e8dcc4] bg-white hover:bg-[#fcf9f2] text-[#1c1f4a] font-bold text-xs flex items-center justify-center gap-2 h-10 px-4 cursor-pointer shadow-sm transition-all w-full sm:w-auto"
          >
            {runningCron ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 text-[#b86a16]" />
            )}
            {runningCron ? "Running Dispatches..." : "Run Today's Scheduled Messages Now"}
          </Button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer w-full sm:w-auto text-center justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading scheduled messages...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : scheduledList.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <CalendarIcon className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No scheduled broadcasts
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            You don't have any pending or completed scheduled broadcasts in the queue. Create one to notify your seekers.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-[#b86a16] hover:bg-[#b86a16]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            Add First Schedule
          </button>
        </div>
      ) : (
        <div className="p-1 space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="w-full overflow-x-auto border border-[#e8dcc4] rounded-2xl bg-white shadow-sm">
            <Table className="w-full min-w-[700px]">
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-36">
                    Target Date
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-32">
                    Status
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                    Message Template (sent to ALL active seekers)
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-40">
                    Created At
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-right w-24">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledList.map((item) => {
                  const isPending = !item.isSent;
                  return (
                    <TableRow
                      key={item.id}
                      className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                        item.isSent ? "bg-[#eaf2eb]/30" : ""
                      }`}
                    >
                      <TableCell className="py-4 px-4 font-semibold text-[#1c1f4a] text-xs">
                        {formatDate(item.scheduledDate)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <span
                          className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            item.isSent
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {item.isSent ? "SENT" : "PENDING"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-xs text-[#5a5e7a] font-medium whitespace-pre-wrap leading-relaxed max-w-lg">
                        {item.message}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-[10px] text-[#9396ae]">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        {isPending && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={actionId === item.id}
                            className="p-2 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Delete Schedule"
                          >
                            {actionId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TablePaginationFooter pagination={pagination} variant="bottom" />
        </div>
      )}

      {/* Create Dialog Modal (Gallery Style) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md border border-[#e8dcc4] bg-white rounded-3xl p-6">
          <DialogHeader className="border-b border-[#e8dcc4]/30 pb-4">
            <DialogTitle className="text-md font-bold text-[#1c1f4a] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#b86a16]" />
              Schedule WhatsApp Broadcast
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateSchedule} className="space-y-5 pt-4">
            {/* Target Date Picker */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                Target Broadcast Date
              </Label>
              <DatePicker
                value={selectedDateObj}
                onChange={handleDateChange}
                placeholder="Choose date from calendar"
                disabledDates={(d: Date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today; // Disables past dates
                }}
              />
            </div>

            {/* Message template box */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                WhatsApp Message Text
              </Label>
              <textarea
                placeholder="Write the text notification to be scheduled to all active seekers..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl p-3 focus:outline-none min-h-[140px] font-sans"
                required
              />
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="text-xs font-bold text-[#5a5e7a] border border-[#e8dcc4] rounded-xl h-10 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#b86a16] hover:bg-[#b86a16]/90 text-white font-bold text-xs h-10 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Saving..." : "Schedule Broadcast"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ScheduledMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading scheduled messages dashboard...
          </p>
        </div>
      }
    >
      <ScheduledMessagesContent />
    </Suspense>
  );
}
