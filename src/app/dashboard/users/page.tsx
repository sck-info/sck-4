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
  Search,
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

  // URL parameters
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);

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
    setLocalStatus(statusFilter);
  }, [searchQuery, statusFilter]);

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
      const searchPart = searchQuery
        ? `&search=${encodeURIComponent(searchQuery)}`
        : "";
      const statusPart =
        statusFilter !== "all" ? `&status=${statusFilter}` : "";

      const res = await fetch(
        `/api/users?page=${page}&limit=${limit}${searchPart}${statusPart}`,
      );
      if (!res.ok) throw new Error("Failed to load users");
      const result = await res.json();
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useRealtime(["users"], () => {
    fetchUsers();
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", localSearch.trim());
    params.set("status", localStatus);
    params.set("page", "1");
    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");

    const params = new URLSearchParams(searchParams.toString());
    params.set("search", "");
    params.set("status", "all");
    params.set("page", "1");
    pushParams(params);
  };

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
        throw new Error(data.error || "Failed to toggle status");
      }

      toast.success(
        confirmUser.isActive
          ? "User deactivated successfully!"
          : "User activated successfully!",
      );
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to change user status.");
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
            ? formData.dateOfBirth.toISOString().split("T")[0]
            : null,
          age: formData.age ? parseInt(formData.age) || null : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
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
      {/* Header Title */}
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

      {/* Filter Toolbar (No Role Filter) */}
      <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Search Users
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search name, email, or phone..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Status
          </Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Manual Filter Apply and Clear Buttons */}
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading users...</p>
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
            No matching users found
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter to find users.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                    Name
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                    Email
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                    Phone
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                    Gender
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                    DOB / Age
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                    Status
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-right">
                    Actions
                  </TableHead>
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
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                            user.isActive ? "bg-[#6b8f71]" : "bg-[#c4796a]"
                          }`}
                        >
                          {user.name[0]}
                        </div>
                        <span className="text-sm font-medium text-[#1c1f4a]">
                          {user.name}
                        </span>
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
                        <span className="text-white/0 font-mono select-none">
                          --
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#5a5e7a]">
                      {user.gender || (
                        <span className="text-white/0 font-mono select-none">
                          --
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#5a5e7a]">
                      {user.dateOfBirth || (user.age ? `${user.age}y` : "") || (
                        <span className="text-white/0 font-mono select-none">
                          --
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            user.isPhoneVerified
                              ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                              : "bg-[#c4796a]/10 text-[#c4796a]"
                          }`}
                        >
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
                          {user.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              Edit User
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider"
              >
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={formLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="gender"
                  className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider"
                >
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) =>
                    setFormData({ ...formData, gender: val })
                  }
                  disabled={formLoading}
                >
                  <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="age"
                  className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider"
                >
                  Age
                </Label>
                <Input
                  id="age"
                  type="text"
                  placeholder="e.g. 25"
                  value={formData.age}
                  onChange={(e) => {
                    setFormData({ ...formData, age: e.target.value });
                    if (e.target.value) {
                      const yr =
                        new Date().getFullYear() -
                        (parseInt(e.target.value) || 0);
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: new Date(yr, 0, 1),
                      }));
                    }
                  }}
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider block">
                Date of Birth
              </Label>
              <DatePicker
                value={formData.dateOfBirth}
                onChange={(date: Date | undefined) => {
                  setFormData({
                    ...formData,
                    dateOfBirth: date,
                    age: date
                      ? (
                          new Date().getFullYear() - date.getFullYear()
                        ).toString()
                      : "",
                  });
                }}
                disabled={formLoading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50 -mx-6 px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={formLoading}
                className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl"
              >
                {formLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmUser}
        onOpenChange={(open) => !open && setConfirmUser(null)}
      >
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to{" "}
              {confirmUser?.isActive ? "deactivate" : "activate"} user account
              for{" "}
              <strong className="text-[#1c1f4a]">{confirmUser?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleActive}
              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-xs font-semibold rounded-xl"
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
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
