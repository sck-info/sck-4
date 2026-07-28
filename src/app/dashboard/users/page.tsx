"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRealtime } from "@/hooks/useRealtime";
import { Loader2, UserCheck, UserX, Search, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type User = {
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useRealtime(["users"], () => {
    fetchUsers();
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update user.");
        return;
      }

      toast.success(`User ${user.isActive ? "deactivated" : "activated"} successfully.`);
      fetchUsers();
    } catch {
      toast.error("Failed to update user.");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Users</h1>
        <p className="text-xs text-[#5a5e7a] mt-1">Manage registered users.</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          search
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#5a5e7a] text-center py-12">No users found.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#e8dcc4] shadow-xs"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                  user.isActive ? "bg-[#6b8f71]" : "bg-[#c4796a]"
                }`}>
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1c1f4a] truncate">{user.name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[#5a5e7a] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </span>
                    )}
                    {user.gender && (
                      <span>{user.gender}</span>
                    )}
                    {(user.dateOfBirth || user.age) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {user.dateOfBirth || `${user.age}y`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  user.isPhoneVerified
                    ? "bg-[#6b8f71]/10 text-[#6b8f71]"
                    : "bg-[#c4796a]/10 text-[#c4796a]"
                }`}>
                  {user.isPhoneVerified ? "Verified" : "Unverified"}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => toggleActive(user)}
                  className={`border ${
                    user.isActive
                      ? "text-[#c4796a] border-[#c4796a]/30 hover:bg-[#c4796a]/5"
                      : "text-[#6b8f71] border-[#6b8f71]/30 hover:bg-[#6b8f71]/5"
                  } rounded-full text-[10px] cursor-pointer`}
                >
                  {user.isActive ? (
                    <><UserX className="w-3 h-3" /> Deactivate</>
                  ) : (
                    <><UserCheck className="w-3 h-3" /> Activate</>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
