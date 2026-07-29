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

  // main pagination & filter params
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const typeFilter = searchParams.get("type") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localType, setLocalType] = useState(typeFilter);

  const pushParams = useCallback(
    (params: URLSearchParams, replace = false) => {
      const url = `${pathname}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router],
  );

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

  // Sync local states with URL parameters
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalType(typeFilter);
  }, [searchQuery, typeFilter]);

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
  const [locFormData, setLocFormData] = useState({
    name: "",
    type: "online",
    url: "",
  });
  const [locFormLoading, setLocFormLoading] = useState(false);

  // Deletion States
  const [deleteLocId, setDeleteLocId] = useState<string | null>(null);

  // Fetch functions
  const fetchLocations = useCallback(async () => {
    try {
      const searchPart = searchQuery
        ? `&search=${encodeURIComponent(searchQuery)}`
        : "";
      const typePart = typeFilter !== "all" ? `&type=${typeFilter}` : "";

      const res = await fetch(
        `/api/locations?page=${page}&limit=${limit}${searchPart}${typePart}`,
      );
      if (!res.ok) throw new Error("Failed to load locations");
      const result = await res.json();
      setLocations(result.data);
      setLocPagination(result.pagination);
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading locations/virtual locations");
    } finally {
      setLoadingLoc(false);
    }
  }, [page, limit, searchQuery, typeFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Real-time listener
  useRealtime(["session_locations"], fetchLocations);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", localSearch.trim());
    params.set("type", localType);
    params.set("page", "1");
    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalType("all");

    const params = new URLSearchParams(searchParams.toString());
    params.set("search", "");
    params.set("type", "all");
    params.set("page", "1");
    pushParams(params);
  };

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
    if (!locFormData.name.trim() || !locFormData.url.trim()) {
      toast.error("All details must be filled");
      return;
    }

    setLocFormLoading(true);
    const method = editingLoc ? "PATCH" : "POST";
    const path = editingLoc
      ? `/api/locations/${editingLoc.id}`
      : "/api/locations";

    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locFormData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to commit location update.");
      }

      toast.success(
        editingLoc
          ? "Location updated successfully"
          : "Location created successfully",
      );
      setLocModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      toast.error(err.message || "Failed to save details");
    } finally {
      setLocFormLoading(false);
    }
  };

  const handleConfirmDeleteLoc = async () => {
    if (!deleteLocId) return;
    try {
      const res = await fetch(`/api/locations/${deleteLocId}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete location.");
      }

      toast.success("Location dropped from directory");
      fetchLocations();
    } catch (err: any) {
      toast.error(err.message || "Could not delete location");
    } finally {
      setDeleteLocId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Session Locations
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Configure physical locations, online Zoom meeting integrations, and
            custom slots formats.
          </p>
        </div>
        <Button
          onClick={handleOpenAddLoc}
          className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-5 text-xs font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Location
        </Button>
      </div>

      {/* Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Search Locations
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Format Type
          </Label>
          <Select value={localType} onValueChange={setLocalType}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Format Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Format Types</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="online">Online</SelectItem>
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

      {loadingLoc ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading session locations...
          </p>
        </div>
      ) : locations.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-16 rounded-[2rem] text-center">
          <MapPin className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No locations found
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search query or format type filters to find
            locations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={locPagination} variant="top" />
          <div className="p-1 bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Name
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Type
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    URL / Map Pin
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow
                    key={loc.id}
                    className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors"
                  >
                    <TableCell className="py-3 px-4 text-xs font-semibold text-[#1c1f4a]">
                      {loc.name}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                          loc.type === "online"
                            ? "bg-[#b86a16]/10 text-[#b86a16]"
                            : "bg-[#6b8f71]/15 text-[#6b8f71]"
                        }`}
                      >
                        {loc.type}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs max-w-[300px] truncate text-[#5a5e7a] font-mono">
                      <a
                        href={loc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#b86a16] underline display-block"
                      >
                        {loc.url}
                      </a>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => handleOpenEditLoc(loc)}
                          className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteLocId(loc.id)}
                          className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePaginationFooter pagination={locPagination} variant="bottom" />
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={locModalOpen} onOpenChange={setLocModalOpen}>
        <DialogContent className="sm:max-w-[450px] border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-white text-sm font-bold">
              {editingLoc ? "Edit Session Location" : "Add Session Location"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLocSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Location Name
              </Label>
              <Input
                value={locFormData.name}
                onChange={(e) =>
                  setLocFormData({ ...locFormData, name: e.target.value })
                }
                placeholder="e.g. Hyderabad Hitech City / Skype Virtual Room"
                className="bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs"
                disabled={locFormLoading}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Format Type
              </Label>
              <Select
                value={locFormData.type}
                onValueChange={(val) =>
                  setLocFormData({
                    ...locFormData,
                    type: val as "online" | "offline",
                  })
                }
                disabled={locFormLoading}
              >
                <SelectTrigger className="w-full bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                URL / Maps Location link
              </Label>
              <Input
                value={locFormData.url}
                onChange={(e) =>
                  setLocFormData({ ...locFormData, url: e.target.value })
                }
                placeholder="e.g. Google Maps Pin Link or Zoom/Google Meet Link"
                className="bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs"
                disabled={locFormLoading}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocModalOpen(false)}
                disabled={locFormLoading}
                className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={locFormLoading}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold"
              >
                {locFormLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Location"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteLocId}
        onOpenChange={(open) => !open && setDeleteLocId(null)}
      >
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">
              Delete Location Pin
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to permanently delete this location
              representation? Existing session slots bound to this location may
              fail to render location URLs properly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLoc}
              className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white text-xs font-semibold rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LocationsDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
        </div>
      }
    >
      <LocationsDashboardContent />
    </Suspense>
  );
}
