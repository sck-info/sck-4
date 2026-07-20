"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Contact,
  LogOut,
  TrendingUp,
  Images,
  Camera,
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


function AppSidebar({
  onSignOutClick,
}: {
  onSignOutClick: () => void;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [slides, setSlides] = useState<{ imageUrl: string }[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const fetchAvatarSlides = async () => {
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
    };
    fetchAvatarSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  const currentAvatarUrl = slides[currentSlideIndex]?.imageUrl || "/images/sck-lifeskills.jpeg";

  const menuItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "About Slides",
      href: "/dashboard/about-slides",
      icon: Images,
    },
    {
      name: "Metrics",
      href: "/dashboard/metrics",
      icon: TrendingUp,
    },
    {
      name: "Gallery",
      href: "/dashboard/gallery",
      icon: Camera,
    },
    {
      name: "Contacts",
      href: "/dashboard/contacts",
      icon: Contact,
    },
  ];

  const isExpanded = state === "expanded";

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#1c1f4a]">
      {/* Header */}
      <SidebarHeader className={`h-20 border-b border-white/10 flex flex-row items-center gap-3 shrink-0 overflow-hidden ${
        isExpanded ? "px-4" : "px-2 justify-center"
      }`}>
        <Link href="/" className="flex flex-row items-center gap-3 w-full hover:opacity-85 transition-opacity">
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
              <h1 className="text-sm font-bold tracking-tight text-white">Sharath Chandra</h1>
              <p className="text-[10px] text-[#e8962e] tracking-wider uppercase font-bold">
                Admin Panel
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent className="py-6 px-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={`h-10 px-3 rounded-xl transition-all text-xs ${
                    isActive
                      ? "bg-[#b86a16] hover:bg-[#b86a16] text-white font-semibold shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Link href={item.href} className="flex items-center gap-2.5 w-full">
                    <Icon className="w-4 h-4 shrink-0" />
                    {isExpanded && <span className="truncate">{item.name}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer with Session & Signout */}
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#faf7f2] font-sans selection:bg-[#b86a16]/20">
        <AppSidebar onSignOutClick={() => setLogoutDialogOpen(true)} />

        <SidebarInset className="min-w-0 h-screen flex flex-col overflow-hidden bg-[#faf7f2]">
          {/* Main Top Header with profile info and trigger button */}
          <header className="flex items-center justify-between px-6 h-16 border-b border-[#e8dcc4]/60 bg-white/40 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-[#1c1f4a] hover:bg-[#b86a16]/5 hover:text-[#b86a16] cursor-pointer" />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs font-semibold text-[#5a5e7a]">Administrator Console</span>
            </div>

            {/* Profile widget in Top Bar header */}
            {status === "authenticated" && session?.user && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-[#e8dcc4]/60 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#b86a16] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                  {session.user.name ? session.user.name[0] : "A"}
                </div>
                <div className="flex flex-col text-left min-w-0 max-w-[120px] sm:max-w-[180px]">
                  <span className="text-[11px] font-bold text-[#1c1f4a] leading-none truncate">
                    {session.user.name || "Administrator"}
                  </span>
                  <span className="text-[9px] text-[#5a5e7a] leading-none mt-0.5 truncate">
                    {session.user.email}
                  </span>
                </div>
              </div>
            )}
          </header>

          {/* Scrollable Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
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
