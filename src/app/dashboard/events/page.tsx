"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta } from "@/lib/pagination";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { getJsonOrError } from "@/lib/utils";
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Search,
  Link2,
  Bold,
  Italic,
  Underline,
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

type EventRow = {
  id: string;
  title: string;
  description: string;
  link: string | null;
  type: "event" | "update";
  isActive: boolean;
  eventDate: string;
  createdAt: string;
};

function EventsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const typeFilter = searchParams.get("type") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localType, setLocalType] = useState(typeFilter);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDateParam ? new Date(startDateParam) : undefined,
    to: endDateParam ? new Date(endDateParam) : undefined,
  });

  const pushParams = useCallback((params: URLSearchParams, replace = false) => {
    const url = `${pathname}?${params.toString()}`;
    if (replace) router.replace(url);
    else router.push(url);
  }, [pathname, router]);

  // Sync filters from URL
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalType(typeFilter);
    setLocalStatus(statusFilter);
    setDateRange({
      from: startDateParam ? new Date(startDateParam) : undefined,
      to: endDateParam ? new Date(endDateParam) : undefined,
    });
  }, [searchQuery, typeFilter, statusFilter, startDateParam, endDateParam]);

  // Data states
  const [eventsData, setEventsData] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Dialog / action states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<EventRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    type: "event" as "event" | "update",
    isActive: true,
    eventDate: undefined as Date | undefined,
  });

  const editorRef = useRef<HTMLDivElement>(null);

  // Active styles status tracker
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

  // Keep description input synced
  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current!.innerHTML,
      }));
    }
  };

  // Format editor contents using browser document.execCommand
  const executeCommand = (command: string) => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false);
      if (editorRef.current) {
        setFormData((prev) => ({
          ...prev,
          description: editorRef.current!.innerHTML,
        }));
      }
      checkActiveStyles();
    }
  };

  // Selection change listener for formatting buttons highlights
  useEffect(() => {
    const handleSelectionChange = () => {
      if (modalOpen && document.activeElement === editorRef.current) {
        checkActiveStyles();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [modalOpen]);

  // Sync editor content editable value when dialog state changes
  useEffect(() => {
    if (modalOpen && editorRef.current) {
      editorRef.current.innerHTML = formData.description;
      checkActiveStyles();
    }
  }, [modalOpen]);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const typePart = typeFilter !== "all" ? `&type=${typeFilter}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const datePart = startDateParam && endDateParam ? `&startDate=${startDateParam}&endDate=${endDateParam}` : "";
      
      const res = await fetch(
        `/api/events?page=${page}&limit=${limit}${searchPart}${typePart}${statusPart}${datePart}`
      );
      if (!res.ok) throw new Error("Failed to load events.");
      const json = await res.json();
      if (json.success) {
        setEventsData(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading events feed.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, typeFilter, statusFilter, startDateParam, endDateParam]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useRealtime(["events"], fetchEvents);

  // Filter handlers
  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (localSearch.trim()) params.set("search", localSearch.trim());
    else params.delete("search");

    if (localType !== "all") params.set("type", localType);
    else params.delete("type");

    if (localStatus !== "all") params.set("status", localStatus);
    else params.delete("status");

    if (dateRange?.from) {
      params.set("startDate", format(dateRange.from, "yyyy-MM-dd"));
    } else {
      params.delete("startDate");
    }
    if (dateRange?.to) {
      params.set("endDate", format(dateRange.to, "yyyy-MM-dd"));
    } else {
      params.delete("endDate");
    }

    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalType("all");
    setLocalStatus("all");
    setDateRange(undefined);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", limit);
    pushParams(params);
  };

  const handleOpenAnnounce = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      link: "",
      type: "event",
      isActive: true,
      eventDate: new Date(),
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (event: EventRow) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      link: event.link || "",
      type: event.type,
      isActive: event.isActive,
      eventDate: new Date(event.eventDate),
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formData.description.trim() || formData.description === "<br>") {
      setFormError("Description is required.");
      return;
    }
    if (!formData.eventDate) {
      setFormError("Event date is required.");
      return;
    }

    setFormLoading(true);
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          link: formData.link.trim() || null,
          type: formData.type,
          isActive: formData.isActive,
          eventDate: formData.eventDate.toISOString(),
        }),
      });

      const json = await getJsonOrError(res, editingEvent ? "Failed to update record." : "Failed to create record.");

      toast.success(editingEvent ? "Event/Update updated successfully!" : "Event/Update published successfully!");
      setModalOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (event: EventRow) => {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !event.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Event status marked as ${!event.isActive ? "Active" : "Inactive"}`);
      fetchEvents();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteEvent) return;
    try {
      const res = await fetch(`/api/events/${deleteEvent.id}`, { method: "DELETE" });
      const json = await getJsonOrError(res, "Failed to delete record.");
      toast.success("Event/Update deleted successfully.");
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record.");
    } finally {
      setDeleteEvent(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <style>{`
        .rich-editor:empty:before {
          content: attr(data-placeholder);
          color: #999;
          font-style: italic;
          display: block;
        }
      `}</style>

      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Events &amp; Updates Config
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Publish site updates and announcement events. Format descriptions with bold, italic, and underline details.
          </p>
        </div>
        <Button
          onClick={handleOpenAnnounce}
          className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Event/Update
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[150px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Search Events
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full md:w-40 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Type
          </Label>
          <Select value={localType} onValueChange={setLocalType}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="update">Update</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-52 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Date range
          </Label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
            className="h-9 px-4 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer flex-1 md:flex-none"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Events Table list */}
      <div className="bg-white border border-[#e8dcc4] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#faf7f2]/50">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a] w-1/3">
                  Title &amp; Type
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a] w-1/3">
                  Description Preview
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Date
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Status
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#e8dcc4]/40">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mx-auto" />
                    <p className="text-xs text-[#5a5e7a] mt-2">Loading announcements...</p>
                  </TableCell>
                </TableRow>
              ) : eventsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <AlertCircle className="w-8 h-8 text-[#b86a16]/60 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1c1f4a]">No events or updates found.</p>
                    <p className="text-[10px] text-[#5a5e7a] mt-1">Try resetting filters or create a new announcement.</p>
                  </TableCell>
                </TableRow>
              ) : (
                eventsData.map((event) => {
                  const eventDateObj = new Date(event.eventDate);
                  return (
                    <TableRow
                      key={event.id}
                      className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors"
                    >
                      <TableCell className="py-3.5 px-4 text-xs font-semibold text-[#1c1f4a]">
                        <div>
                          <p className="font-bold text-[#1c1f4a]">{event.title}</p>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase mt-1 tracking-wider ${
                              event.type === "event"
                                ? "bg-[#b86a16]/10 text-[#b86a16]"
                                : "bg-[#1c1f4a]/10 text-[#1c1f4a]"
                            }`}
                          >
                            {event.type}
                          </span>
                          {event.link && (
                            <a
                              href={event.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] text-indigo-600 font-semibold ml-2 hover:underline"
                            >
                              <Link2 className="w-3 h-3" /> View URL
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-[#5a5e7a]">
                        <p
                          className="line-clamp-2 max-w-[320px] text-[11px]"
                          dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-[#5a5e7a] font-semibold">
                        {eventDateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs">
                        <button
                          onClick={() => handleToggleStatus(event)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                            event.isActive
                              ? "bg-[#6b8f71]/15 text-[#6b8f71] hover:bg-[#6b8f71]/25"
                              : "bg-[#c4796a]/15 text-[#c4796a] hover:bg-[#c4796a]/25"
                          }`}
                        >
                          {event.isActive ? "Active" : "Inactive"}
                        </button>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleOpenEdit(event)}
                            className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteEvent(event)}
                            className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <TablePaginationFooter pagination={pagination} variant="bottom" />
      </div>

      {/* Create / Edit Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) setEditingEvent(null);
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              {editingEvent ? "Edit Event/Update" : "Publish Event/Update"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="eventTitle" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="eventTitle"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title..."
                className="h-10 text-xs bg-[#faf7f2]/40 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16] text-[#1c1f4a]"
                required
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="eventType" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                  Announcement Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val as "event" | "update" })}
                  disabled={formLoading}
                >
                  <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event" className="text-xs">Event</SelectItem>
                    <SelectItem value="update" className="text-xs">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                  Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  value={formData.eventDate}
                  onChange={(d) => setFormData({ ...formData, eventDate: d })}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="eventLink" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                External Link (Optional)
              </Label>
              <Input
                id="eventLink"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com/details..."
                className="h-10 text-xs bg-[#faf7f2]/40 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16] text-[#1c1f4a]"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="eventDescription" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Description <span className="text-red-500">*</span>
                </Label>
                {/* Visual rich formatting toolbar - highlighted if state is active */}
                <div className="inline-flex items-center border border-[#e8dcc4] rounded-lg overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => executeCommand("bold")}
                    className={`p-1.5 border-r border-[#e8dcc4] cursor-pointer transition-all ${
                      activeStyles.bold
                        ? "bg-[#1c1f4a] text-white hover:bg-[#1c1f4a]"
                        : "hover:bg-[#faf7f2]/70 text-[#1c1f4a]"
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand("italic")}
                    className={`p-1.5 border-r border-[#e8dcc4] cursor-pointer transition-all ${
                      activeStyles.italic
                        ? "bg-[#1c1f4a] text-white hover:bg-[#1c1f4a]"
                        : "hover:bg-[#faf7f2]/70 text-[#1c1f4a]"
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand("underline")}
                    className={`p-1.5 cursor-pointer transition-all ${
                      activeStyles.underline
                        ? "bg-[#1c1f4a] text-white hover:bg-[#1c1f4a]"
                        : "hover:bg-[#faf7f2]/70 text-[#1c1f4a]"
                    }`}
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Native ContentEditable rich text editor */}
              <div
                id="eventDescription"
                ref={editorRef}
                contentEditable={!formLoading}
                onInput={handleEditorInput}
                onKeyUp={checkActiveStyles}
                onMouseUp={checkActiveStyles}
                onFocus={checkActiveStyles}
                data-placeholder="Enter description text here. Select text and format..."
                style={{ minHeight: "150px" }}
                className="rich-editor w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16] text-[#1c1f4a] overflow-y-auto"
              />
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <Checkbox
                id="eventIsActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                disabled={formLoading}
              />
              <Label htmlFor="eventIsActive" className="text-xs font-bold text-[#1c1f4a] cursor-pointer uppercase tracking-wide">
                Show Announcement on Public Page
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setEditingEvent(null);
                }}
                disabled={formLoading}
                className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold"
              >
                {formLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingEvent ? (
                  "Save Changes"
                ) : (
                  "Publish Announcement"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent className="rounded-3xl border border-[#e8dcc4] bg-white max-w-sm p-6 font-sans shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-base font-bold text-[#1c1f4a]">
                Delete Announcement
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
                Are you sure you want to delete this event/update? This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="flex sm:flex-row gap-2 mt-6 justify-center w-full">
            <AlertDialogCancel className="flex-1 border border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50 py-2 h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl py-2 h-9"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EventsDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <EventsDashboardContent />
    </Suspense>
  );
}
