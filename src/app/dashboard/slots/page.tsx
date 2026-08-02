"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import { getJsonOrError } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  Edit2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type SlotRow = {
  id: string;
  subCategoryId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: "available" | "booked" | "suspended";
  subCategoryName: string;
  locations?: {
    id: string;
    name: string;
    type: string;
    url: string | null;
  }[];
};

type SubCategoryRow = {
  id: string;
  name: string;
  requiresBooking: boolean;
};

type LocationRow = {
  id: string;
  name: string;
  type: string;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime12h = (time24: string) => {
  const [h, m] = time24.split(":");
  const hrs = parseInt(h);
  const ampm = hrs >= 12 ? "PM" : "AM";
  const hour12 = hrs % 12 === 0 ? 12 : hrs % 12;
  return `${hour12}:${m} ${ampm}`;
};

const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hrs, mins] = startTime.split(":").map(Number);
  const totalMinutes = hrs * 60 + mins + durationMinutes;
  const newHrs = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHrs).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
};

// Generate options for time selects
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const min = (i % 4) * 15 === 0 ? "00" : (i % 4) * 15;
  const hourStr = hour.toString().padStart(2, "0");
  const value = `${hourStr}:${min}`;

  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const label = `${hour12}:${min} ${ampm}`;

  return { value, label };
});

function SlotsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
 
  const formatLocalDateYMD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // URL pagination params
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const statusFilter = searchParams.get("status") || "all";
  const subCategoryFilter = searchParams.get("subCategory") || "all";
 
  const formatLocalDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getSlotDefaultRange = () => {
    const from = new Date();
    from.setDate(from.getDate() - 5);
    const to = new Date();
    to.setDate(to.getDate() + 25);
    return { from, to };
  };

  const defaultRange = getSlotDefaultRange();
  const defaultFromStr = formatLocalDate(defaultRange.from);
  const defaultToStr = formatLocalDate(defaultRange.to);
 
  const startDateParam = searchParams.get("startDate") || defaultFromStr;
  const endDateParam = searchParams.get("endDate") || defaultToStr;
 
  // Local filter states
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [localSubCategory, setLocalSubCategory] = useState(subCategoryFilter);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(startDateParam),
    to: new Date(endDateParam),
  });

  const pushParams = useCallback(
    (params: URLSearchParams, replace = false) => {
      const url = `${pathname}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router],
  );

  // Sync local states with URL params
  useEffect(() => {
    setLocalStatus(statusFilter);
    setLocalSubCategory(subCategoryFilter);
    setDateRange({
      from: new Date(startDateParam),
      to: new Date(endDateParam),
    });
  }, [statusFilter, subCategoryFilter, startDateParam, endDateParam]);

  // Data lists
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryRow[]>([]);
  const [locationsList, setLocationsList] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Announce slot states
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    subCategoryId: "",
    repeatType: "once" as "once" | "daily" | "weekly",
    slotDate: undefined as Date | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    daysOfWeek: [] as number[],
    selectedLocIds: [] as string[],
  });

  const [timingsList, setTimingsList] = useState<{ startTime: string; endTime: string; duration: number }[]>([]);
  const [currStartTime, setCurrStartTime] = useState("09:00");
  const [currDuration, setCurrDuration] = useState("60");

  const [conflictResult, setConflictResult] = useState<{
    createdCount: number;
    skippedCount: number;
    duplicates: { date: string; startTime: string; endTime: string; subCategoryName: string }[];
  } | null>(null);

  // Deletion slot states
  const [deleteSlot, setDeleteSlot] = useState<SlotRow | null>(null);
  const [blockedDeleteReason, setBlockedDeleteReason] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<SlotRow | null>(null);
  const [suspendConfirmSlot, setSuspendConfirmSlot] = useState<SlotRow | null>(null);

  // Fetch Slots
  const fetchSlots = useCallback(async () => {
    try {
      const statusPart =
        statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const subPart =
        subCategoryFilter !== "all"
          ? `&subCategoryId=${subCategoryFilter}`
          : "";
      const datePart = `&startDate=${startDateParam}&endDate=${endDateParam}`;

      const res = await fetch(
        `/api/slots?page=${page}&limit=${limit}${statusPart}${subPart}${datePart}`,
      );
      if (!res.ok) throw new Error("Failed to load slots");
      const json = await res.json();
      setSlots(json.data);
      setPagination(json.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Error loading announced slots");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, subCategoryFilter, startDateParam, endDateParam]);

  // Fetch helper lists (locations, offerings)
  const fetchHelpers = async () => {
    try {
      // Get sub-categories
      const subRes = await fetch("/api/sub-categories?page=1&limit=200");
      if (subRes.ok) {
        const json = await subRes.json();
        const filtered = json.data.filter(
          (s: SubCategoryRow) => s.requiresBooking,
        );
        setSubCategories(filtered);
        if (filtered.length > 0 && !formData.subCategoryId) {
          setFormData((prev) => ({ ...prev, subCategoryId: filtered[0].id }));
        }
      }

      // Get locations
      const locRes = await fetch("/api/locations?page=1&limit=200");
      if (locRes.ok) {
        const json = await locRes.json();
        setLocationsList(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    fetchHelpers();
  }, []);

  // Real-time updates
  useRealtime(["slots"], () => {
    fetchSlots();
  });

  // Trigger forms
  const handleOpenAnnounce = () => {
    setEditingSlot(null);
    setFormData({
      subCategoryId: subCategories[0]?.id || "",
      repeatType: "once",
      slotDate: undefined,
      startDate: undefined,
      endDate: undefined,
      daysOfWeek: [],
      selectedLocIds: [],
    });
    setTimingsList([
      { startTime: "09:00", endTime: "10:00", duration: 60 }
    ]);
    setCurrStartTime("09:00");
    setCurrDuration("60");
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (slot: SlotRow) => {
    setEditingSlot(slot);

    const cleanTime = (t: string) => {
      if (!t) return "";
      const parts = t.split(":");
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
      }
      return t;
    };

    setFormData({
      subCategoryId: slot.subCategoryId,
      repeatType: "once",
      slotDate: new Date(slot.slotDate),
      startDate: undefined,
      endDate: undefined,
      daysOfWeek: [],
      selectedLocIds: slot.locations ? slot.locations.map((l) => l.id) : [],
    });

    const parseTimeToMin = (tStr: string) => {
      const [h, m] = tStr.split(":").map(Number);
      return h * 60 + m;
    };
    const diff = parseTimeToMin(slot.endTime) - parseTimeToMin(slot.startTime);

    setTimingsList([
      {
        startTime: cleanTime(slot.startTime),
        endTime: cleanTime(slot.endTime),
        duration: diff > 0 ? diff : 60,
      }
    ]);
    setCurrStartTime(cleanTime(slot.startTime));
    setCurrDuration(String(diff > 0 ? diff : 60));
    setFormError("");
    setModalOpen(true);
  };

  // Submit Slot
  const handleAnnounceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.subCategoryId) {
      setFormError("Please select a sub-category offering.");
      return;
    }
    if (formData.selectedLocIds.length === 0) {
      setFormError("Please select at least one format location.");
      return;
    }
    if (formData.repeatType === "once" && !formData.slotDate) {
      setFormError("Please select a date for the slot.");
      return;
    }
    if ((formData.repeatType === "daily" || formData.repeatType === "weekly") && (!formData.startDate || !formData.endDate)) {
      setFormError("Please select a start and end date range.");
      return;
    }
    if (formData.repeatType === "weekly" && formData.daysOfWeek.length === 0) {
      setFormError("Please select at least one weekday.");
      return;
    }
    if (timingsList.length === 0) {
      setFormError("Please add at least one timings slot.");
      return;
    }

    setFormLoading(true);

    const formattedDate = formData.slotDate ? `${formData.slotDate.getFullYear()}-${String(formData.slotDate.getMonth() + 1).padStart(2, "0")}-${String(formData.slotDate.getDate()).padStart(2, "0")}` : undefined;
    const formattedStart = formData.startDate ? `${formData.startDate.getFullYear()}-${String(formData.startDate.getMonth() + 1).padStart(2, "0")}-${String(formData.startDate.getDate()).padStart(2, "0")}` : undefined;
    const formattedEnd = formData.endDate ? `${formData.endDate.getFullYear()}-${String(formData.endDate.getMonth() + 1).padStart(2, "0")}-${String(formData.endDate.getDate()).padStart(2, "0")}` : undefined;

    try {
      const url = editingSlot ? `/api/slots/${editingSlot.id}` : "/api/slots";
      const method = editingSlot ? "PATCH" : "POST";
      const payload = editingSlot
        ? {
            subCategoryId: formData.subCategoryId,
            slotDate: formattedDate,
            startTime: timingsList[0]?.startTime,
            endTime: timingsList[0]?.endTime,
            locationIds: formData.selectedLocIds,
          }
        : {
            subCategoryId: formData.subCategoryId,
            locationIds: formData.selectedLocIds,
            repeatType: formData.repeatType,
            slotDate: formattedDate,
            startDate: formattedStart,
            endDate: formattedEnd,
            daysOfWeek: formData.daysOfWeek,
            timings: timingsList.map((t) => ({ startTime: t.startTime, endTime: t.endTime })),
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit timings slot.");
      }

      if (!editingSlot && json.skippedCount > 0) {
        setConflictResult(json);
      } else {
        toast.success(editingSlot ? "Timings slot updated successfully!" : "Timings slot announced successfully!");
      }

      setModalOpen(false);
      setEditingSlot(null);
      fetchSlots();
    } catch (err: any) {
      setFormError(err.message || "An unexpected database error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete slot handler
  const handleConfirmDelete = async () => {
    if (!deleteSlot) return;
    try {
      const res = await fetch(`/api/slots/${deleteSlot.id}`, {
        method: "DELETE",
      });
      const json = await getJsonOrError(res, "Failed to delete slot.");

      toast.success("Timings slot deleted successfully.");
      fetchSlots();
    } catch (err: any) {
      if (err.message && err.message.includes("dependency_conflict")) {
        setBlockedDeleteReason("This slot cannot be deleted because it is already referenced by existing bookings. Please reassign or cancel those bookings first.");
      } else {
        toast.error(err.message || "Failed to delete slot.");
      }
    } finally {
      setDeleteSlot(null);
    }
  };

  const handleToggleStatus = async (slot: SlotRow) => {
    const newStatus = slot.status === "suspended" ? "available" : "suspended";
    try {
      const res = await fetch(`/api/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await getJsonOrError(res, "Failed to update slot status.");

      toast.success(
        newStatus === "suspended"
          ? "Timings slot suspended successfully."
          : "Timings slot opened again successfully."
      );
      fetchSlots();
    } catch (err: any) {
      toast.error(err.message || "Failed to update slot status.");
    }
  };

  const handleCheckboxChange = (locId: string, checked: boolean) => {
    setFormData((prev) => {
      let list = [...prev.selectedLocIds];
      if (checked) {
        list.push(locId);
      } else {
        list = list.filter((id) => id !== locId);
      }
      return { ...prev, selectedLocIds: list };
    });
  };

  const disableBeforeTomorrow = (d: Date) => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d < tomorrow;
  };

  const disableBeforeStartDate = (d: Date) => {
    if (!formData.startDate) {
      return disableBeforeTomorrow(d);
    }
    const start = new Date(formData.startDate);
    start.setHours(0, 0, 0, 0);
    return d <= start;
  };

  const handleStartDateChange = (d: Date | undefined) => {
    setFormData((prev) => {
      const nextData = { ...prev, startDate: d };
      if (d && prev.endDate && prev.endDate <= d) {
        nextData.endDate = undefined;
      }
      return nextData;
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", localStatus);
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
    setLocalStatus("all");
    setLocalSubCategory("all");
    const dRange = getSlotDefaultRange();
    setDateRange(dRange);

    const params = new URLSearchParams(searchParams.toString());
    params.set("status", "all");
    params.set("subCategory", "all");
    params.set("startDate", formatLocalDateYMD(dRange.from));
    params.set("endDate", formatLocalDateYMD(dRange.to));
    params.set("page", "1");
    pushParams(params);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Slots Announcer Console
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Announce available session times and prevent timing conflicts in
            real-time.
          </p>
        </div>
        <Button
          onClick={handleOpenAnnounce}
          className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-5 text-xs font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Announce Timings
        </Button>
      </div>

      {/* Neat Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col md:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[180px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Offering sub-category
          </Label>
          <Select value={localSubCategory} onValueChange={setLocalSubCategory}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Offerings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Offerings</SelectItem>
              {subCategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-44 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Booking Status
          </Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available Only</SelectItem>
              <SelectItem value="booked">Booked Only</SelectItem>
              <SelectItem value="suspended">Suspended Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-56 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Filter Date Range
          </Label>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
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
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading slots queue...
          </p>
        </div>
      ) : slots.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <Calendar className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No slots found
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your filters or date picker search to locate timings
            slots.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Offering sub-category
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Date
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Timing block
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Format options
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Booking Status
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow
                    key={slot.id}
                    className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                      slot.status === "booked"
                        ? "opacity-75 bg-[#f6faf8]/40"
                        : ""
                    }`}
                  >
                    <TableCell className="py-3 px-4 text-xs font-bold text-[#1c1f4a]">
                      {slot.subCategoryName}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-[#5a5e7a] font-semibold">
                      {formatDate(slot.slotDate)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-[#1c1f4a] font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#b86a16]" />
                        {formatTime12h(slot.startTime)} -{" "}
                        {formatTime12h(slot.endTime)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-[#5a5e7a] font-medium max-w-[200px] truncate" title={slot.locations?.map(loc => `${loc.name} (${loc.type.toUpperCase()})`).join(", ")}>
                      {slot.locations && slot.locations.length > 0 ? (
                        slot.locations.map(loc => `${loc.name} (${loc.type.toUpperCase()})`).join(", ")
                      ) : (
                        <span className="italic text-gray-400">None selected</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                          slot.status === "booked"
                            ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                            : slot.status === "suspended"
                              ? "bg-[#c4796a]/15 text-[#c4796a]"
                              : "bg-[#b86a16]/10 text-[#b86a16]"
                        }`}
                      >
                        {slot.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {slot.status !== "booked" && (
                          <button
                            onClick={() => handleOpenEdit(slot)}
                            className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                            title="Edit timings slot"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {slot.status === "available" && (
                          <button
                            onClick={() => setSuspendConfirmSlot(slot)}
                            className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                            title="Suspend timings slot"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {slot.status === "suspended" && (
                          <button
                            onClick={() => handleToggleStatus(slot)}
                            className="p-1.5 hover:bg-[#6b8f71]/10 text-[#6b8f71] border border-transparent hover:border-[#6b8f71]/30 rounded-xl transition-all cursor-pointer"
                            title="Open timing slot again"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {slot.status !== "booked" ? (
                          <button
                            onClick={() => setDeleteSlot(slot)}
                            className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                            title="Delete timings slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-[#5a5e7a] font-semibold italic select-none pr-2">
                            Booked
                          </span>
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

      {/* Announce Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) setEditingSlot(null);
      }}>
        <DialogContent className="sm:max-w-[500px] [&>button]:text-white/80 hover:[&>button]:bg-white/10 hover:[&>button]:text-white [&>button]:z-50">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              {editingSlot ? "Edit Timings Slot" : "Announce Timings Slot"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAnnounceSubmit} className="space-y-4 pt-4">

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Offering Session
              </Label>
              <Select
                value={formData.subCategoryId}
                onValueChange={(val) =>
                  setFormData({ ...formData, subCategoryId: val })
                }
                disabled={formLoading}
              >
                <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                  <SelectValue placeholder="Select offering" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence Repeat Selector (New Announcement Only) */}
            {!editingSlot && (
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Repeat Pattern
                </Label>
                <Select
                  value={formData.repeatType}
                  onValueChange={(val: "once" | "daily" | "weekly") =>
                    setFormData({ ...formData, repeatType: val })
                  }
                  disabled={formLoading}
                >
                  <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Inputs based on Repeat Pattern */}
            {(editingSlot || formData.repeatType === "once") ? (
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                  Slot Date
                </Label>
                <DatePicker
                  value={formData.slotDate}
                  onChange={(d) => setFormData({ ...formData, slotDate: d })}
                  disabled={formLoading}
                  disabledDates={disableBeforeTomorrow}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                    Start Date
                  </Label>
                  <DatePicker
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    disabled={formLoading}
                    disabledDates={disableBeforeTomorrow}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                    End Date
                  </Label>
                  <DatePicker
                    value={formData.endDate}
                    onChange={(d) => setFormData({ ...formData, endDate: d })}
                    disabled={formLoading}
                    disabledDates={disableBeforeStartDate}
                  />
                </div>
              </div>
            )}

            {/* Weekday Selection for Weekly Recurrence */}
            {!editingSlot && formData.repeatType === "weekly" && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                  Days of the Week
                </Label>
                <div className="grid grid-cols-4 gap-2 p-3 bg-[#faf7f2]/30 border border-[#e8dcc4] rounded-xl">
                  {[
                    { label: "Sun", val: 0 },
                    { label: "Mon", val: 1 },
                    { label: "Tue", val: 2 },
                    { label: "Wed", val: 3 },
                    { label: "Thu", val: 4 },
                    { label: "Fri", val: 5 },
                    { label: "Sat", val: 6 },
                  ].map((day) => (
                    <label key={day.val} className="flex items-center gap-1.5 text-xs text-[#1c1f4a] font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.daysOfWeek.includes(day.val)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.daysOfWeek, day.val]
                            : formData.daysOfWeek.filter((d) => d !== day.val);
                          setFormData({ ...formData, daysOfWeek: updated });
                        }}
                        disabled={formLoading}
                        className="rounded border-[#e8dcc4] text-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
                      />
                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Timings List & Picker */}
            {editingSlot ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                    Start Time
                  </Label>
                  <Select
                    value={timingsList[0]?.startTime || "09:00"}
                    onValueChange={(val) => {
                      const updated = [...timingsList];
                      if (updated[0]) {
                        updated[0].startTime = val;
                        updated[0].endTime = calculateEndTime(val, updated[0].duration);
                      }
                      setTimingsList(updated);
                    }}
                    disabled={formLoading}
                  >
                    <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                    Duration
                  </Label>
                  <Select
                    value={String(timingsList[0]?.duration || 60)}
                    onValueChange={(val) => {
                      const updated = [...timingsList];
                      const dur = parseInt(val);
                      if (updated[0]) {
                        updated[0].duration = dur;
                        updated[0].endTime = calculateEndTime(updated[0].startTime, dur);
                      }
                      setTimingsList(updated);
                    }}
                    disabled={formLoading}
                  >
                    <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 mins</SelectItem>
                      <SelectItem value="30">30 mins</SelectItem>
                      <SelectItem value="45">45 mins</SelectItem>
                      <SelectItem value="60">1 hr</SelectItem>
                      <SelectItem value="75">1 hr 15 mins</SelectItem>
                      <SelectItem value="90">1 hr 30 mins</SelectItem>
                      <SelectItem value="105">1 hr 45 mins</SelectItem>
                      <SelectItem value="120">2 hrs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border-t border-b border-[#e8dcc4]/50 py-3">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                  Timings List
                </Label>

                {/* Render timings list */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {timingsList.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#faf7f2]/60 border border-[#e8dcc4]/60 p-2.5 rounded-xl text-xs font-medium text-[#1c1f4a]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#b86a16]" />
                        <span>
                          {formatTime12h(t.startTime)} - {formatTime12h(t.endTime)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          ({t.duration >= 60 ? `${Math.floor(t.duration / 60)}h ${t.duration % 60}m`.replace(" 0m", "") : `${t.duration} mins`})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTimingsList(timingsList.filter((_, i) => i !== idx));
                        }}
                        disabled={formLoading}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {timingsList.length === 0 && (
                    <p className="text-xs text-[#5a5e7a] italic">No timings slots announced yet.</p>
                  )}
                </div>

                {/* Add timings form inline */}
                <div className="flex gap-2 items-end pt-1">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Start Time
                    </Label>
                    <Select value={currStartTime} onValueChange={setCurrStartTime} disabled={formLoading}>
                      <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-9 rounded-xl text-xs text-[#1c1f4a]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {TIME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Duration
                    </Label>
                    <Select value={currDuration} onValueChange={setCurrDuration} disabled={formLoading}>
                      <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-9 rounded-xl text-xs text-[#1c1f4a]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 mins</SelectItem>
                        <SelectItem value="30">30 mins</SelectItem>
                        <SelectItem value="45">45 mins</SelectItem>
                        <SelectItem value="60">1 hr</SelectItem>
                        <SelectItem value="75">1 hr 15 mins</SelectItem>
                        <SelectItem value="90">1 hr 30 mins</SelectItem>
                        <SelectItem value="105">1 hr 45 mins</SelectItem>
                        <SelectItem value="120">2 hrs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      const durationMin = parseInt(currDuration);
                      const computedEndTime = calculateEndTime(currStartTime, durationMin);
                      
                      // Check for overlaps in the timingsList
                      const overlaps = timingsList.some((t) => {
                        return currStartTime < t.endTime && computedEndTime > t.startTime;
                      });

                      if (overlaps) {
                        toast.error("This timing slot overlaps with an already added timing in the list.");
                        return;
                      }

                      setTimingsList([
                        ...timingsList,
                        {
                          startTime: currStartTime,
                          endTime: computedEndTime,
                          duration: durationMin,
                        },
                      ]);
                    }}
                    disabled={formLoading}
                    className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl h-9 px-3.5 text-xs font-semibold"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Select Formats & Locations */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Select Formats &amp; Locations
              </Label>
              <div className="p-3 bg-[#faf7f2]/30 border border-[#e8dcc4] rounded-xl space-y-2.5 max-h-32 overflow-y-auto">
                {locationsList.map((loc) => (
                  <label
                    key={loc.id}
                    className="flex items-center gap-2 text-xs font-medium text-[#1c1f4a] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedLocIds.includes(loc.id)}
                      onChange={(e) =>
                        handleCheckboxChange(loc.id, e.target.checked)
                      }
                      disabled={formLoading}
                      className="rounded border-[#e8dcc4] text-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
                    />
                    <span>
                      {loc.name}{" "}
                      <span className="text-[10px] text-gray-400 font-bold uppercase">
                        ({loc.type})
                      </span>
                    </span>
                  </label>
                ))}
                {locationsList.length === 0 && (
                  <span className="text-xs text-[#5a5e7a] italic">
                    No active offline locations or online meetings configured in
                    directory.
                  </span>
                )}
              </div>
            </div>
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50 -mx-6 px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
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
                ) : editingSlot ? (
                  "Save Changes"
                ) : (
                  "Publish Slot"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate / Clash Result Dialog */}
      <Dialog open={!!conflictResult} onOpenChange={(open) => !open && setConflictResult(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl [&>button]:text-white/80 hover:[&>button]:bg-white/10 hover:[&>button]:text-white [&>button]:z-50">
          <DialogHeader className="bg-[#b86a16] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Timing Slots Conflicted
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4 font-sans">
            <div className="p-3.5 bg-[#faf7f2] border border-[#e8dcc4] rounded-2xl">
              <p className="text-xs text-[#1c1f4a] font-medium leading-relaxed">
                Successfully announced <span className="font-extrabold text-[#b86a16]">{conflictResult?.createdCount}</span> slot(s).
                Skipped <span className="font-extrabold text-[#c4796a]">{conflictResult?.skippedCount}</span> slot(s) because they overlap with existing sessions.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Skipped Overlapping Slots
              </Label>
              <div className="max-h-60 overflow-y-auto border border-[#e8dcc4]/60 rounded-2xl divide-y divide-[#e8dcc4]/30 bg-white shadow-sm">
                {conflictResult?.duplicates.map((dup, idx) => (
                  <div key={idx} className="p-3 text-xs flex justify-between items-center gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-[#1c1f4a]">
                        {formatDate(dup.date)}
                      </div>
                      <div className="text-[11px] text-[#5a5e7a] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#b86a16]" />
                        {formatTime12h(dup.startTime)} - {formatTime12h(dup.endTime)}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#b86a16]/10 text-[#b86a16] shrink-0">
                      {dup.subCategoryName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#e8dcc4]/50 -mx-6 px-6">
              <Button
                onClick={() => setConflictResult(null)}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold px-5"
              >
                Acknowledge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Slot AlertDialog */}
      <AlertDialog open={!!deleteSlot} onOpenChange={(open) => !open && setDeleteSlot(null)}>
        <AlertDialogContent className="rounded-3xl border border-[#e8dcc4] bg-white max-w-md p-6 font-sans shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-base font-bold text-[#1c1f4a]">Cancel Timings Slot</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
                Are you sure you want to permanently delete this announced session timing slot? Users will no longer be able to select or book this session.
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="flex sm:flex-row gap-2 mt-6 justify-center w-full">
            <AlertDialogCancel className="flex-1 border border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50 py-2 h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl py-2 h-9">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DEPENDENCY BLOCKED DIALOG */}
      {blockedDeleteReason && (
        <AlertDialog open={!!blockedDeleteReason} onOpenChange={(open) => !open && setBlockedDeleteReason(null)}>
          <AlertDialogContent className="rounded-3xl border border-[#e8dcc4] bg-white max-w-sm p-6 font-sans shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-base font-bold text-[#1c1f4a]">
                  Deletion Blocked
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
                  {blockedDeleteReason}
                </AlertDialogDescription>
              </div>
            </div>
            <AlertDialogFooter className="mt-6 flex justify-center w-full">
              <AlertDialogCancel className="w-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white border-0 text-xs font-semibold rounded-xl py-2 h-9">
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* SUSPEND CONFIRMATION DIALOG */}
      {suspendConfirmSlot && (
        <AlertDialog open={!!suspendConfirmSlot} onOpenChange={(open) => !open && setSuspendConfirmSlot(null)}>
          <AlertDialogContent className="rounded-3xl border border-[#e8dcc4] bg-white max-w-md p-6 font-sans shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <Pause className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-base font-bold text-[#1c1f4a]">
                  Suspend Timings Slot
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
                  Are you sure you want to suspend this session timing slot? Users will not be able to book this slot while it is suspended.
                </AlertDialogDescription>
              </div>
            </div>
            <AlertDialogFooter className="flex sm:flex-row gap-2 mt-6 justify-center w-full">
              <AlertDialogCancel className="flex-1 border border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50 py-2 h-9">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (suspendConfirmSlot) {
                    handleToggleStatus(suspendConfirmSlot);
                    setSuspendConfirmSlot(null);
                  }
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl py-2 h-9"
              >
                Suspend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default function SlotsDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
        </div>
      }
    >
      <SlotsDashboardContent />
    </Suspense>
  );
}
