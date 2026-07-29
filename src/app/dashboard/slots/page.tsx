"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
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
  slotDate: string;
  startTime: string;
  endTime: string;
  status: "available" | "booked";
  subCategoryName: string;
  locations: { id: string; name: string; type: string }[];
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

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
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

  // URL pagination params
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
      params.set("limit", String(DEFAULT_PAGE_LIMIT));
      changed = true;
    }
    if (changed) {
      pushParams(params, true);
    }
  }, [searchParams, pushParams]);

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
    slotDate: undefined as Date | undefined,
    startTime: "09:00",
    endTime: "10:00",
    selectedLocIds: [] as string[],
  });

  // Deletion slot states
  const [deleteSlot, setDeleteSlot] = useState<SlotRow | null>(null);

  // Fetch Slots
  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch(`/api/slots?page=${page}&limit=${limit}`);
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
  }, [page, limit]);

  // Fetch helper lists (locations, offerings)
  const fetchHelpers = async () => {
    try {
      // Get sub-categories
      const subRes = await fetch("/api/sub-categories?page=1&limit=200");
      if (subRes.ok) {
        const json = await subRes.json();
        const filtered = json.data.filter((s: SubCategoryRow) => s.requiresBooking);
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

  // Real-time subscriptions
  useRealtime(["offering_slots"], fetchSlots);

  // Modal open reset
  const handleOpenAnnounce = () => {
    setFormError("");
    setFormData({
      subCategoryId: subCategories[0]?.id || "",
      slotDate: undefined,
      startTime: "09:00",
      endTime: "10:00",
      selectedLocIds: [],
    });
    setModalOpen(true);
  };

  // Submit slot announcement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.subCategoryId) {
      setFormError("Please select a sub-category offering.");
      return;
    }
    if (!formData.slotDate) {
      setFormError("Please select a date for the slot.");
      return;
    }
    if (formData.selectedLocIds.length === 0) {
      setFormError("Please select at least one format location.");
      return;
    }

    setFormLoading(true);

    const formattedDate = `${formData.slotDate.getFullYear()}-${String(formData.slotDate.getMonth() + 1).padStart(2, "0")}-${String(formData.slotDate.getDate()).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subCategoryId: formData.subCategoryId,
          slotDate: formattedDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          locationIds: formData.selectedLocIds,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "An overlap conflict occurred.");
      }

      toast.success("Timings slot announced successfully!");
      setModalOpen(false);
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
      const res = await fetch(`/api/slots/${deleteSlot.id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to delete slot.");
      }

      toast.success("Timings slot deleted successfully.");
      fetchSlots();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete slot.");
    } finally {
      setDeleteSlot(null);
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

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Slots Announcer Console</h1>
          <p className="text-xs text-[#5a5e7a] mt-1">Announce available session times and prevent timing conflicts in real-time.</p>
        </div>
        <Button onClick={handleOpenAnnounce} className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-5 text-xs font-semibold shrink-0">
          <Plus className="w-3.5 h-3.5 mr-1" /> Announce Timings
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading slots queue...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <Calendar className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No slots announced</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Timing slots will appear here once announced. Click Announce Timings above to initialize date ranges.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="p-1 bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Offering sub-category</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Date</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Timing block</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Format options</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Booking Status</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow
                    key={slot.id}
                    className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                      slot.status === "booked" ? "opacity-75 bg-[#f6faf8]/40" : ""
                    }`}
                  >
                    <TableCell className="py-3 px-4 text-xs font-bold text-[#1c1f4a]">{slot.subCategoryName}</TableCell>
                    <TableCell className="py-3 px-4 text-xs text-[#5a5e7a] font-mono">{slot.slotDate}</TableCell>
                    <TableCell className="py-3 px-4 text-xs font-medium text-[#1c1f4a] flex items-center gap-1.5 pt-4">
                      <Clock className="w-3.5 h-3.5 text-[#b86a16]" /> {slot.startTime} - {slot.endTime}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {slot.locations.map((loc) => (
                          <span
                            key={loc.id}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              loc.type === "online" ? "bg-[#b86a16]/5 border-[#b86a16]/25 text-[#b86a16]" : "bg-[#6b8f71]/5 border-[#6b8f71]/25 text-[#6b8f71]"
                            }`}
                          >
                            {loc.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                          slot.status === "booked" ? "bg-[#6b8f71]/15 text-[#6b8f71]" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {slot.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteSlot(slot)}
                        className="p-2 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                        title="Remove Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePaginationFooter pagination={pagination} variant="bottom" />
          </div>
        </div>
      )}

      {/* DIALOG: Announce Timings Form */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px] overflow-visible">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">Announce Slot Timings</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Select Offering Sub-Category</Label>
              <Select
                value={formData.subCategoryId}
                onValueChange={(val) => setFormData({ ...formData, subCategoryId: val })}
                disabled={formLoading}
              >
                <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                  <SelectValue placeholder="Select offering..." />
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

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">Slot Date</Label>
              <DatePicker
                value={formData.slotDate}
                onChange={(d) => setFormData({ ...formData, slotDate: d })}
                disabled={formLoading}
                disabledDates={(d: Date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today;
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Start Time</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(val) => setFormData({ ...formData, startTime: val })}
                  disabled={formLoading}
                >
                  <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                    <SelectValue placeholder="Select start..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`start-${time.value}`} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">End Time</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(val) => setFormData({ ...formData, endTime: val })}
                  disabled={formLoading}
                >
                  <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                    <SelectValue placeholder="Select end..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`end-${time.value}`} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location Mappings Checklist */}
            <div className="space-y-2 border-t border-[#e8dcc4]/60 pt-3">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">Select Location Formats</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {locationsList.map((loc) => {
                  const isChecked = formData.selectedLocIds.includes(loc.id);
                  return (
                    <label
                      key={loc.id}
                      className="flex items-center gap-2 px-3 py-2 border border-[#e8dcc4]/60 hover:bg-[#faf7f2]/30 rounded-xl cursor-pointer text-xs font-semibold text-[#1c1f4a]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(loc.id, e.target.checked)}
                        disabled={formLoading}
                        className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16] cursor-pointer"
                      />
                      <span className="truncate">{loc.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={formLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Announce Slot
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: Remove Slot */}
      <AlertDialog open={deleteSlot !== null} onOpenChange={(open) => !open && setDeleteSlot(null)}>
        <AlertDialogContent className="w-[320px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">Remove Annouced Slot</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              {deleteSlot?.status === "booked"
                ? `WARNING: This slot is already BOOKED by a user. Removing it will trigger an validation error or orphan the booking. Are you sure?`
                : `Are you sure you want to remove this timing slot?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SlotsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading slots announcer...</p>
        </div>
      }
    >
      <SlotsDashboardContent />
    </Suspense>
  );
}
