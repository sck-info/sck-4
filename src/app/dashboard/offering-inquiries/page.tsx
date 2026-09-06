"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  HelpCircle,
  Search,
  Download,
  Trash2,
  Edit2,
  Loader2,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  X,
  ExternalLink,
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
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
import { formatDate } from "@/lib/format";

type InquiryRow = {
  id: string;
  name: string;
  phoneCode: string;
  phone: string;
  email: string | null;
  status: "pending" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const formatLocalDateYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function OfferingInquiriesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL pagination & filter params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || DEFAULT_PAGE_LIMIT.toString());
  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (startDateParam && endDateParam) {
      return {
        from: new Date(startDateParam),
        to: new Date(endDateParam),
      };
    }
    return undefined;
  });

  // Table state
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<InquiryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhoneCode, setEditPhoneCode] = useState("+91");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "completed" | "cancelled">("pending");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInquiryId, setDeleteInquiryId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pushParams = useCallback(
    (newParams: Record<string, string>, replace = false) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      const url = `${pathname}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router, searchParams]
  );

  // Sync filter inputs when URL changes
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalStatus(statusFilter);
    if (startDateParam && endDateParam) {
      setDateRange({
        from: new Date(startDateParam),
        to: new Date(endDateParam),
      });
    } else {
      setDateRange(undefined);
    }
  }, [searchQuery, statusFilter, startDateParam, endDateParam]);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const datePart =
        startDateParam && endDateParam
          ? `&startDate=${startDateParam}&endDate=${endDateParam}`
          : "";

      const res = await fetch(
        `/api/offering-inquiries?page=${page}&limit=${limit}${searchPart}${statusPart}${datePart}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load offering inquiries.");
      }
      const result = await res.json();
      setInquiries(result.data || []);
      setPagination(result.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch offering inquiries.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter, startDateParam, endDateParam]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useRealtime(["offering_inquiries"], () => {
    fetchInquiries();
  });

  const handleApplyFilters = () => {
    const params: Record<string, string> = {
      search: localSearch.trim(),
      status: localStatus,
      page: "1",
    };

    if (dateRange?.from) {
      params.startDate = formatLocalDateYMD(dateRange.from);
    } else {
      params.startDate = "";
    }

    if (dateRange?.to) {
      params.endDate = formatLocalDateYMD(dateRange.to);
    } else {
      params.endDate = "";
    }

    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setDateRange(undefined);
    pushParams({
      search: "",
      status: "all",
      startDate: "",
      endDate: "",
      page: "1",
    });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const datePart =
        startDateParam && endDateParam
          ? `&startDate=${startDateParam}&endDate=${endDateParam}`
          : "";

      const res = await fetch(
        `/api/offering-inquiries?export=true${searchPart}${statusPart}${datePart}`
      );
      if (!res.ok) throw new Error("Failed to export inquiries");
      const json = await res.json();
      const rows: InquiryRow[] = json.data || [];

      const headers = [
        "Inquiry ID",
        "Seeker Name",
        "Phone Code",
        "Phone Number",
        "Email Address",
        "Status",
        "Admin Notes",
        "Created At",
      ];

      const csvRows = [headers.join(",")];

      for (const r of rows) {
        const values = [
          r.id,
          r.name || "",
          r.phoneCode || "",
          r.phone || "",
          r.email || "",
          r.status || "",
          r.notes || "",
          formatDate(r.createdAt),
        ];

        const escaped = values.map((val) => {
          const stringified = String(val);
          if (
            stringified.includes(",") ||
            stringified.includes('"') ||
            stringified.includes("\n")
          ) {
            return `"${stringified.replace(/"/g, '""')}"`;
          }
          return stringified;
        });

        csvRows.push(escaped.join(","));
      }

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvRows.join("\n"));
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute(
        "download",
        `offering_inquiries_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Inquiries CSV exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export inquiries.");
    } finally {
      setExporting(false);
    }
  };

  const handleOpenEdit = (inquiry: InquiryRow) => {
    setEditingInquiry(inquiry);
    setEditName(inquiry.name);
    setEditPhoneCode(inquiry.phoneCode || "+91");
    setEditPhone(inquiry.phone || "");
    setEditEmail(inquiry.email || "");
    setEditStatus(inquiry.status);
    setEditNotes(inquiry.notes || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInquiry) return;
    setEditLoading(true);

    try {
      const res = await fetch(`/api/offering-inquiries/${editingInquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phoneCode: editPhoneCode.trim(),
          phone: editPhone.replace(/\D/g, ""),
          email: editEmail.trim() || null,
          status: editStatus,
          notes: editNotes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update inquiry.");

      toast.success("Inquiry updated successfully.");
      setEditModalOpen(false);
      fetchInquiries();
    } catch (err: any) {
      toast.error(err.message || "Failed to update inquiry.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteInquiryId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/offering-inquiries/${deleteInquiryId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete inquiry.");

      toast.success("Offering inquiry record deleted.");
      setDeleteDialogOpen(false);
      setDeleteInquiryId(null);
      fetchInquiries();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete inquiry.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Offering Inquiries Queue
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1 font-medium">
            Review and manage requests from seekers seeking direct guidance on choosing the right offering.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleExportCSV}
            disabled={exporting || inquiries.length === 0}
            className="border border-[#e8dcc4] bg-white hover:bg-[#faf7f2]/50 text-[#1c1f4a] rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer flex items-center gap-2 shadow-xs"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Inquiries (CSV)</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        {/* Search */}
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Search Seeker
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search seeker name, phone, email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Inquiry Status
          </Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="completed">Completed Only</SelectItem>
              <SelectItem value="cancelled">Cancelled Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Picker */}
        <div className="w-full md:w-56 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Filter Date Range
          </Label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            className="flex-1 md:flex-initial h-9 px-3.5 border-[#e8dcc4] text-[#5a5e7a] hover:bg-[#faf7f2]/50 rounded-xl text-xs font-semibold"
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="flex-1 md:flex-initial h-9 px-4 bg-[#1c1f4a] hover:bg-[#2b2f6b] text-white rounded-xl text-xs font-semibold"
          >
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Inquiries Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-2" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading offering inquiries...
          </p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#e8dcc4] rounded-2xl bg-[#faf7f2]/10 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#b86a16]/10 flex items-center justify-center text-[#b86a16] mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1c1f4a]">
            No Offering Inquiries Found
          </h3>
          <p className="text-xs text-[#5a5e7a] max-w-sm mt-1 leading-relaxed">
            {searchQuery || statusFilter !== "all" || startDateParam
              ? "No records matched your search or status criteria. Try clearing filters."
              : "When seekers ask for guidance on the offerings page, their requests will appear here in real-time."}
          </p>
        </div>
      ) : (
        <div className="border border-[#e8dcc4] rounded-2xl bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#faf7f2]/60">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                    Seeker Details
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                    WhatsApp Phone
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                    Admin Notes
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                    Requested Date
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => {
                  const cleanPhone = inquiry.phone.replace(/\D/g, "");
                  const cleanCode = inquiry.phoneCode.replace(/\+/g, "");
                  const waUrl = `https://wa.me/${cleanCode}${cleanPhone}`;

                  return (
                    <TableRow
                      key={inquiry.id}
                      className="border-b border-[#e8dcc4]/50 hover:bg-[#faf7f2]/20 transition-colors"
                    >
                      {/* Name & Email */}
                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-[#1c1f4a]">
                            {inquiry.name}
                          </span>
                          {inquiry.email ? (
                            <span className="text-[11px] text-[#5a5e7a] flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-[#9396ae]" />
                              {inquiry.email}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#9396ae] italic mt-0.5">
                              No email provided
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Phone & WhatsApp Link */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#1c1f4a]">
                            {inquiry.phoneCode} {inquiry.phone}
                          </span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-[#6b8f71]/15 text-[#6b8f71] rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                            inquiry.status === "completed"
                              ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                              : inquiry.status === "cancelled"
                                ? "bg-[#c4796a]/15 text-[#c4796a]"
                                : "bg-[#b86a16]/10 text-[#b86a16]"
                          }`}
                        >
                          {inquiry.status}
                        </span>
                      </TableCell>

                      {/* Admin Notes */}
                      <TableCell className="py-3 px-4 max-w-xs">
                        {inquiry.notes ? (
                          <p className="text-xs text-[#1c1f4a] line-clamp-2 leading-relaxed">
                            {inquiry.notes}
                          </p>
                        ) : (
                          <span className="text-[11px] text-[#9396ae] italic">
                            No notes added
                          </span>
                        )}
                      </TableCell>

                      {/* Created At */}
                      <TableCell className="py-3 px-4 text-xs text-[#5a5e7a] whitespace-nowrap">
                        {formatDate(inquiry.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleOpenEdit(inquiry)}
                            className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                            title="Edit Inquiry & Notes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteInquiryId(inquiry.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* Edit Inquiry Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md border border-[#e8dcc4] bg-white rounded-3xl p-6 sm:p-7 shadow-xl font-sans">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold text-[#1c1f4a]">
              Edit Offering Inquiry
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5a5e7a]">
              Update seeker contact details, consultation status, and internal notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3.5 mt-2">
            {/* Seeker Name */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Seeker Name
              </Label>
              <Input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl text-xs text-[#1c1f4a]"
              />
            </div>

            {/* Phone Code & Phone */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Code
                </Label>
                <Input
                  type="text"
                  required
                  value={editPhoneCode}
                  onChange={(e) => setEditPhoneCode(e.target.value)}
                  className="h-9 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl text-xs font-mono text-[#1c1f4a]"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  WhatsApp Phone
                </Label>
                <Input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-9 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl text-xs font-mono text-[#1c1f4a]"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Email Address
              </Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="seeker@example.com"
                className="h-9 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl text-xs text-[#1c1f4a]"
              />
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Inquiry Status
              </Label>
              <Select
                value={editStatus}
                onValueChange={(val: any) => setEditStatus(val)}
              >
                <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending (Awaiting call)</SelectItem>
                  <SelectItem value="completed">Completed (Spoke with user)</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Admin Notes & Remarks
              </Label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Log discussion details, seeker questions, or recommendations..."
                className="w-full p-2.5 bg-[#faf7f2]/50 border border-[#e8dcc4] rounded-xl text-xs text-[#1c1f4a] outline-none focus:ring-1 focus:ring-[#b86a16]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#e8dcc4]/50">
              <Button
                type="button"
                variant="outline"
                disabled={editLoading}
                onClick={() => setEditModalOpen(false)}
                className="h-9 px-4 rounded-xl border-[#e8dcc4] text-[#1c1f4a] text-xs font-semibold hover:bg-[#faf7f2]/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="h-9 px-5 rounded-xl bg-[#1c1f4a] hover:bg-[#2b2f6b] text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border border-[#e8dcc4] bg-white max-w-md p-6 font-sans shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-base font-bold text-[#1c1f4a]">
                Delete Offering Inquiry
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
                Are you sure you want to delete this guidance inquiry record? This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="flex sm:flex-row gap-2 mt-6 justify-center w-full">
            <AlertDialogCancel
              disabled={deleteLoading}
              className="flex-1 border border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50 py-2 h-9"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl py-2 h-9"
            >
              {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OfferingInquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
        </div>
      }
    >
      <OfferingInquiriesContent />
    </Suspense>
  );
}
