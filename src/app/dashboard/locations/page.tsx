"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  MapPin,
  Link,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Upload,
  QrCode,
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
import Image from "next/image";

type LocationRow = {
  id: string;
  name: string;
  type: "online" | "offline";
  url: string;
  createdAt: string | null;
};

type QRRow = {
  id: string;
  name: string;
  qrImageUrl: string;
  createdAt: string | null;
};

function LocationsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // main pagination params (locations)
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";

  // QR pagination params
  const qrPage = searchParams.get("qrPage") || "1";
  const qrLimit = searchParams.get("qrLimit") || "25";

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
    if (!params.has("qrPage")) {
      params.set("qrPage", "1");
      changed = true;
    }
    if (!params.has("qrLimit")) {
      params.set("qrLimit", String(DEFAULT_PAGE_LIMIT));
      changed = true;
    }
    if (changed) {
      pushParams(params, true);
    }
  }, [searchParams, pushParams]);

  // Core Data states
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [qrs, setQrs] = useState<QRRow[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [loadingQR, setLoadingQR] = useState(true);

  const [locPagination, setLocPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [qrPagination, setQrPagination] = useState<PaginationMeta>({
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

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<QRRow | null>(null);
  const [qrFormData, setQrFormData] = useState({ name: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [qrFormLoading, setQrFormLoading] = useState(false);

  // Deletion States
  const [deleteLocId, setDeleteLocId] = useState<string | null>(null);
  const [deleteQrId, setDeleteQrId] = useState<string | null>(null);

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

  const fetchQRs = useCallback(async () => {
    try {
      const res = await fetch(`/api/qrs?page=${qrPage}&limit=${qrLimit}`);
      if (!res.ok) throw new Error("Failed to load QRs");
      const result = await res.json();
      setQrs(result.data);
      setQrPagination(result.pagination);
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading payment QR assets");
    } finally {
      setLoadingQR(false);
    }
  }, [qrPage, qrLimit]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchQRs();
  }, [fetchQRs]);

  // Real-time listener
  useRealtime(["session_locations"], fetchLocations);
  useRealtime(["payment_qrs"], fetchQRs);

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

  // QR actions
  const handleOpenAddQr = () => {
    setEditingQr(null);
    setQrFormData({ name: "" });
    setSelectedFile(null);
    setQrModalOpen(true);
  };

  const handleOpenEditQr = (qr: QRRow) => {
    setEditingQr(qr);
    setQrFormData({ name: qr.name });
    setSelectedFile(null);
    setQrModalOpen(true);
  };

  const handleQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQrFormLoading(true);

    if (!editingQr && !selectedFile) {
      toast.error("Please select a QR code image file to upload");
      setQrFormLoading(false);
      return;
    }

    try {
      const url = editingQr ? `/api/qrs/${editingQr.id}` : "/api/qrs";
      const method = editingQr ? "PATCH" : "POST";

      const bodyData = new FormData();
      bodyData.append("name", qrFormData.name);
      if (selectedFile) {
        bodyData.append("file", selectedFile);
      }

      const res = await fetch(url, {
        method,
        body: bodyData,
      });

      if (!res.ok) throw new Error("Failed to save QR details");
      toast.success(editingQr ? "QR Code updated successfully" : "QR Code registered successfully");
      setQrModalOpen(false);
      fetchQRs();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setQrFormLoading(false);
    }
  };

  const handleConfirmDeleteQr = async () => {
    if (!deleteQrId) return;
    try {
      const res = await fetch(`/api/qrs/${deleteQrId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete QR");
      toast.success("QR Code removed successfully");
      fetchQRs();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setDeleteQrId(null);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Locations &amp; Payment QR Codes</h1>
        <p className="text-xs text-[#5a5e7a] mt-1">Manage clinical locations, Zoom links, and Cloudinary payment QRs.</p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Locations Manager */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e8dcc4] pb-4">
            <h2 className="text-md font-bold text-[#1c1f4a] font-display flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#b86a16]" /> Mapped Locations
            </h2>
            <Button onClick={handleOpenAddLoc} className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-8 px-4 text-xs font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Location
            </Button>
          </div>

          {loadingLoc ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mb-2" />
              <p className="text-[11px] text-[#5a5e7a]">Loading session locations...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-8 rounded-2xl text-center">
              <p className="text-xs text-[#5a5e7a]">No locations configured. Click Add Location above to announce clinical spots or virtual rooms.</p>
            </div>
          ) : (
            <div className="p-1">
              <Table>
                <TableHeader className="bg-[#1c1f4a]/5">
                  <TableRow className="border-b border-[#e8dcc4]">
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Name</TableHead>
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Type</TableHead>
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">URL/Map Pin</TableHead>
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id} className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors">
                      <TableCell className="py-2.5 px-3 text-xs font-semibold text-[#1c1f4a]">{loc.name}</TableCell>
                      <TableCell className="py-2.5 px-3 text-xs">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                          loc.type === "online" ? "bg-[#b86a16]/10 text-[#b86a16]" : "bg-[#6b8f71]/15 text-[#6b8f71]"
                        }`}>
                          {loc.type}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs max-w-[200px] truncate text-[#5a5e7a] font-mono">
                        <a href={loc.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#b86a16] underline display-block">
                          {loc.url}
                        </a>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <button onClick={() => handleOpenEditLoc(loc)} className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] rounded-lg border border-transparent hover:border-[#b86a16]/30 transition-all cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteLocId(loc.id)} className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-lg border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePaginationFooter pagination={locPagination} variant="bottom" />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Payment QRs Manager */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e8dcc4] pb-4">
            <h2 className="text-md font-bold text-[#1c1f4a] font-display flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#b86a16]" /> Payment QRs
            </h2>
            <Button onClick={handleOpenAddQr} className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-8 px-4 text-xs font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add QR
            </Button>
          </div>

          {loadingQR ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mb-2" />
              <p className="text-[11px] text-[#5a5e7a]">Loading QR codes...</p>
            </div>
          ) : qrs.length === 0 ? (
            <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-8 rounded-2xl text-center">
              <p className="text-xs text-[#5a5e7a]">No payment QRs configured. Upload scanning layouts for offerings checkout forms.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qrs.map((qr) => (
                <div key={qr.id} className="bg-white border border-[#e8dcc4]/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 border border-[#e8dcc4] rounded-lg overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                      <img src={qr.qrImageUrl} alt={qr.name} className="object-contain max-h-full max-w-full" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1c1f4a]">{qr.name}</h4>
                      <p className="text-[10px] text-[#5a5e7a] font-mono mt-0.5 truncate max-w-[150px]">
                        Cloudinary Secure Image
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex gap-1.5">
                    <button onClick={() => handleOpenEditQr(qr)} className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] rounded-lg border border-transparent hover:border-[#b86a16]/30 transition-all cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteQrId(qr.id)} className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-lg border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Table pagination for QRs */}
              {qrPagination.total > qrPagination.limit && (
                <div className="pt-2">
                  <TablePaginationFooter pagination={qrPagination} variant="bottom" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                placeholder="e.g. Google Meet Room A, Clinic Room B"
                required
                disabled={locFormLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Format Type</Label>
              <Select
                value={locFormData.type}
                onValueChange={(val) => setLocFormData({ ...locFormData, type: val })}
                disabled={locFormLoading}
              >
                <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Google Meet, Zoom)</SelectItem>
                  <SelectItem value="offline">Offline (Clinical Room, Address)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">URL Link / Google Map Pin</Label>
              <Input
                value={locFormData.url}
                onChange={(e) => setLocFormData({ ...locFormData, url: e.target.value })}
                placeholder={locFormData.type === "online" ? "https://meet.google.com/..." : "https://maps.app.goo.gl/..."}
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

      {/* DIALOG: Add/Edit Payment QR */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">
              {editingQr ? "Edit QR Details" : "Register Payment QR"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQrSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Label / Name</Label>
              <Input
                value={qrFormData.name}
                onChange={(e) => setQrFormData({ ...qrFormData, name: e.target.value })}
                placeholder="e.g. SCK UPI Primary Account"
                required
                disabled={qrFormLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">Scan QR Code Image</Label>
              <div className="relative border border-dashed border-[#e8dcc4] hover:border-[#b86a16]/60 bg-[#faf7f2]/40 rounded-2xl p-4 flex flex-col items-center justify-center transition-all min-h-[90px] cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={qrFormLoading}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) setSelectedFile(files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className="w-5 h-5 text-[#9396ae] mb-1.5" />
                <span className="text-[11px] font-bold text-[#1c1f4a] text-center max-w-[280px] truncate block">
                  {selectedFile ? selectedFile.name : editingQr ? "Select to replace QR code layout image (optional)" : "Click to select local QR image file"}
                </span>
                <span className="text-[9px] text-[#5a5e7a] mt-0.5">JPEG, PNG, WEBP. Max size: 5MB</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setQrModalOpen(false)} disabled={qrFormLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={qrFormLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                {qrFormLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Details
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

      {/* ALERT DIALOG: Delete QR */}
      <AlertDialog open={deleteQrId !== null} onOpenChange={(open) => !open && setDeleteQrId(null)}>
        <AlertDialogContent className="w-[300px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">Remove QR Code</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure? Sub-categories linked to this QR code will display direct checkout submissions only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteQr} className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
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
          <p className="text-xs text-[#5a5e7a] font-medium">Loading locations console...</p>
        </div>
      }
    >
      <LocationsDashboardContent />
    </Suspense>
  );
}
