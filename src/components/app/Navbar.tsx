"use client";

import { useState } from "react";
import {
  Bell,
  Menu,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Search,
  Settings,
  X,
  BadgeCheck,
  Flag,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { actions, useAuth, useCurrentUser, useRouter, useData } from "@/lib/store";
import { timeAgo } from "@/lib/helpers";
import { Logo } from "@/components/shared/Logo";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ViewName } from "@/lib/types";

const USER_NAV: { label: string; view: ViewName; icon: typeof Search }[] = [
  { label: "Browse", view: "browse", icon: Search },
  { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { label: "Messages", view: "messages", icon: MessageSquare },
  { label: "Add Item", view: "add-item", icon: PlusCircle },
];

const ADMIN_NAV: { label: string; view: ViewName; icon: typeof Search }[] = [
  { label: "Overview", view: "admin-dashboard", icon: LayoutDashboard },
  { label: "Users", view: "admin-users", icon: UserIcon },
  { label: "Verifications", view: "admin-verify", icon: BadgeCheck },
  { label: "Social Links", view: "admin-social", icon: Link2 },
  { label: "Reports", view: "admin-reports", icon: ShieldCheck },
  { label: "Flagged", view: "admin-flagged", icon: Flag },
];

export function Navbar() {
  const user = useCurrentUser();
  const logout = useAuth((s) => s.logout);
  const navigate = useRouter((s) => s.navigate);
  const currentView = useRouter((s) => s.view);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? ADMIN_NAV : user ? USER_NAV : [];

  const go = (view: ViewName) => {
    navigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => go(user ? (isAdmin ? "admin-dashboard" : "dashboard") : "landing")}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="LendLoop home"
          >
            <Logo />
          </button>

          {navItems.length > 0 && (
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const active =
                  currentView === item.view ||
                  (item.view === "dashboard" && currentView === "profile") ||
                  (item.view === "messages" && currentView === "chat") ||
                  (item.view === "admin-dashboard" &&
                    ["admin-users", "admin-reports", "admin-social"].includes(currentView));
                return (
                  <button
                    key={item.view}
                    onClick={() => go(item.view)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => go("browse")}
                className="hidden sm:inline-flex"
              >
                Browse items
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go("login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => go("register")} className="hidden sm:inline-flex">
                Get started
              </Button>
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>
                      <Logo />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-2 px-4">
                    <SheetClose asChild>
                      <Button variant="outline" onClick={() => go("browse")}>
                        Browse items
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button variant="outline" onClick={() => go("login")}>
                        Log in
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button onClick={() => go("register")}>Get started</Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <NotificationsBell />

              {/* Profile menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar user={user} size={32} />
                    <span className="hidden text-left lg:block">
                      <span className="block text-xs font-semibold leading-tight text-foreground">
                        {user.name.split(" ")[0]}
                      </span>
                      <span className="block text-[11px] leading-tight text-muted-foreground">
                        {isAdmin ? "Admin" : user.barangay}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex items-center gap-3">
                    <Avatar user={user} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => go("dashboard")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> My Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("add-item")}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Lend an item
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("profile")}>
                        <UserIcon className="mr-2 h-4 w-4" /> Profile & Trust
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("report")}>
                        <Flag className="mr-2 h-4 w-4" /> Report a concern
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => go("admin-dashboard")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Overview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("admin-users")}>
                        <UserIcon className="mr-2 h-4 w-4" /> Manage Users
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("admin-verify")}>
                        <BadgeCheck className="mr-2 h-4 w-4" /> Verifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("admin-reports")}>
                        <ShieldCheck className="mr-2 h-4 w-4" /> Reports
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                      navigate("landing");
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile nav sheet */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                      <Logo />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 flex flex-col gap-1 px-2">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.view}>
                        <button
                          onClick={() => go(item.view)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                        >
                          <item.icon className="h-4 w-4 text-primary" />
                          {item.label}
                        </button>
                      </SheetClose>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------- notifications bell */

function NotificationsBell() {
  const user = useCurrentUser();
  const notifications = useData((s) => s.notifications);
  const navigate = useRouter((s) => s.navigate);

  if (!user) return null;
  const mine = notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => actions.markAllRead(user.id)}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          <div className="flex flex-col">
            {mine.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Sparkles className="h-8 w-8 text-primary/50" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              </div>
            ) : (
              mine.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    actions.markNotificationRead(n.id);
                    if (n.link) navigate(n.link.view, n.link.params);
                  }}
                  className={cn(
                    "flex gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/60",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-primary"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => navigate("notifications")}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
