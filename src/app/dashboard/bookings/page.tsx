"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import { useSession } from "next-auth/react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
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
  Download,
  Search,
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
import { Input } from "@/components/ui/input";
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
  cancellationReason?: string | null;
  createdAt: string;
};

function BookingsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
 
  const formatLocalDateYMD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // URL query params
  const statusFilter = searchParams.get("status") || "all";
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const categoryFilter = searchParams.get("category") || "all";
  const subCategoryFilter = searchParams.get("subCategory") || "all";
  const searchQuery = searchParams.get("search") || "";

  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1);
  const defaultFromStr = defaultFrom.toISOString().split("T")[0];
  const defaultToStr = new Date().toISOString().split("T")[0];

  const startDateParam = searchParams.get("startDate") || defaultFromStr;
  const endDateParam = searchParams.get("endDate") || defaultToStr;

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [localCategory, setLocalCategory] = useState(categoryFilter);
  const [localSubCategory, setLocalSubCategory] = useState(subCategoryFilter);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(startDateParam),
    to: new Date(endDateParam),
  });

  const pushParams = useCallback((params: URLSearchParams, replace = false) => {
    const url = `${pathname}?${params.toString()}`;
    if (replace) router.replace(url);
    else router.push(url);
  }, [pathname, router]);

  // Sync local states with URL params
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalStatus(statusFilter);
    setLocalCategory(categoryFilter);
    setLocalSubCategory(subCategoryFilter);
    setDateRange({
      from: new Date(startDateParam),
      to: new Date(endDateParam),
    });
  }, [searchQuery, statusFilter, categoryFilter, subCategoryFilter, startDateParam, endDateParam]);

  // Data states
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const datePart = `&startDate=${startDateParam}&endDate=${endDateParam}`;
 
      const res = await fetch(`/api/bookings?page=${page}&limit=${limit}${statusQuery}${catQuery}${subCatQuery}${searchPart}${datePart}`);
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
    }
  }, [statusFilter, categoryFilter, subCategoryFilter, searchQuery, page, limit, startDateParam, endDateParam]);

  useEffect(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  // Real-time updates
  useRealtime(["bookings", "feedbacks"], () => fetchBookings(true));

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", localSearch.trim());
    params.set("status", localStatus);
    params.set("category", localCategory);
    params.set("subCategory", localSubCategory);
    if (dateRange?.from) {
      params.set("startDate", formatLocalDateYMD(dateRange.from));
    } else {
      params.delete("startDate");
    }
    if (dateRange?.to) {
      params.set("endDate", formatLocalDateYMD(dateRange.to));
    } else {
      params.delete("endDate");
    }
    params.set("page", "1");
    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalCategory("all");
    setLocalSubCategory("all");
    const dFrom = new Date();
    dFrom.setMonth(dFrom.getMonth() - 1);
    setDateRange({
      from: dFrom,
      to: new Date(),
    });
 
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", "");
    params.set("status", "all");
    params.set("category", "all");
    params.set("subCategory", "all");
    params.set("startDate", formatLocalDateYMD(dFrom));
    params.set("endDate", formatLocalDateYMD(new Date()));
    params.set("page", "1");
    pushParams(params);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const statusQuery = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const catQuery = categoryFilter !== "all" ? `&category=${encodeURIComponent(categoryFilter)}` : "";
      const subCatQuery = subCategoryFilter !== "all" ? `&subCategory=${encodeURIComponent(subCategoryFilter)}` : "";
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const datePart = `&startDate=${startDateParam}&endDate=${endDateParam}`;
      
      const res = await fetch(`/api/bookings?export=true${statusQuery}${catQuery}${subCatQuery}${searchPart}${datePart}`);
      if (!res.ok) throw new Error("Failed to export bookings");
      const json = await res.json();
      
      const dataRows = json.data || [];
      
      // Define CSV columns
      const headers = [
        "Booking Reference ID",
        "Customer Name",
        "Customer Email",
        "Customer Phone",
        "Offering Category",
        "Session Offering",
        "Session Format",
        "Slot Date",
        "Slot Timing",
        "Booking Status",
        "Feedback Rating",
        "Feedback Comments",
        "Created At"
      ];
      
      const csvRows = [headers.join(",")];
      
      for (const row of dataRows) {
        const slotDateStr = row.slot?.slotDate ? formatDate(row.slot.slotDate) : "Direct coordinated";
        const slotTimingStr = row.slot ? formatTimeRange(row.slot.startTime, row.slot.endTime) : "";
        const formattedCreatedStr = formatDate(row.createdAt);
        
        const values = [
          row.id,
          row.user?.name || "Guest",
          row.user?.email || "",
          row.user?.phone || "",
          row.category?.name || "",
          row.subCategory?.name || "",
          row.selectedFormat || "To be coordinated",
          slotDateStr,
          slotTimingStr,
          row.status || "",
          row.feedback?.rating ? String(row.feedback.rating) : "",
          row.feedback?.rawFeedback || "",
          formattedCreatedStr
        ];
        
        // Escape quotes and commas in CSV fields
        const escaped = values.map(val => {
          const stringified = String(val);
          if (stringified.includes(",") || stringified.includes("\"") || stringified.includes("\n")) {
            return `"${stringified.replace(/"/g, '""')}"`;
          }
          return stringified;
        });
        
        csvRows.push(escaped.join(","));
      }
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvRows.join("\n"));
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      
      const catClean = categoryFilter !== "all" ? categoryFilter.replace(/[^a-zA-Z0-9]/g, "_") : "";
      const subCatClean = subCategoryFilter !== "all" ? subCategoryFilter.replace(/[^a-zA-Z0-9]/g, "_") : "";
      
      let filterParts = [];
      if (catClean) filterParts.push(catClean);
      if (subCatClean) filterParts.push(subCatClean);
      filterParts.push(statusFilter);
      
      const filterName = filterParts.join("_").replace(/__+/g, "_").toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `bookings_export_${filterName}_${timestamp}.csv`;
      link.setAttribute("download", filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV export downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to export bookings");
    } finally {
      setExporting(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Bookings Tracker Queue</h1>
          <p className="text-xs text-[#5a5e7a] mt-1">Review registrations, manage statuses, and dispatch confirmations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            disabled={exporting || bookings.length === 0}
            className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-xl shadow-sm transition-all"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export Bookings (CSV)
          </Button>
        </div>
      </div>

      {/* Neat Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col md:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[150px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Search Seekers</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search name, email, phone..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full md:w-40 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Category</Label>
          <Select value={localCategory} onValueChange={(val) => {
            setLocalCategory(val);
            setLocalSubCategory("all");
          }}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Session Offering</Label>
          <Select value={localSubCategory} onValueChange={setLocalSubCategory}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Offerings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Offerings</SelectItem>
              {subCategories
                .filter((sub) => {
                  if (localCategory === "all") return true;
                  const parentCategory = categories.find((c) => c.name === localCategory);
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
 
        <div className="w-full md:w-56 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Date range</Label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
 
        <div className="w-full md:w-40 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Status</Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="cancellation_pending">Cancellation Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
          <Button
            type="button"
            onClick={handleClearFilters}
            variant="outline"
            className="h-9 px-4 border-[#e8dcc4] bg-white hover:bg-[#faf7f2] text-xs font-bold text-[#5a5e7a] rounded-xl flex items-center justify-center cursor-pointer flex-1 md:flex-none"
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer shadow-sm transition-all flex-1 md:flex-none"
          >
            Apply
          </Button>
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
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No bookings found</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, category/offering, or status filters to locate bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
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

                    {/* Category offering */}
                    <TableCell className="py-3 px-4 text-[#1c1f4a] font-bold">
                      {booking.subCategoryName}
                    </TableCell>

                    {/* Timing slot */}
                    <TableCell className="py-3 px-4">
                      {booking.slotDate ? (
                        <div className="space-y-1 font-semibold">
                          <div className="text-[#1c1f4a] font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#b86a16]" />
                            {formatDate(booking.slotDate)}
                          </div>
                          <div className="text-[10px] text-[#5a5e7a] flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {booking.startTime && booking.endTime
                              ? formatTimeRange(booking.startTime, booking.endTime)
                              : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#5a5e7a] italic">Coordinated directly</span>
                      )}
                    </TableCell>

                    {/* Format / location links */}
                    <TableCell className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-[#faf7f2] border border-[#e8dcc4] text-[#1c1f4a]">
                          {booking.selectedFormat || "Unspecified"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Booking Status badges */}
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          booking.status === "confirmed"
                            ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                            : booking.status === "completed"
                            ? "bg-[#1c1f4a]/10 text-[#1c1f4a]"
                            : booking.status === "cancelled"
                            ? "bg-[#c4796a]/15 text-[#c4796a]"
                            : "bg-[#b86a16]/15 text-[#b86a16]"
                        }`}>
                          {booking.status.replace("_", " ")}
                        </span>

                        {booking.status === "cancelled" && booking.cancellationReason && (
                          <span className="text-[10px] text-[#c4796a] font-semibold block max-w-[150px] truncate" title={booking.cancellationReason}>
                            Reason: {booking.cancellationReason}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions column */}
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        {/* View Responses Form answers */}
                        <button
                          onClick={() => setViewResponsesBooking(booking)}
                          className="p-1.5 hover:bg-[#1c1f4a]/10 text-[#1c1f4a] border border-transparent hover:border-[#1c1f4a]/30 rounded-xl transition-all cursor-pointer"
                          title="View Responses"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Status updates */}
                        {booking.status === "pending" && (
                          <button
                            onClick={() => setConfirmStatusUpdate({ booking, nextStatus: "confirmed" })}
                            disabled={actionLoading}
                            className="p-1.5 bg-[#6b8f71]/15 hover:bg-[#6b8f71]/25 border border-transparent hover:border-[#6b8f71]/40 rounded-xl text-[#6b8f71] transition-all cursor-pointer font-bold"
                            title="Confirm Booking"
                          >
                            Confirm
                          </button>
                        )}

                        {booking.status === "confirmed" && (
                          <button
                            onClick={() => setConfirmStatusUpdate({ booking, nextStatus: "completed" })}
                            disabled={actionLoading}
                            className="p-1.5 bg-[#1c1f4a]/10 hover:bg-[#1c1f4a]/15 border border-transparent hover:border-[#1c1f4a]/30 rounded-xl text-[#1c1f4a] transition-all cursor-pointer font-bold"
                            title="Mark Completed"
                          >
                            Complete
                          </button>
                        )}

                        {booking.status === "cancellation_pending" && (
                          <>
                            <button
                              onClick={() => setConfirmStatusUpdate({ booking, nextStatus: "confirmed" })}
                              disabled={actionLoading}
                              className="p-1.5 bg-[#6b8f71]/15 hover:bg-[#6b8f71]/25 border border-transparent hover:border-[#6b8f71]/40 rounded-xl text-[#6b8f71] transition-all cursor-pointer font-bold"
                              title="Deny Cancellation"
                            >
                              Keep
                            </button>
                            <button
                              onClick={() => setCancelBooking(booking)}
                              disabled={actionLoading}
                              className="p-1.5 bg-[#c4796a]/15 hover:bg-[#c4796a]/25 border border-transparent hover:border-[#c4796a]/40 rounded-xl text-[#c4796a] transition-all cursor-pointer font-bold"
                              title="Approve Cancellation"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {/* Allow canceling directly from queue if confirmed or pending */}
                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <button
                            onClick={() => setCancelBooking(booking)}
                            disabled={actionLoading}
                            className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer font-bold"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePaginationFooter pagination={pagination} variant="bottom" />
        </div>
      )}

      {/* View Responses Form answers Modal popup dialog */}
      <Dialog open={!!viewResponsesBooking} onOpenChange={(open) => !open && setViewResponsesBooking(null)}>
        <DialogContent className="max-w-2xl border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5 flex flex-row items-center justify-between -mx-0 -mt-0">
            <DialogTitle className="text-white text-sm font-bold flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-[#b86a16]" />
              Booking Questionnaire details
            </DialogTitle>
          </DialogHeader>

          {viewResponsesBooking && (
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-[#e8dcc4]/50 pb-4">
                <div>
                  <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Customer</span>
                  <span className="font-bold text-[#1c1f4a]">{viewResponsesBooking.userName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Offering session</span>
                  <span className="font-bold text-[#1c1f4a]">{viewResponsesBooking.subCategoryName}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase tracking-wider">Responses Payload</span>

                {sortedQuestions.length > 0 ? (
                  <div className="space-y-3.5">
                    {sortedQuestions.map((q) => {
                      const answer = viewResponsesBooking.formResponses[q.id];
                      let displayVal = "";
                      if (answer && typeof answer === "object" && !Array.isArray(answer)) {
                        const selected = Array.isArray(answer.selected)
                          ? answer.selected.join(", ")
                          : String(answer.selected);
                        const specify = answer.customValue
                          ? ` (Specified: "${answer.customValue}")`
                          : "";
                        displayVal = `${selected}${specify}`;
                      } else {
                        displayVal = Array.isArray(answer)
                          ? answer.join(", ")
                          : String(answer || "");
                      }

                      return (
                        <div key={q.id} className="p-3.5 bg-[#faf7f2]/30 border border-[#e8dcc4]/60 rounded-xl space-y-1">
                          <span className="text-xs font-semibold text-[#1c1f4a]">{q.fieldLabel}</span>
                          <p className="text-xs text-[#5a5e7a] leading-relaxed font-medium">
                            {answer !== undefined ? (
                              displayVal || <span className="text-gray-400 italic">Not answered</span>
                            ) : (
                              <span className="text-gray-400 italic">Not answered</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {Object.entries(viewResponsesBooking.formResponses).map(([key, val]) => (
                      <div key={key} className="p-3 bg-[#faf7f2]/30 border border-[#e8dcc4] rounded-xl space-y-1">
                        <span className="text-xs font-bold text-[#1c1f4a]">{allQuestions[key] || `Question ID: ${key}`}</span>
                        <p className="text-xs text-[#5a5e7a] leading-relaxed">{String(val)}</p>
                      </div>
                    ))}
                    {Object.keys(viewResponsesBooking.formResponses).length === 0 && (
                      <span className="text-xs text-[#5a5e7a] italic">No questionnaire answers registered.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Reason dialog modal */}
      <Dialog open={!!cancelBooking} onOpenChange={(open) => !open && setCancelBooking(null)}>
        <DialogContent className="max-w-md border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-white text-sm font-bold">Cancel Seeker Booking</DialogTitle>
          </DialogHeader>

          {cancelBooking && (
            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Seeker name</span>
                <span className="font-bold text-[#1c1f4a]">{cancelBooking.userName}</span>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Therapy Session</span>
                <span className="font-bold text-[#1c1f4a]">{cancelBooking.subCategoryName}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancelReason" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Reason for Cancellation
                </Label>
                <textarea
                  id="cancelReason"
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={actionLoading}
                  placeholder="Specify cancellation details (sent to seeker via WhatsApp)..."
                  className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16] text-[#1c1f4a]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelBooking(null)}
                  disabled={actionLoading}
                  className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl text-xs font-semibold"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Cancel"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation transitions modal */}
      <AlertDialog open={!!confirmStatusUpdate} onOpenChange={(open) => !open && setConfirmStatusUpdate(null)}>
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">Confirm Status Update</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to transition booking reference for{" "}
              <strong className="text-[#1c1f4a]">{confirmStatusUpdate?.booking.userName}</strong> to status{" "}
              <strong className="text-[#1c1f4a] uppercase">{confirmStatusUpdate?.nextStatus.replace("_", " ")}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmStatusUpdate) {
                  executeStatusTransition(confirmStatusUpdate.booking.id, confirmStatusUpdate.nextStatus);
                }
              }}
              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-xs font-semibold rounded-xl"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function BookingsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <BookingsDashboardContent />
    </Suspense>
  );
}
