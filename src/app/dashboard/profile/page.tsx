"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useRealtime } from "@/hooks/useRealtime";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Venus,
  Mars,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [age, setAge] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setGender(data.gender || "");
        setAge(data.age?.toString() || "");
        if (data.dateOfBirth) setDateOfBirth(new Date(data.dateOfBirth));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useRealtime(["users"], () => {
    fetchProfile();
  });

  const handleSave = async () => {
    setSaving(true);

    const body: Record<string, any> = { name, gender };

    if (dateOfBirth) body.dateOfBirth = format(dateOfBirth, "yyyy-MM-dd");
    if (age) body.age = parseInt(age);

    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update profile.");
        return;
      }

      toast.success("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");

      await update({ name: data.name });
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Profile</h1>
        <p className="text-xs text-[#5a5e7a] mt-1">Manage your profile information.</p>
      </div>

      <Card className="border-[#e8dcc4] bg-white rounded-xl shadow-xs">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle className="text-sm font-bold text-[#1c1f4a]">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={email}
                  disabled
                  className="pl-10 h-11 bg-gray-100 border-[#e8dcc4] rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">WhatsApp Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={phone}
                  disabled
                  className="pl-10 h-11 bg-gray-100 border-[#e8dcc4] rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl w-full">
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

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">Date of Birth</Label>
              <DatePicker
                value={dateOfBirth}
                onChange={(d) => {
                  setDateOfBirth(d);
                  if (d) {
                    const calculated = new Date().getFullYear() - d.getFullYear();
                    setAge(calculated.toString());
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">Age</Label>
              <Input
                type="number"
                min={1}
                max={150}
                placeholder="Enter age"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (e.target.value) {
                    const yr = new Date().getFullYear() - parseInt(e.target.value);
                    setDateOfBirth(new Date(yr, 0, 1));
                  }
                }}
                className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
              />
              {age && (
                <p className="text-[9px] text-[#9396ae] mt-1">
                  Age provided. DOB is auto-calculated and may not be exact.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e8dcc4] bg-white rounded-xl shadow-xs">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle className="text-sm font-bold text-[#1c1f4a]">Update Password</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c1f4a] transition-colors"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c1f4a] transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-6 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-[0_10px_20px_rgba(28,31,74,0.15)] cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}
