"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Venus,
  Mars,
  UserCheck,
  UserX,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  age: number | null;
  isActive: boolean;
  isPhoneVerified: boolean;
  createdAt: string | null;
};

function UsersPageContent() {
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

  const [users, setUsers] = useState<UserRow[]>([]);
  const isInitialLoadRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");

  // Edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dateOfBirth: undefined as Date | undefined,
    age: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError("");
      if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const res = await fetch(`/api/users?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load users");
      const result = await res.json();
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useRealtime(["users"], () => {
    fetchUsers();
  });

  const handleOpenEdit = (user: UserRow) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      age: user.age?.toString() || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleToggleActive = (user: UserRow) => {
    setConfirmUser(user);
  };

  const handleConfirmToggleActive = async () => {
    if (!confirmUser) return;
    try {
      const res = await fetch(`/api/users/${confirmUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !confirmUser.isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user.");
      }

      toast.success(
        `User ${confirmUser.isActive ? "deactivated" : "activated"} successfully.`
      );
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user.");
    } finally {
      setConfirmUser(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          gender: formData.gender || null,
          dateOfBirth: formData.dateOfBirth
            ? `${formData.dateOfBirth.getFullYear()}-${String(formData.dateOfBirth.getMonth() + 1).padStart(2, "0")}-${String(formData.dateOfBirth.getDate()).padStart(2, "0")}`
            : null,
          age: formData.age ? parseInt(formData.age) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user.");
      }

      toast.success("User updated successfully!");
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Manage Users
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            View and manage registered users.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading users...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <Users className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No users registered
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Users will appear here once they register through the registration page.
          </p>
        </div>
      ) : (
        <div className="p-1">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Name</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Email</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Phone</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Gender</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">DOB / Age</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Status</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                    !user.isActive ? "opacity-60" : ""
                  }`}
                >
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                        user.isActive ? "bg-[#6b8f71]" : "bg-[#c4796a]"
                      }`}>
                        {user.name[0]}
                      </div>
                      <span className="text-sm font-medium text-[#1c1f4a]">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#1c1f4a] font-medium">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#9396ae] shrink-0" />
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#5a5e7a]">
                    {user.phone ? (
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#9396ae] shrink-0" />
                        {user.phone}
                      </span>
                    ) : (
                      <span className="text-white/0 font-mono select-none">--</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#5a5e7a]">
                    {user.gender || <span className="text-white/0 font-mono select-none">--</span>}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#5a5e7a]">
                    {user.dateOfBirth || (user.age ? `${user.age}y` : "") || (
                      <span className="text-white/0 font-mono select-none">--</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                        user.isPhoneVerified
                          ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                          : "bg-[#c4796a]/10 text-[#c4796a]"
                      }`}>
                        {user.isPhoneVerified ? "Verified" : "Unverified"}
                      </span>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                          user.isActive
                            ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                            : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16]"
                        }`}
                      >
                        {user.isActive ? "Active" : "Activate"}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`p-2 border border-transparent rounded-xl transition-all cursor-pointer ${
                          user.isActive
                            ? "hover:bg-[#c4796a]/10 text-[#c4796a] hover:border-[#c4796a]/30"
                            : "hover:bg-[#6b8f71]/10 text-[#6b8f71] hover:border-[#6b8f71]/30"
                        }`}
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              Edit User
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={formLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(v) => setFormData({ ...formData, gender: v })}
                disabled={formLoading}
              >
                <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">
                    <span className="flex items-center gap-2"><Mars className="w-3.5 h-3.5" /> Male</span>
                  </SelectItem>
                  <SelectItem value="Female">
                    <span className="flex items-center gap-2"><Venus className="w-3.5 h-3.5" /> Female</span>
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Date of Birth</Label>
                <DatePicker
                  value={formData.dateOfBirth}
                  onChange={(d) => {
                    setFormData({ ...formData, dateOfBirth: d });
                    if (d) {
                      const calculated = new Date().getFullYear() - d.getFullYear();
                      setFormData((prev) => ({ ...prev, age: calculated.toString() }));
                    }
                  }}
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Age</Label>
                <Input
                  type="text"
                  placeholder="Age"
                  value={formData.age}
                  onChange={(e) => {
                    setFormData({ ...formData, age: e.target.value });
                    if (e.target.value) {
                      const yr = new Date().getFullYear() - parseInt(e.target.value);
                      setFormData((prev) => ({ ...prev, dateOfBirth: new Date(yr, 0, 1) }));
                    }
                  }}
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl"
                />
              </div>
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
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmUser !== null} onOpenChange={(open) => !open && setConfirmUser(null)}>
        <AlertDialogContent className="w-[320px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">
              {confirmUser?.isActive ? "Deactivate User Account" : "Activate User Account"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              {confirmUser?.isActive
                ? `Are you sure you want to deactivate ${confirmUser.name}'s account? They will be logged out immediately and lose access.`
                : `Are you sure you want to activate ${confirmUser?.name}'s account?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleActive}
              className="flex-1 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading users dashboard...
          </p>
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
