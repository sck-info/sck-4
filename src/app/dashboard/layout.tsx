"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRealtimeLogout } from "@/hooks/useRealtimeLogout";
import { useRealtime } from "@/hooks/useRealtime";
import {
  LayoutDashboard,
  Contact,
  LogOut,
  TrendingUp,
  Images,
  Camera,
  Users,
  MessageSquare,
  MapPin,
  QrCode,
  Grid,
  Sliders,
  Calendar,
  ClipboardList,
  Star,
  AlertCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const ADMIN_MENU_SECTIONS = [
  {
    title: "Operations",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "Bookings Queue", href: "/dashboard/bookings", icon: ClipboardList },
      { name: "Abandoned Bookings", href: "/dashboard/bookings/abandoned", icon: AlertCircle },
      { name: "Announce Slots", href: "/dashboard/slots", icon: Calendar },
    ],
  },
  {
    title: "Offerings Config",
    items: [
      { name: "Offerings", href: "/dashboard/offerings", icon: Grid },
      { name: "Form Builder", href: "/dashboard/form-builder", icon: Sliders },
      { name: "Locations", href: "/dashboard/locations", icon: MapPin },
      { name: "Payment QRs", href: "/dashboard/payment-qrs", icon: QrCode },
      { name: "Feedbacks & Reviews", href: "/dashboard/feedbacks", icon: Star },
    ],
  },
  {
    title: "Website Content",
    items: [
      { name: "About Slides", href: "/dashboard/about-slides", icon: Images },
      { name: "Metrics", href: "/dashboard/metrics", icon: TrendingUp },
      { name: "Gallery", href: "/dashboard/gallery", icon: Camera },
      { name: "Contacts", href: "/dashboard/contacts", icon: Contact },
      { name: "Queries", href: "/dashboard/queries", icon: MessageSquare },
    ],
  },
  {
    title: "Communication",
    items: [
      { name: "Manual Broadcast", href: "/dashboard/communication/manual", icon: MessageSquare },
      { name: "Scheduled Messages", href: "/dashboard/communication/scheduled", icon: Calendar },
    ],
  },
  {
    title: "Access Control",
    items: [
      { name: "Users", href: "/dashboard/users", icon: Users },
    ],
  },
];

const USER_MENU_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Bookings", href: "/dashboard/my-bookings", icon: ClipboardList },
];

