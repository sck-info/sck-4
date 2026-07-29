"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type LocationRow = {
  id: string;
  name: string;
  type: "online" | "offline";
  url: string;
  createdAt: string | null;
};

function LocationsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // main pagination params (locations)
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

  // Core Data states
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);

  const [locPagination, setLocPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Modal Dialogs Control
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationRow | null>(null);
  const [locFormData, setLocFormData] = useState({ name: "", type: "online", url: "" });
  const [locFormLoading, setLocFormLoading] = useState(false);

  // Deletion States
  const [deleteLocId, setDeleteLocId] = useState<string | null>(null);

  // Fetch functions
  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(`/api/locations?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load locations");
      const result = await res.json();
      setLocations(result.data);
      setLocPagination(result.pagination);
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading clinical/virtual locations");
    } finally {
      setLoadingLoc(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Real-time listener
  useRealtime(["session_locations"], fetchLocations);

  // Loc actions
  const handleOpenAddLoc = () => {
    setEditingLoc(null);
    setLocFormData({ name: "", type: "online", url: "" });
    setLocModalOpen(true);
  };

  const handleOpenEditLoc = (loc: LocationRow) => {
    setEditingLoc(loc);
    setLocFormData({ name: loc.name, type: loc.type, url: loc.url });
    setLocModalOpen(true);
  };

  const handleLocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocFormLoading(true);
    try {
      const url = editingLoc ? `/api/locations/${editingLoc.id}` : "/api/locations";
      const method = editingLoc ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locFormData),
      });

      if (!res.ok) throw new Error("Failed to save location details");
      toast.success(editingLoc ? "Location updated successfully" : "Location created successfully");
      setLocModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLocFormLoading(false);
    }
  };

  const handleConfirmDeleteLoc = async () => {
    if (!deleteLocId) return;
    try {
      const res = await fetch(`/api/locations/${deleteLocId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete location");
      toast.success("Location deleted successfully");
      fetchLocations();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setDeleteLocId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Session Locations</h1>
          <p className="text-xs text-[#5a5e7a] mt-1">Configure physical clinics, online Zoom meeting integrations, and custom slots formats.</p>
        </div>
        <Button onClick={handleOpenAddLoc} className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-5 text-xs font-semibold shrink-0">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Location
        </Button>
      </div>

      {loadingLoc ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading session locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-16 rounded-[2rem] text-center">
          <MapPin className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No locations configured</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Click Add Location above to register offline diagnostic clinics or dynamic digital rooms.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={locPagination} variant="top" />
          <div className="p-1 bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Name</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Type</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">URL / Map Pin</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc.id} className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors">
                    <TableCell className="py-3 px-4 text-xs font-semibold text-[#1c1f4a]">{loc.name}</TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                        loc.type === "online" ? "bg-[#b86a16]/10 text-[#b86a16]" : "bg-[#6b8f71]/15 text-[#6b8f71]"
                      }`}>
                        {loc.type}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs max-w-[300px] truncate text-[#5a5e7a] font-mono">
                      <a href={loc.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#b86a16] underline display-block">
                        {loc.url}
                      </a>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => handleOpenEditLoc(loc)} className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] rounded-xl border border-transparent hover:border-[#b86a16]/30 transition-all cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteLocId(loc.id)} className="p-2 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-xl border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePaginationFooter pagination={locPagination} variant="bottom" />
          </div>
        </div>
      )}

      {/* DIALOG: Add/Edit Location */}
      <Dialog open={locModalOpen} onOpenChange={setLocModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">
              {editingLoc ? "Edit Mapped Location" : "Add Session Location"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLocSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Label / Name</Label>
              <Input
                value={locFormData.name}
                onChange={(e) => setLocFormData({ ...locFormData, name: e.target.value })}
                placeholder="e.g. Clinic Hyderabad or Google Meet Virtual Room"
                required
                disabled={locFormLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Format Mode</Label>
              <Select
                value={locFormData.type}
                onValueChange={(val) => setLocFormData({ ...locFormData, type: val as "online" | "offline" })}
                disabled={locFormLoading}
              >
                <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online / Virtual Meeting</SelectItem>
                  <SelectItem value="offline">Offline / Physical Clinic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Access Link / Physical Address URL</Label>
              <Input
                value={locFormData.url}
                onChange={(e) => setLocFormData({ ...locFormData, url: e.target.value })}
                placeholder="e.g. https://zoom.us/... or Google Map location pin"
                required
                disabled={locFormLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocModalOpen(false)} disabled={locFormLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={locFormLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                {locFormLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Details
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: Delete Location */}
      <AlertDialog open={deleteLocId !== null} onOpenChange={(open) => !open && setDeleteLocId(null)}>
        <AlertDialogContent className="w-[300px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">Delete Location</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure? This will remove this location mapping and delete clinical references from announced slots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteLoc} className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LocationsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading session locations announcer...</p>
        </div>
      }
    >
      <LocationsDashboardContent />
    </Suspense>
  );
}
