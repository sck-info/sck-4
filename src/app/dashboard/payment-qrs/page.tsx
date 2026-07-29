"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Upload,
  QrCode,
} from "lucide-react";
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
import { toast } from "sonner";

type QRRow = {
  id: string;
  name: string;
  qrImageUrl: string;
  createdAt: string | null;
};

function PaymentQRsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // QR pagination params
  const qrPage = searchParams.get("page") || "1";
  const qrLimit = searchParams.get("limit") || "25";

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
  const [qrs, setQrs] = useState<QRRow[]>([]);
  const [loadingQR, setLoadingQR] = useState(true);

  const [qrPagination, setQrPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Modal Dialogs Control
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<QRRow | null>(null);
  const [qrFormData, setQrFormData] = useState({ name: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [qrFormLoading, setQrFormLoading] = useState(false);

  // Deletion States
  const [deleteQrId, setDeleteQrId] = useState<string | null>(null);

  // Setup preview URL helper
  useEffect(() => {
    if (!selectedFile) {
      setFilePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setFilePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  // Fetch functions
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
    fetchQRs();
  }, [fetchQRs]);

  // Real-time listener
  useRealtime(["payment_qrs"], fetchQRs);

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
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Payment QR Codes</h1>
          <p className="text-xs text-[#5a5e7a] mt-1">Manage scan-and-pay layouts displayed during seeker checkouts.</p>
        </div>
        <Button onClick={handleOpenAddQr} className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-5 text-xs font-semibold shrink-0">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Payment QR
        </Button>
      </div>

      {loadingQR ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading QR codes...</p>
        </div>
      ) : qrs.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-16 rounded-[2rem] text-center">
          <QrCode className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No payment QRs configured</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Upload scanning layouts for sub-categories checkout checkout forms.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={qrPagination} variant="top" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrs.map((qr) => (
            <div key={qr.id} className="bg-white border border-[#e8dcc4]/60 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
              <div className="relative aspect-square w-full border border-[#e8dcc4]/60 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                <img src={qr.qrImageUrl} alt={qr.name} className="object-contain max-h-full max-w-full" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-[#1c1f4a] truncate">{qr.name}</h4>
                  <p className="text-[10px] text-[#5a5e7a] font-mono mt-0.5 truncate">
                    Cloudinary Storage Asset
                  </p>
                </div>
                <div className="inline-flex gap-1 shrink-0">
                  <button onClick={() => handleOpenEditQr(qr)} className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] rounded-xl border border-transparent hover:border-[#b86a16]/30 transition-all cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteQrId(qr.id)} className="p-2 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-xl border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

      {/* Table pagination for QRs */}
      {qrPagination.totalPages > 1 && (
        <div className="pt-4 border-t border-[#e8dcc4]/40">
          <TablePaginationFooter pagination={qrPagination} variant="bottom" />
        </div>
      )}

      {/* DIALOG: Add/Edit QR */}
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

            {/* NEW IMAGE PREVIEW CONTAINER */}
            {(filePreview || (editingQr && editingQr.qrImageUrl)) && (
              <div className="space-y-2 flex flex-col items-center border border-[#e8dcc4]/40 bg-[#faf7f2]/20 p-3 rounded-2xl">
                <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wide">Selected Image Preview</Label>
                <div className="relative w-36 h-36 border border-[#e8dcc4]/60 rounded-2xl overflow-hidden bg-white flex items-center justify-center p-2 shadow-xs">
                  <img
                    src={filePreview || editingQr?.qrImageUrl}
                    alt="Payment QR Preview"
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </div>
            )}

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

export default function PaymentQRsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading payment QR announcer...</p>
        </div>
      }
    >
      <PaymentQRsDashboardContent />
    </Suspense>
  );
}