function AppSidebar({
  onSignOutClick,
  role,
  sessionLoading,
}: {
  onSignOutClick: () => void;
  role?: string;
  sessionLoading?: boolean;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [slides, setSlides] = useState<{ imageUrl: string }[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const fetchAvatarSlides = useCallback(async () => {
    try {
      const res = await fetch("/api/about-slides");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data.map((item: any) => ({ imageUrl: item.imageUrl })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch sidebar avatar slides:", err);
    }
  }, []);

  useEffect(() => {
    fetchAvatarSlides();
  }, [fetchAvatarSlides]);

  useRealtime(["about_slides"], () => {
    fetchAvatarSlides();
  });

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  const currentAvatarUrl =
    slides[currentSlideIndex]?.imageUrl || "/images/sck-lifeskills.jpeg";

  const isExpanded = state === "expanded";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/10 bg-[#1c1f4a]"
    >
      <SidebarHeader
        className={`h-20 border-b border-white/10 flex flex-row items-center gap-3 shrink-0 overflow-hidden ${
          isExpanded ? "px-4" : "px-2 justify-center"
        }`}
      >
        <Link
          href="/"
          className="flex flex-row items-center gap-3 w-full hover:opacity-85 transition-opacity"
        >
          <img
            src={currentAvatarUrl}
            alt="Sharath Chandra Kancherla"
            className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-sm border border-white/10"
            onError={(e) => {
              e.currentTarget.src = "/images/sck-lifeskills.jpeg";
            }}
          />
          {isExpanded && (
            <div className="flex flex-col truncate">
              <h1 className="text-sm font-bold tracking-tight text-white">
                Sharath Kancherla
              </h1>
              <p className="text-[10px] text-[#e8962e] tracking-wider uppercase font-bold">
                {role === "ADMIN" ? "Admin Panel" : "User Panel"}
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4 px-2 overflow-y-auto scrollbar">
        {sessionLoading ? (
          <div className="space-y-4 px-3 py-2">
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded-md animate-pulse w-1/3" />
              <div className="h-9 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-9 bg-white/5 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-white/10 rounded-md animate-pulse w-1/4" />
              <div className="h-9 bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        ) : role === "ADMIN" ? (
          ADMIN_MENU_SECTIONS.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "mt-4" : ""}>
              {isExpanded && (
                <div className="px-3 text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">
                  {section.title}
                </div>
              )}
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={`h-9 px-3 rounded-xl transition-all text-xs ${
                          isActive
                            ? "bg-[#b86a16] hover:bg-[#b86a16] text-white font-semibold shadow-sm"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-2.5 w-full"
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {isExpanded && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          ))
        ) : (
          <SidebarMenu>
            {USER_MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.name}
                    className={`h-9 px-3 rounded-xl transition-all text-xs ${
                      isActive
                        ? "bg-[#b86a16] hover:bg-[#b86a16] text-white font-semibold shadow-sm"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 w-full"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {isExpanded && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-2 shrink-0 overflow-hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSignOutClick}
              tooltip="Sign Out"
              className="h-10 px-3 rounded-xl text-[#c4796a] hover:bg-[#c4796a]/10 hover:text-[#c4796a] transition-all cursor-pointer w-full text-xs"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {isExpanded && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState(session?.user?.name || "User");
  const [profileEmail, setProfileEmail] = useState(session?.user?.email || "");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfileName(data.name || "User");
        setProfileEmail(data.email || "");
        setProfileImage(data.image || null);
      }
    } catch (err) {
      console.error("Failed to fetch profile in layout:", err);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || "User");
      setProfileEmail(session.user.email || "");
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, fetchProfile]);

  useRealtime(["users"], () => {
    if (status === "authenticated") {
      fetchProfile();
    }
  });

  useRealtimeLogout();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#faf7f2] font-sans selection:bg-[#b86a16]/20">
        <AppSidebar
          onSignOutClick={() => setLogoutDialogOpen(true)}
          role={session?.user?.role}
          sessionLoading={status === "loading" && !session}
        />

        <SidebarInset className="min-w-0 h-screen flex flex-col overflow-hidden bg-[#faf7f2]">
          <header className="flex items-center justify-between px-6 h-16 border-b border-[#e8dcc4]/60 bg-white/40 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-[#1c1f4a] hover:bg-[#b86a16]/5 hover:text-[#b86a16] cursor-pointer" />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs font-semibold text-[#5a5e7a]">
                {session?.user?.role === "ADMIN"
                  ? "Administrator Console"
                  : "User Portal"}
              </span>
            </div>

            {status === "authenticated" && session?.user && (
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-[#e8dcc4]/60 shadow-xs hover:bg-[#faf7f2] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#b86a16] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt={profileName} className="w-full h-full object-cover" />
                  ) : (
                    profileName ? profileName[0] : "U"
                  )}
                </div>
                <div className="flex flex-col text-left min-w-0 max-w-[120px] sm:max-w-[180px]">
                  <span className="text-[11px] font-bold text-[#1c1f4a] leading-none truncate">
                    {profileName}
                  </span>
                  <span className="text-[9px] text-[#5a5e7a] leading-none mt-0.5 truncate">
                    {profileEmail}
                  </span>
                </div>
              </Link>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="w-[280px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-[#1c1f4a]">
              Logging Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-[#5a5e7a] mt-1">
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#1c1f4a] text-[#1c1f4a] hover:bg-[#1c1f4a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setLogoutDialogOpen(false);
                toast.success("Successfully logged out!");
                setTimeout(async () => {
                  await signOut({ callbackUrl: "/" });
                }, 800);
              }}
              className="flex-1 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
