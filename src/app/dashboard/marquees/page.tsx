"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta } from "@/lib/pagination";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Volume2,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Search,
  ExternalLink,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Clock,
  ArrowRight,
  Eye,
  AlertCircle,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface MarqueeRow {
  id: string;
  title: string;
  content: string;
  link: string | null;
  linkText: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function MarqueesDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDateParam ? new Date(startDateParam) : undefined,
    to: endDateParam ? new Date(endDateParam) : undefined,
  });

  const pushParams = useCallback(
    (params: URLSearchParams, replace = false) => {
      const url = `${pathname}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router],
  );

  // Sync filters from URL
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalStatus(statusFilter);
    setDateRange({
      from: startDateParam ? new Date(startDateParam) : undefined,
      to: endDateParam ? new Date(endDateParam) : undefined,
    });
  }, [searchQuery, statusFilter, startDateParam, endDateParam]);

  // Data states
  const [marquees, setMarquees] = useState<MarqueeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMarquee, setEditingMarquee] = useState<MarqueeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarqueeRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    link: "",
    linkText: "",
    isActive: false,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Visual Editor ref & styling
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const checkActiveStyles = () => {
    if (typeof document !== "undefined") {
      setActiveStyles({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        content: editorRef.current!.innerHTML,
      }));
    }
  };

  const executeCommand = (command: string) => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false);
      handleEditorInput();
      checkActiveStyles();
    }
  };

  useEffect(() => {
    if (modalOpen && editorRef.current) {
      editorRef.current.innerHTML = formData.content || "";
      checkActiveStyles();
    }
  }, [modalOpen]);

  // Fetch Marquees (silent = true prevents full table unmount/flashing)
  const fetchMarquees = useCallback(
    async (silent = false) => {
      try {
        if (!silent && isInitialLoadRef.current) {
          setLoading(true);
        }
        const searchPart = searchQuery
          ? `&search=${encodeURIComponent(searchQuery)}`
          : "";
        const statusPart =
          statusFilter !== "all" ? `&status=${statusFilter}` : "";
        const datePart =
          startDateParam && endDateParam
            ? `&startDate=${startDateParam}&endDate=${endDateParam}`
            : "";

        const res = await fetch(
          `/api/marquees?page=${page}&limit=${limit}${searchPart}${statusPart}${datePart}`,
        );
        if (!res.ok) throw new Error("Failed to load marquees");
        const json = await res.json();
        setMarquees(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load marquees");
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    },
    [page, limit, searchQuery, statusFilter, startDateParam, endDateParam],
  );

  useEffect(() => {
    fetchMarquees();
  }, [fetchMarquees]);

  // Realtime updates (silent refresh in place)
  useRealtime(["marquees"], () => {
    fetchMarquees(true);
  });

  // Apply filters handler
  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", limit);

    if (localSearch.trim()) params.set("search", localSearch.trim());
    if (localStatus !== "all") params.set("status", localStatus);

    if (dateRange?.from) {
      params.set("startDate", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      params.set("endDate", format(dateRange.to, "yyyy-MM-dd"));
    }

    pushParams(params);
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setDateRange(undefined);

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", limit);
    pushParams(params);
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingMarquee(null);
    setFormData({
      title: "",
      content: "",
      link: "",
      linkText: "",
      isActive: false,
      startDate: undefined,
      endDate: undefined,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: MarqueeRow) => {
    setEditingMarquee(item);
    setFormData({
      title: item.title,
      content: item.content,
      link: item.link || "",
      linkText: item.linkText || "",
      isActive: item.isActive,
      startDate: item.startDate ? new Date(item.startDate) : undefined,
      endDate: item.endDate ? new Date(item.endDate) : undefined,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = item.content;
    }
    setModalOpen(true);
  };

  // Toggle Active directly from table
  const handleToggleActive = async (item: MarqueeRow) => {
    const newActive = !item.isActive;
    // Optimistic UI update so table doesn't flicker or reload
    setMarquees((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? { ...m, isActive: newActive }
          : newActive
            ? { ...m, isActive: false }
            : m,
      ),
    );

    try {
      setToggleLoadingId(item.id);

      const res = await fetch(`/api/marquees/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update status");
      }

      toast.success(
        newActive
          ? `"${item.title}" is now the active header marquee!`
          : `"${item.title}" is now inactive.`,
      );
      fetchMarquees(true);
    } catch (err: any) {
      toast.error(err.message || "Could not update status");
      // Revert optimistic update on error
      fetchMarquees(true);
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Save Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a title for the announcement.");
      return;
    }

    if (!formData.content.trim() || formData.content === "<p><br></p>") {
      toast.error("Please enter content for the marquee.");
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        link: formData.link.trim() || null,
        linkText: formData.linkText.trim() || null,
        isActive: formData.isActive,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
      };

      const url = editingMarquee
        ? `/api/marquees/${editingMarquee.id}`
        : "/api/marquees";
      const method = editingMarquee ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save marquee announcement.");
      }

      toast.success(
        editingMarquee
          ? "Marquee announcement updated successfully!"
          : "Marquee announcement created successfully!",
      );
      setModalOpen(false);
      fetchMarquees(true);
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving.");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    // Optimistically remove from state immediately
    setMarquees((prev) => prev.filter((m) => m.id !== targetId));
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/marquees/${targetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to delete marquee.");
      }

      toast.success("Marquee deleted successfully.");
      fetchMarquees(true);
    } catch (err: any) {
      toast.error(err.message || "Could not delete marquee.");
      fetchMarquees(true);
    }
  };

  // Date validity helper
  const isDateExpired = (endDateStr: string | null) => {
    if (!endDateStr) return false;
    const endDay = new Date(endDateStr);
    endDay.setHours(23, 59, 59, 999);
    return new Date().getTime() > endDay.getTime();
  };

  return (
    <div className="w-full space-y-6">
      {/* Title & Description Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Header Marquee Announcements
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Configure announcement banners that scroll smoothly under the
            website header. Only one marquee can be active at a time.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Marquee
        </button>
      </div>

      {/* Filter toolbar (with Search, Status, Date range, Clear All, and Apply) */}
      <div className="flex flex-col md:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        {/* Search */}
        <div className="flex-1 min-w-[150px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Search Marquees
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by title, content, or link..."
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        {/* Status */}
        <div className="w-full md:w-40 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Status
          </Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="w-full md:w-52 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Date range
          </Label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Filter Action Buttons (Clear All & Apply) */}
        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
          <Button
            type="button"
            onClick={handleClearFilters}
            variant="outline"
            className="h-9 px-4 border-[#e8dcc4] bg-white hover:bg-[#faf7f2] text-xs font-bold text-[#5a5e7a] rounded-xl flex items-center justify-center cursor-pointer flex-1 md:flex-none"
          >
            Clear All
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 px-4 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer flex-1 md:flex-none"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Marquees Table */}
      <div className="bg-white border border-[#e8dcc4] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#faf7f2]/50">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Announcement Title
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Formatted Content
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Action Hyperlink
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Validity / Schedule
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a] text-center">
                  Live Status
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#e8dcc4]/40">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mx-auto" />
                    <p className="text-xs text-[#5a5e7a] mt-2">
                      Loading announcements...
                    </p>
                  </TableCell>
                </TableRow>
              ) : marquees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <AlertCircle className="w-8 h-8 text-[#b86a16]/60 mx-auto mb-2" />
                    <p className="text-sm font-medium text-[#1c1f4a]">
                      No marquee announcements found
                    </p>
                    <p className="text-xs max-w-sm mx-auto text-[#5a5e7a] mt-1">
                      Create a marquee announcement banner to broadcast
                      messages, offerings, or updates under the main header.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                marquees.map((item) => {
                  const expired = isDateExpired(item.endDate);

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-[#faf7f2]/30 transition-colors"
                    >
                      {/* Title */}
                      <TableCell className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#1c1f4a]">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-[#9396ae]">
                          {format(new Date(item.createdAt), "dd MMM yyyy")}
                        </div>
                      </TableCell>

                      {/* Content Preview */}
                      <TableCell className="py-3.5 px-4 max-w-sm">
                        <div
                          className="text-xs text-[#5a5e7a] line-clamp-2 [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:text-[#b86a16] [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </TableCell>

                      {/* Action Link (Never shows raw URL) */}
                      <TableCell className="py-3.5 px-4">
                        {item.link ? (
                          <a
                            href={item.link}
                            target={
                              item.link.startsWith("http")
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              item.link.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8962e]/10 hover:bg-[#e8962e]/20 border border-[#e8962e]/30 text-xs font-semibold text-[#b86a16] transition-colors cursor-pointer group"
                          >
                            <span className="underline underline-offset-2">
                              {item.linkText || "Learn More"}
                            </span>
                            <ExternalLink className="w-3 h-3 text-[#e8962e]" />
                          </a>
                        ) : (
                          <span className="text-xs text-[#9396ae]">—</span>
                        )}
                      </TableCell>

                      {/* Schedule / Validity */}
                      <TableCell className="py-3.5 px-4 text-xs">
                        {item.startDate || item.endDate ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 text-[#1c1f4a]">
                              <Clock className="w-3.5 h-3.5 text-[#b86a16]" />
                              <span>
                                {item.startDate
                                  ? format(
                                      new Date(item.startDate),
                                      "dd MMM yyyy",
                                    )
                                  : "Now"}
                                {" → "}
                                {item.endDate
                                  ? format(
                                      new Date(item.endDate),
                                      "dd MMM yyyy",
                                    )
                                  : "Indefinite"}
                              </span>
                            </div>
                            {expired && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                Expired
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#5a5e7a]">
                            Until Inactive
                          </span>
                        )}
                      </TableCell>

                      {/* Status / Quick Toggle */}
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium">
                              Inactive
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={toggleLoadingId === item.id}
                            onClick={() => handleToggleActive(item)}
                            className="text-[11px] font-semibold text-[#b86a16] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {toggleLoadingId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin inline" />
                            ) : item.isActive ? (
                              "Deactivate"
                            ) : (
                              "Set Active"
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 text-[#1c1f4a] hover:bg-[#1c1f4a]/10 rounded-lg cursor-pointer"
                            title="Edit Marquee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Delete Marquee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <TablePaginationFooter pagination={pagination} />
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingMarquee(null);
        }}
      >
        <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto [&>button]:text-white/80 hover:[&>button]:text-white hover:[&>button]:bg-white/10 [&>button]:z-50">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              {editingMarquee
                ? "Edit Marquee Announcement"
                : "Create Marquee Announcement"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {/* Title */}
            <div className="space-y-1">
              <Label
                htmlFor="mq-title"
                className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider"
              >
                Title Tag / Category *
              </Label>
              <Input
                id="mq-title"
                required
                placeholder="e.g. Announcement, Upcoming Retreat, Workshop Update"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="h-9 rounded-xl border-[#e8dcc4] focus:border-[#b86a16] text-xs"
              />
              <p className="text-[11px] text-[#5a5e7a]">
                Displayed as a high-contrast badge at the beginning of each
                loop.
              </p>
            </div>

            {/* Announcement Content (Bold, Italic, Underline - NO Link button) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="mq-content"
                  className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider"
                >
                  Announcement Content *
                </Label>
                {/* Visual formatting buttons: Bold, Italic, Underline */}
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => executeCommand("bold")}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors flex items-center justify-center cursor-pointer border ${
                      activeStyles.bold
                        ? "bg-[#1c1f4a] text-white border-[#1c1f4a]"
                        : "text-[#1c1f4a] hover:bg-[#faf7f2] border-[#e8dcc4]"
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand("italic")}
                    className={`h-7 w-7 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer border ${
                      activeStyles.italic
                        ? "bg-[#1c1f4a] text-white border-[#1c1f4a]"
                        : "text-[#1c1f4a] hover:bg-[#faf7f2] border-[#e8dcc4]"
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand("underline")}
                    className={`h-7 w-7 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer border ${
                      activeStyles.underline
                        ? "bg-[#1c1f4a] text-white border-[#1c1f4a]"
                        : "text-[#1c1f4a] hover:bg-[#faf7f2] border-[#e8dcc4]"
                    }`}
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onKeyUp={checkActiveStyles}
                onMouseUp={checkActiveStyles}
                className="min-h-[80px] max-h-[130px] overflow-y-auto p-3 text-xs rounded-xl border border-[#e8dcc4] bg-white outline-none focus:border-[#b86a16] leading-relaxed whitespace-pre-wrap break-words text-[#1c1f4a] [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline"
              />
              <p className="text-[11px] text-[#5a5e7a]">
                Type announcement message. Format with Bold, Italic, and Underline. Action link can be specified below.
              </p>
            </div>

            {/* Direct Action Link & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#faf7f2]/70 border border-[#e8dcc4]">
              <div className="space-y-1">
                <Label
                  htmlFor="mq-link"
                  className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider"
                >
                  Direct Action Link (URL)
                </Label>
                <Input
                  id="mq-link"
                  placeholder="e.g. /offerings#retreats or https://..."
                  value={formData.link}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, link: e.target.value }))
                  }
                  className="h-9 rounded-xl bg-white border-[#e8dcc4] text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="mq-link-text"
                  className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider"
                >
                  Link Hyperlink Title
                </Label>
                <Input
                  id="mq-link-text"
                  placeholder="e.g. Register Now, Explore Offerings"
                  value={formData.linkText}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      linkText: e.target.value,
                    }))
                  }
                  className="h-9 rounded-xl bg-white border-[#e8dcc4] text-xs"
                />
              </div>
            </div>

            {/* Scheduling (Start Date & End After Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                  Start Date (Optional)
                </Label>
                <DatePicker
                  value={formData.startDate}
                  onChange={(d) =>
                    setFormData((prev) => ({ ...prev, startDate: d }))
                  }
                  placeholder="Start immediately"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                  End After Date (Optional)
                </Label>
                <DatePicker
                  value={formData.endDate}
                  onChange={(d) =>
                    setFormData((prev) => ({ ...prev, endDate: d }))
                  }
                  placeholder="No expiration"
                />
              </div>
            </div>

            {/* Active Switch with shadcn Checkbox */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf7f2]/60 border border-[#e8dcc4]">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="mq-active"
                  className="text-xs font-bold text-[#1c1f4a] cursor-pointer block"
                >
                  Set as Active Header Banner
                </Label>
                <p className="text-[11px] text-[#5a5e7a]">
                  Only one marquee will be live at a time. Enabling this
                  deactivates other active marquees.
                </p>
              </div>
              <Checkbox
                id="mq-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: !!checked }))
                }
                className="h-5 w-5 rounded-md border-[#1c1f4a]/40 data-[state=checked]:bg-[#1c1f4a] data-[state=checked]:border-[#1c1f4a] cursor-pointer shrink-0"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#e8dcc4]/50 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-[#5a5e7a] hover:bg-[#faf7f2]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="h-10 px-6 rounded-xl bg-[#1c1f4a] hover:bg-[#282d6b] text-white text-xs font-semibold shadow-md cursor-pointer transition-all"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : editingMarquee ? (
                  "Update Marquee"
                ) : (
                  "Create Marquee"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-[#e8dcc4] bg-white max-w-md p-6">
          <AlertDialogHeader className="flex flex-col items-center text-center sm:text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-serif text-[#1c1f4a] text-center">
              Delete Marquee Announcement?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed text-center max-w-sm mx-auto">
              Are you sure you want to permanently delete &quot;
              {deleteTarget?.title}&quot;? If this marquee is currently live, it
              will immediately stop displaying across the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex flex-row items-center justify-center sm:justify-center gap-3">
            <AlertDialogCancel className="h-9 px-5 rounded-xl text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="h-9 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MarqueesDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#b86a16]" />
        </div>
      }
    >
      <MarqueesDashboardContent />
    </Suspense>
  );
}
