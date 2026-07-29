"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ListFilter,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  User,
  MessageSquare,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate, formatTimeRange } from "@/lib/format";

type BookingRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  subCategoryName: string;
  slotDate: string | null;
  startTime: string | null;
  endTime: string | null;
  selectedFormat: string | null;
  locationName: string | null;
  locationUrl: string | null;
  formResponses: Record<string, any>;
  status: "pending" | "confirmed" | "cancellation_pending" | "cancelled" | "completed";
  paymentStatus: "pending" | "completed" | "refunded";
  cancellationReason: string | null;
  paymentReceiptUrl: string | null;
  createdAt: string;
};

const STATUS_FILTERS = [
  { value: "all", label: "All Bookings" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancellation_pending", label: "Cancellation Request" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function BookingsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL query params
  const statusFilter = searchParams.get("status") || "all";
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const categoryFilter = searchParams.get("category") || "all";
  const subCategoryFilter = searchParams.get("subCategory") || "all";

  const pushParams = useCallback((params: URLSearchParams, replace = false) => {
    const url = `${pathname}?${params.toString()}`;
    if (replace) router.replace(url);
    else router.push(url);
  }, [pathname, router]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!params.has("status")) {
      params.set("status", "all");
      changed = true;
    }
    if (!params.has("page")) {
      params.set("page", "1");
      changed = true;
    }
    if (!params.has("limit")) {
      params.set("limit", String(DEFAULT_PAGE_LIMIT));
      changed = true;
    }
    if (changed) {
      pushParams(params, true);
    }
  }, [searchParams, pushParams]);

  // Data states
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [subCategories, setSubCategories] = useState<{ id: string; name: string; categoryId: string }[]>([]);
  const [allQuestions, setAllQuestions] = useState<Record<string, string>>({});
  const [sortedQuestions, setSortedQuestions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Action states
  const [viewResponsesBooking, setViewResponsesBooking] = useState<BookingRow | null>(null);

  useEffect(() => {
    if (!viewResponsesBooking) {
      setSortedQuestions([]);
      return;
    }
    const fetchSortedQuestions = async () => {
      try {
        const subObj = subCategories.find((s) => s.name === viewResponsesBooking.subCategoryName);
        const subId = subObj?.id;
        if (!subId) return;
        const res = await fetch(`/api/sub-categories/${subId}/questions`);
        if (res.ok) {
          const json = await res.json();
          setSortedQuestions(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load sorted questions:", err);
      }
    };
    fetchSortedQuestions();
  }, [viewResponsesBooking, subCategories]);
  const [cancelBooking, setCancelBooking] = useState<BookingRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Transition dialog confirm states
  const [confirmStatusUpdate, setConfirmStatusUpdate] = useState<{
    booking: BookingRow;
    nextStatus: BookingRow["status"];
  } | null>(null);

  // Load Categories & Sub-Categories Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const json = await catRes.json();
          setCategories(json.data || []);
        }
        const subRes = await fetch("/api/sub-categories");
        if (subRes.ok) {
          const json = await subRes.json();
          setSubCategories(json.data || []);
        }
        const qRes = await fetch("/api/questions?limit=500");
        if (qRes.ok) {
          const json = await qRes.json();
          const qMap: Record<string, string> = {};
          (json.data || []).forEach((q: any) => {
            qMap[q.id] = q.fieldLabel;
          });
          setAllQuestions(qMap);
        }
      } catch (err) {
        console.error("Failed to load category filters or questions:", err);
      }
    };
    fetchConfig();
  }, []);

  // Fetch Bookings Queue
  const fetchBookings = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const statusQuery = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const catQuery = categoryFilter !== "all" ? `&category=${encodeURIComponent(categoryFilter)}` : "";
      const subCatQuery = subCategoryFilter !== "all" ? `&subCategory=${encodeURIComponent(subCategoryFilter)}` : "";
      const res = await fetch(`/api/bookings?page=${page}&limit=${limit}${statusQuery}${catQuery}${subCatQuery}`);
      if (!res.ok) throw new Error("Failed to load bookings");
      const json = await res.json();
      const mapped = (json.data || []).map((b: any) => ({
        id: b.id,
        status: b.status,
        selectedFormat: b.selectedFormat,
        formResponses: b.formResponses,
        userCancellationReason: b.userCancellationReason,
        adminCancellationReason: b.adminCancellationReason,
        paymentReceiptUrl: b.paymentReceiptUrl,
        createdAt: b.createdAt,
        userId: b.user?.id || "",
        userName: b.user?.name || "Guest",
        userEmail: b.user?.email || "",
        userPhone: b.user?.phone || null,
        subCategoryName: b.subCategory?.name || "",
        slotDate: b.slot?.slotDate || null,
        startTime: b.slot?.startTime || null,
        endTime: b.slot?.endTime || null,
      }));
      setBookings(mapped);
      setPagination(json.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Error loading bookings queue");
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [statusFilter, categoryFilter, subCategoryFilter, page, limit]);

  useEffect(() => {
    fetchBookings(firstLoad);
  }, [fetchBookings, firstLoad]);

  // Real-time synchronization
  useRealtime(["bookings"], () => fetchBookings(true));

  // Filter switch handlers
  const handleFilterChange = (statusVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", statusVal);
    params.set("page", "1");
    pushParams(params);
  };

  const handleCategoryChange = (catVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catVal === "all") {
      params.delete("category");
    } else {
      params.set("category", catVal);
    }
    // Clear subcategory when parent category changes to avoid invalid combinations
    params.delete("subCategory");
    params.set("page", "1");
    pushParams(params);
  };

  const handleSubCategoryChange = (subCatVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subCatVal === "all") {
      params.delete("subCategory");
    } else {
      params.set("subCategory", subCatVal);
    }
    params.set("page", "1");
    pushParams(params);
  };

  // Perform status transitions (Confirm, Complete, Deny cancellation)
  const executeStatusTransition = async (bookingId: string, nextStatus: BookingRow["status"], additionalData = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, ...additionalData }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update booking status.");

      toast.success(`Booking status transitioned to ${nextStatus.replace("_", " ")} successfully!`);
      setConfirmStatusUpdate(null);
      fetchBookings(true);
    } catch (err: any) {
      toast.error(err.message || "Status update failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit cancellation (Cancelled)
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBooking) return;
    if (!cancelReason.trim()) {
      toast.error("Please supply a cancellation reason to notify the user.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${cancelBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationReason: cancelReason }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to cancel booking.");

      toast.success("Booking cancelled. WhatsApp notifications dispatched.");
      setCancelBooking(null);
      setCancelReason("");
      fetchBookings(true);
    } catch (err: any) {
      toast.error(err.message || "Cancellation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Bookings Tracker Queue</h1>
        <p className="text-xs text-[#5a5e7a] mt-1">Review registrations, manage statuses, and dispatch confirmations.</p>
      </div>

      {/* Filter tab bar */}
      <div className="flex gap-2 border-b border-[#e8dcc4] pb-px overflow-x-auto selection:bg-transparent">
        {STATUS_FILTERS.map((filter) => {
          const isSel = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={`py-3 px-4 text-xs font-bold border-b-2 tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                isSel
                  ? "border-[#b86a16] text-[#b86a16] font-extrabold"
                  : "border-transparent text-[#5a5e7a] hover:text-[#1c1f4a] hover:border-[#e8dcc4]"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Category & Subcategory select filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white/40 border border-[#e8dcc4]/60 p-4 rounded-2xl">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">Offering Category</label>
          <Select
            value={categoryFilter}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl h-10 px-3 outline-none">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">✦ All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">Offering Sub-category</label>
          <Select
            value={subCategoryFilter}
            onValueChange={handleSubCategoryChange}
          >
            <SelectTrigger className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl h-10 px-3 outline-none">
              <SelectValue placeholder="All Sub-categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">✦ All Sub-categories</SelectItem>
              {subCategories
                .filter((sub) => {
                  if (categoryFilter === "all") return true;
                  const parentCategory = categories.find((c) => c.name === categoryFilter);
                  return parentCategory ? sub.categoryId === parentCategory.id : true;
                })
                .map((sub) => (
                  <SelectItem key={sub.id} value={sub.name}>
                    {sub.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <CheckCircle className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">Queue empty</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            No booking records fit this status scope.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="p-1 bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">User / Credentials</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Offering</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Timing slot</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Format / Location</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Booking Status</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors text-xs"
                  >
                    {/* User credentials */}
                    <TableCell className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-bold text-[#1c1f4a] flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#9396ae]" /> {booking.userName}
                        </div>
                        <div className="text-[10px] text-[#5a5e7a] flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-[#9396ae]" /> {booking.userEmail}
                        </div>
                        {booking.userPhone && (
                          <div className="text-[10px] text-[#5a5e7a] flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-[#6b8f71]" /> {booking.userPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Offering */}
                    <TableCell className="py-3 px-4 font-bold text-[#1c1f4a]">{booking.subCategoryName}</TableCell>

                    {/* Timing slot */}
                    <TableCell className="py-3 px-4">
                      {booking.slotDate ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-[#1c1f4a]">{formatDate(booking.slotDate)}</div>
                          <div className="text-[10px] text-[#5a5e7a] flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-[#b86a16]" /> {formatTimeRange(booking.startTime, booking.endTime)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#9396ae] italic">Direct Form (No slot)</span>
                      )}
                    </TableCell>

                    {/* Location / Format */}
                    <TableCell className="py-3 px-4">
                      {booking.selectedFormat ? (
                        <div className="space-y-0.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide border ${
                            booking.selectedFormat === "online" ? "bg-[#b86a16]/5 border-[#b86a16]/25 text-[#b86a16]" : "bg-[#6b8f71]/5 border-[#6b8f71]/25 text-[#6b8f71]"
                          }`}>
                            {booking.selectedFormat}
                          </span>
                          {booking.locationName && (
                            <div className="text-[10px] text-[#5a5e7a] max-w-[120px] truncate">
                              {booking.locationUrl ? (
                                <a href={booking.locationUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#b86a16]">
                                  {booking.locationName}
                                </a>
                              ) : (
                                <span>{booking.locationName}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9396ae] italic">N/A</span>
                      )}
                    </TableCell>

                    {/* Booking status */}
                    <TableCell className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                        booking.status === "pending"
                          ? "bg-[#b86a16]/10 text-[#b86a16]"
                          : booking.status === "confirmed"
                          ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                          : booking.status === "cancellation_pending"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : booking.status === "completed"
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {booking.status.replace("_", " ")}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          onClick={() => setViewResponsesBooking(booking)}
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg border-[#e8dcc4] hover:bg-[#b86a16]/5"
                          title="View Form Answers"
                        >
                          <Eye className="w-4 h-4 text-[#1c1f4a]" />
                        </Button>

                        {/* Pending: Confirm/Cancel */}
                        {booking.status === "pending" && (
                          <>
                            <Button
                              onClick={() => setConfirmStatusUpdate({ booking, nextStatus: "confirmed" })}
                              className="bg-[#6b8f71] hover:bg-[#6b8f71]/90 text-white rounded-lg h-8 px-3 text-[10px] font-bold uppercase"
                            >
                              Confirm
                            </Button>
                            <Button
                              onClick={() => setCancelBooking(booking)}
                              className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-lg h-8 px-3 text-[10px] font-bold uppercase"
                            >
                              Cancel
                            </Button>
                          </>
                        )}

                        {/* Confirmed: Complete/Cancel */}
                        {booking.status === "confirmed" && (
                          <>
                            <Button
                              onClick={() => setConfirmStatusUpdate({ booking, nextStatus: "completed" })}
                              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-lg h-8 px-3 text-[10px] font-bold uppercase"
                            >
                              Complete
                            </Button>
                            <Button
                              onClick={() => setCancelBooking(booking)}
                              className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-lg h-8 px-3 text-[10px] font-bold uppercase"
                            >
                              Cancel
                            </Button>
                          </>
                        )}

                        {/* Cancellation pending: Approve Cancellation/Deny */}
                        {booking.status === "cancellation_pending" && (
                          <>
                            <Button
                              onClick={() => setCancelBooking(booking)}
                              className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-8 px-3 text-[10px] font-bold uppercase"
                            >
                              Approve Cancel
                            </Button>
                            <Button
                              onClick={() => setConfirmStatusUpdate({ booking, nextStatus: "confirmed" })}
                              variant="outline"
                              className="border border-[#1c1f4a]/40 hover:bg-[#1c1f4a]/5 text-[#1c1f4a] rounded-lg h-8 px-3 text-[10px] font-bold uppercase"
                            >
                              Reject Request
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePaginationFooter pagination={pagination} variant="bottom" />
          </div>
        </div>
      )}

      {/* DIALOG: View custom form responses */}
      <Dialog open={viewResponsesBooking !== null} onOpenChange={(open) => !open && setViewResponsesBooking(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">Questionnaire Responses</DialogTitle>
          </DialogHeader>

          {viewResponsesBooking && (
            <div className="space-y-4 mt-4 max-h-[350px] overflow-y-auto pr-2">
              <div className="bg-[#faf7f2] border border-[#e8dcc4] p-3.5 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#b86a16] tracking-wider">Booking Ref ID</div>
                <div className="text-xs font-mono break-all text-[#1c1f4a]">{viewResponsesBooking.id}</div>
              </div>

              <div className="space-y-3.5">
                {Object.keys(viewResponsesBooking.formResponses || {}).length === 0 ? (
                  <p className="text-xs text-[#5a5e7a] italic">No additional questionnaire fields linked for this session offering.</p>
                ) : sortedQuestions.length > 0 ? (
                  sortedQuestions.map((q) => {
                    const ans = viewResponsesBooking.formResponses[q.id];
                    if (ans === undefined) return null;

                    let displayAns = "";
                    let customVal = "";

                    if (ans && typeof ans === "object") {
                      if (Array.isArray(ans.selected)) {
                        displayAns = ans.selected.join(", ");
                      } else {
                        displayAns = String(ans.selected || "");
                      }
                      customVal = ans.customValue || "";
                    } else if (Array.isArray(ans)) {
                      displayAns = ans.join(", ");
                    } else {
                      displayAns = String(ans || "");
                    }

                    return (
                      <div key={q.id} className="border-b border-[#e8dcc4]/40 pb-3">
                        <Label className="text-xs font-bold text-[#1c1f4a] tracking-wide block mb-1">
                          {q.fieldLabel}:
                        </Label>
                        <div className="text-xs text-[#5a5e7a] font-medium leading-relaxed bg-[#fafafa] p-2.5 rounded-lg border border-gray-100">
                          {displayAns || <span className="text-gray-300 italic">No answer</span>}
                          {customVal && (
                            <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
                              <span className="font-bold text-[#b86a16] block text-[9px] uppercase tracking-wider mb-0.5">Custom Value:</span>
                              <span className="text-[#1c1f4a]">{customVal}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  Object.entries(viewResponsesBooking.formResponses).map(([qId, ans]) => {
                    let displayAns = "";
                    let customVal = "";

                    if (ans && typeof ans === "object") {
                      if (Array.isArray(ans.selected)) {
                        displayAns = ans.selected.join(", ");
                      } else {
                        displayAns = String(ans.selected || "");
                      }
                      customVal = ans.customValue || "";
                    } else if (Array.isArray(ans)) {
                      displayAns = ans.join(", ");
                    } else {
                      displayAns = String(ans || "");
                    }

                    return (
                      <div key={qId} className="border-b border-[#e8dcc4]/40 pb-3">
                        <Label className="text-xs font-bold text-[#1c1f4a] tracking-wide block mb-1">
                          {allQuestions[qId] || `Question (${qId.substring(0, 8)})`}:
                        </Label>
                        <div className="text-xs text-[#5a5e7a] font-medium leading-relaxed bg-[#fafafa] p-2.5 rounded-lg border border-gray-100">
                          {displayAns || <span className="text-gray-300 italic">No answer</span>}
                          {customVal && (
                            <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
                              <span className="font-bold text-[#b86a16] block text-[9px] uppercase tracking-wider mb-0.5">Custom Value:</span>
                              <span className="text-[#1c1f4a]">{customVal}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Payment Receipt Image Display */}
              {viewResponsesBooking.paymentReceiptUrl && (
                <div className="bg-[#faf7f2] border border-[#e8dcc4] p-3.5 rounded-xl space-y-2 mt-4">
                  <div className="text-[10px] uppercase font-bold text-[#b86a16] tracking-wider">Payment Receipt Screenshot</div>
                  <a
                    href={viewResponsesBooking.paymentReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group overflow-hidden rounded-lg border border-gray-200 cursor-pointer relative"
                  >
                    <img
                      src={viewResponsesBooking.paymentReceiptUrl}
                      alt="Payment Receipt Screenshot"
                      className="w-full h-auto max-h-[220px] object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                      Click to View Full Screen
                    </div>
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: Cancellation Reason Form */}
      <Dialog open={cancelBooking !== null} onOpenChange={(open) => !open && setCancelBooking(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="bg-red-600 text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">Confirm Cancellation</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCancelSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Cancellation Reason / Explanation</Label>
              <textarea
                value={cancelReason}
                onChange={(e: any) => setCancelReason(e.target.value)}
                placeholder="e.g. The requested slot timing conflicts with an upcoming emergency schedule. Please choose another date."
                required
                disabled={actionLoading}
                rows={4}
                className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16]"
              />
              <p className="text-[10px] text-[#5a5e7a] leading-relaxed">
                This message will be dispatched directly to the customer via WhatsApp and set in their portal view. Mapped timings slot will be set back to available.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setCancelBooking(null)} disabled={actionLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="h-10 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Submit Cancellation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: Status Transition Confirmation */}
      <AlertDialog open={confirmStatusUpdate !== null} onOpenChange={(open) => !open && setConfirmStatusUpdate(null)}>
        <AlertDialogContent className="w-[320px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">
              Confirm Status Transition
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure you want to change booking status for {confirmStatusUpdate?.booking.userName} to{" "}
              <strong className="text-[#1c1f4a] uppercase text-[10px]">{confirmStatusUpdate?.nextStatus.replace("_", " ")}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmStatusUpdate) {
                  executeStatusTransition(confirmStatusUpdate.booking.id, confirmStatusUpdate.nextStatus);
                }
              }}
              className="flex-1 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function BookingsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading bookings tracker...</p>
        </div>
      }
    >
      <BookingsDashboardContent />
    </Suspense>
  );
}
