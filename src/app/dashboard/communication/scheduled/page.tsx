"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import { toast } from "sonner";
import {
  Loader2,
  Calendar as CalendarIcon,
  Trash2,
  Play,
  CheckCircle,
  Plus,
  Search,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // URL pagination & filter parameters
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);

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
  }, [searchParams, pushParams]);

  // Sync local inputs when URL search parameters change
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalStatus(statusFilter);
  }, [searchQuery, statusFilter]);

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
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";

      const res = await fetch(
        `/api/communication/scheduled?page=${page}&limit=${limit}${searchPart}${statusPart}`,
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
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  // Real-time synchronization
  useRealtime(["scheduled_messages"], () => {
    console.log("[Realtime Trigger] Scheduled messages modified, refetching...");
    fetchScheduled();
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", localSearch.trim());
    params.set("status", localStatus);
    params.set("page", "1");
    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");

    const params = new URLSearchParams(searchParams.toString());
    params.set("search", "");
    params.set("status", "all");
    params.set("page", "1");
    pushParams(params);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter message content template.");
      return;
    }
    if (!scheduledDate) {
      toast.error("Please pick a scheduled dispatch date.");
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
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule broadcast message.");
      }

      toast.success("Broadcast message scheduled successfully!");
      setModalOpen(false);
      fetchScheduled();
    } catch (err: any) {
      toast.error(err.message || "Failed to save broadcast schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMessage = async () => {
    if (!actionId) return;
    try {
      const res = await fetch(`/api/communication/scheduled/${actionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel scheduled message.");
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
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer w-full sm:w-auto text-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Search Messages</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search message text keywords..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Dispatch Status</Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Broadcasts</SelectItem>
              <SelectItem value="pending">Pending / Queued</SelectItem>
              <SelectItem value="sent">Dispatched Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            type="button"
            onClick={handleClearFilters}
            variant="outline"
            className="h-9 px-4 border-[#e8dcc4] bg-white hover:bg-[#faf7f2] text-xs font-bold text-[#5a5e7a] rounded-xl flex items-center justify-center cursor-pointer flex-1 sm:flex-none"
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer shadow-sm transition-all flex-1 sm:flex-none"
          >
            Apply
          </Button>
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
            No scheduled broadcasts found
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or status filter to locate broadcasts.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-[700px]">
                <TableHeader className="bg-[#1c1f4a]/5">
                  <TableRow className="border-b border-[#e8dcc4]">
                    <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                      Broadcast Template Message
                    </TableHead>
                    <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                      Target Broadcast Date
                    </TableHead>
                    <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                      Dispatch Time
                    </TableHead>
                    <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                      Status
                    </TableHead>
                    <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledList.map((msg) => (
                    <TableRow
                      key={msg.id}
                      className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-all"
                    >
                      <TableCell className="py-3 px-4 text-xs font-medium text-[#1c1f4a] max-w-md whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs font-semibold text-[#1c1f4a]">
                        {msg.scheduledDate}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-[#5a5e7a] font-medium">
                        {msg.isSent && msg.sentAt ? (
                          <span>{new Date(msg.sentAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                        ) : (
                          <span className="text-gray-400 italic">Scheduled 6:00 AM</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs">
                        {msg.isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#6b8f71]/15 text-[#6b8f71]">
                            <CheckCircle className="w-3 h-3" /> Dispatched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#b86a16]/15 text-[#b86a16]">
                            ✦ Pending Queue
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        {!msg.isSent && (
                          <button
                            onClick={() => setActionId(msg.id)}
                            className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                            title="Cancel scheduled broadcast"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <TablePaginationFooter pagination={pagination} variant="bottom" />
        </div>
      )}

      {/* Create Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <CalendarIcon className="w-4.5 h-4.5 text-[#b86a16]" />
              Schedule Broadcast Message
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Target Date
              </Label>
              <DatePicker
                value={selectedDateObj}
                onChange={handleDateChange}
                disabled={submitting}
                placeholder="Pick a date"
                disabledDates={(d) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today;
                }}
              />
              <p className="text-[10px] text-gray-500 italic mt-0.5">
                The broadcast will trigger at 6:00 AM IST on the selected date.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageContent" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Message Content Template
              </Label>
              <textarea
                id="messageContent"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
                placeholder="Enter notification or message to send to all users..."
                className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16] text-[#1c1f4a]"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Broadcast"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete / Cancel Broadcast Dialog Confirmation */}
      <Dialog open={!!actionId} onOpenChange={(open) => !open && setActionId(null)}>
        <DialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1c1f4a] font-bold">
              Cancel Scheduled Broadcast
            </DialogTitle>
            <p className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to cancel and remove this scheduled broadcast message from the dispatch queue?
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionId(null)}
              className="border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleCancelMessage}
              className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white text-xs font-semibold rounded-xl"
            >
              Cancel Broadcast
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ScheduledMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <ScheduledMessagesContent />
    </Suspense>
  );
}
