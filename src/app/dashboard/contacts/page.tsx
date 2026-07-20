"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Mail,
  Phone,
  MapPin,
  Contact,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
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
import { toast } from "sonner";

type ContactRow = {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  instagramLink: string | null;
  linkedinLink: string | null;
  youtubeLink: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function ContactsCrudPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  }, [pathname, router, searchParams, pushParams]);

  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const isInitialLoadRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    location: "",
    instagramLink: "",
    linkedinLink: "",
    youtubeLink: "",
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      setError("");
      if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const res = await fetch(`/api/contacts?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load contacts");
      const result = await res.json();
      setContacts(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching contacts.");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Realtime hook to automatically update on db mutations
  useRealtime(["contacts"], () => {
    console.log(
      "[Realtime Trigger] Contacts updated in DB, refetching list...",
    );
    fetchContacts();
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      email: "",
      phone: "",
      location: "",
      instagramLink: "",
      linkedinLink: "",
      youtubeLink: "",
      isActive: contacts.length === 0, // auto active if first record
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (contact: ContactRow) => {
    setEditingId(contact.id);
    setFormData({
      email: contact.email || "",
      phone: contact.phone || "",
      location: contact.location || "",
      instagramLink: contact.instagramLink || "",
      linkedinLink: contact.linkedinLink || "",
      youtubeLink: contact.youtubeLink || "",
      isActive: contact.isActive,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleTriggerDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/contacts/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete contact");
      }
      setContacts((prev) => prev.filter((c) => c.id !== deletingId));
      toast.success("Contact details deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact.");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (contact: ContactRow) => {
    if (contact.isActive) return; // already active

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email || "",
          phone: contact.phone || "",
          location: contact.location || "",
          instagramLink: contact.instagramLink || "",
          linkedinLink: contact.linkedinLink || "",
          youtubeLink: contact.youtubeLink || "",
          isActive: true,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to activate contact set");
      }
      toast.success("Contact details activated successfully!");
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Failed to activate contact set.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    // Validate social URLs if provided using a robust URL helper
    const isValidUrl = (url: string) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    };

    if (formData.instagramLink && !isValidUrl(formData.instagramLink)) {
      setFormError(
        "Instagram Link must be a valid URL (e.g. https://instagram.com/user).",
      );
      setFormLoading(false);
      return;
    }
    if (formData.linkedinLink && !isValidUrl(formData.linkedinLink)) {
      setFormError(
        "LinkedIn Link must be a valid URL (e.g. https://linkedin.com/in/user).",
      );
      setFormLoading(false);
      return;
    }
    if (formData.youtubeLink && !isValidUrl(formData.youtubeLink)) {
      setFormError(
        "YouTube Link must be a valid URL (e.g. https://youtube.com/@channel).",
      );
      setFormLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/contacts/${editingId}` : "/api/contacts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save contact set");
      }

      toast.success(
        editingId
          ? "Contact details updated successfully!"
          : "Contact details created successfully!",
      );
      setModalOpen(false);
      fetchContacts();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to save contact details.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1c1f4a] font-display">
            Manage Contacts
          </h1>
          <p className="text-sm text-[#5a5e7a] mt-1">
            Display live details (Email, Phone, Location, and Social Links) on
            the landing page.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Contact
        </button>
      </div>

      {/* Main content pane */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading contact details...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <Contact className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No contact details
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            You don't have any contact details saved. Create your first contact
            set to display it live.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-[#b86a16] hover:bg-[#b86a16]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            Create First Set
          </button>
        </div>
      ) : (
        <div className="p-1">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-4 px-6 font-bold text-[#1c1f4a]">
                  Status
                </TableHead>
                <TableHead className="py-4 px-6 font-bold text-[#1c1f4a]">
                  Email
                </TableHead>
                <TableHead className="py-4 px-6 font-bold text-[#1c1f4a]">
                  Phone
                </TableHead>
                <TableHead className="py-4 px-6 font-bold text-[#1c1f4a]">
                  Location
                </TableHead>
                <TableHead className="py-4 px-6 font-bold text-[#1c1f4a]">
                  Social Channels
                </TableHead>
                <TableHead className="py-4 px-6 font-bold text-[#1c1f4a] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                    contact.isActive ? "bg-[#eaf2eb]/30" : ""
                  }`}
                >
                  <TableCell className="py-4 px-6">
                    <button
                      onClick={() => handleToggleActive(contact)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                        contact.isActive
                          ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                          : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16]"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {contact.isActive ? "Active" : "Set Active"}
                    </button>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-[#1c1f4a] font-medium">
                    {contact.email ? (
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#9396ae] shrink-0" />
                        {contact.email}
                      </span>
                    ) : (
                      <span className="text-white/0 font-mono select-none">
                        --
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-[#5a5e7a]">
                    {contact.phone ? (
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#9396ae] shrink-0" />
                        {contact.phone}
                      </span>
                    ) : (
                      <span className="text-white/0 font-mono select-none">
                        --
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-[#5a5e7a]">
                    {contact.location ? (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#9396ae] shrink-0" />
                        {contact.location}
                      </span>
                    ) : (
                      <span className="text-white/0 font-mono select-none">
                        --
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex gap-2">
                      {contact.instagramLink && (
                        <a
                          href={contact.instagramLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[# rose-light] border border-[#rose-light]/40 hover:border-[#rose]/60 text-[#c4796a] hover:bg-[#c4796a]/10 rounded-lg transition-all"
                          title="Instagram"
                        >
                          <FaInstagram className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {contact.linkedinLink && (
                        <a
                          href={contact.linkedinLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#slate-light] border border-[#slate-light]/40 hover:border-[#slate]/60 text-[#4a6fa5] hover:bg-[#4a6fa5]/10 rounded-lg transition-all"
                          title="LinkedIn"
                        >
                          <FaLinkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {contact.youtubeLink && (
                        <a
                          href={contact.youtubeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#gold-light] border border-[#gold-light]/40 hover:border-[#gold]/60 text-[#b86a16] hover:bg-[#b86a16]/10 rounded-lg transition-all"
                          title="YouTube"
                        >
                          <FaYoutube className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {!contact.instagramLink &&
                        !contact.linkedinLink &&
                        !contact.youtubeLink && (
                          <span className="text-[#9396ae] text-xs font-mono">
                            None
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(contact)}
                        className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTriggerDelete(contact.id)}
                        className="p-2 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePaginationFooter pagination={pagination} variant="bottom" />
        </div>
      )}

      {/* CRUD Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              {editingId ? "Edit Contact Details" : "Create Contact Details"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sharath@gmail.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide"
                >
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="+91 8374896261"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location"
                className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide"
              >
                Location Description
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="Hyderabad, Telangana"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                disabled={formLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
              />
            </div>

            <div className="border-t border-[#e8dcc4]/60 pt-3 space-y-3">
              <p className="text-[10px] font-bold tracking-wider text-[#9396ae] uppercase">
                Social Media Channels (URLs)
              </p>

              <div className="space-y-1">
                <Label
                  htmlFor="instagramLink"
                  className="text-xs font-bold text-[#5a5e7a]"
                >
                  Instagram Link
                </Label>
                <Input
                  id="instagramLink"
                  type="text"
                  placeholder="https://www.instagram.com/profile"
                  value={formData.instagramLink}
                  onChange={(e) =>
                    setFormData({ ...formData, instagramLink: e.target.value })
                  }
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="linkedinLink"
                  className="text-xs font-bold text-[#5a5e7a]"
                >
                  LinkedIn Link
                </Label>
                <Input
                  id="linkedinLink"
                  type="text"
                  placeholder="https://www.linkedin.com/in/profile"
                  value={formData.linkedinLink}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedinLink: e.target.value })
                  }
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="youtubeLink"
                  className="text-xs font-bold text-[#5a5e7a]"
                >
                  YouTube Link
                </Label>
                <Input
                  id="youtubeLink"
                  type="text"
                  placeholder="https://youtube.com/@profile"
                  value={formData.youtubeLink}
                  onChange={(e) =>
                    setFormData({ ...formData, youtubeLink: e.target.value })
                  }
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-[#e8dcc4]/60 pt-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                disabled={formLoading}
                className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
              />
              <Label
                htmlFor="isActive"
                className="text-xs font-semibold text-[#1c1f4a] cursor-pointer selection:bg-transparent"
              >
                Activate this contact set (instantly overrides other active
                sets)
              </Label>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={formLoading}
                onClick={() => setModalOpen(false)}
                className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Details"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[280px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">
              Delete Contact Set
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure you want to delete this contact set? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ContactsCrudPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading contacts dashboard...
          </p>
        </div>
      }
    >
      <ContactsCrudPageContent />
    </Suspense>
  );
}
