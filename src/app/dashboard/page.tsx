import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import UserDashboard from "@/components/dashboard/user-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}
