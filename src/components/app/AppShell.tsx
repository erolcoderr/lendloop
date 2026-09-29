"use client";

import { Suspense, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAuth, useCurrentUser, useRouter } from "@/lib/store";
import type { ViewName } from "@/lib/types";

// View components — each reads its own params from the router store.
import LandingView from "@/components/views/LandingView";
import LoginView from "@/components/views/auth/LoginView";
import RegisterView from "@/components/views/auth/RegisterView";
import BrowseView from "@/components/views/BrowseView";
import ViewItemView from "@/components/views/ViewItemView";
import BorrowFlowView from "@/components/views/BorrowFlowView";
import DashboardView from "@/components/views/user/DashboardView";
import AddItemView from "@/components/views/user/AddItemView";
import EditItemView from "@/components/views/user/EditItemView";
import NotificationsView from "@/components/views/user/NotificationsView";
import ProfileView from "@/components/views/user/ProfileView";
import ChatView from "@/components/views/user/ChatView";
import MessagesView from "@/components/views/user/MessagesView";
import AdminDashboardView from "@/components/views/admin/AdminDashboardView";
import AdminUsersView from "@/components/views/admin/AdminUsersView";
import AdminVerifyView from "@/components/views/admin/AdminVerifyView";
import AdminSocialLinksView from "@/components/views/admin/AdminSocialLinksView";
import AdminReportsView from "@/components/views/admin/AdminReportsView";
import AdminFlaggedView from "@/components/views/admin/AdminFlaggedView";
import ReportView from "@/components/views/user/ReportView";
import ViewProfileView from "@/components/views/user/ViewProfileView";

const VIEWS: Record<ViewName, React.ComponentType> = {
  landing: LandingView,
  login: LoginView,
  register: RegisterView,
  browse: BrowseView,
  "view-item": ViewItemView,
  "borrow-flow": BorrowFlowView,
  dashboard: DashboardView,
  "add-item": AddItemView,
  "edit-item": EditItemView,
  notifications: NotificationsView,
  profile: ProfileView,
  chat: ChatView,
  messages: MessagesView,
  report: ReportView,
  "view-profile": ViewProfileView,
  "admin-dashboard": AdminDashboardView,
  "admin-users": AdminUsersView,
  "admin-verify": AdminVerifyView,
  "admin-social": AdminSocialLinksView,
  "admin-reports": AdminReportsView,
  "admin-flagged": AdminFlaggedView,
  "not-found": NotFound,
};

/** Views that require an authenticated user. */
const AUTH_REQUIRED: ViewName[] = [
  "dashboard",
  "add-item",
  "edit-item",
  "notifications",
  "profile",
  "borrow-flow",
  "chat",
  "messages",
  "report",
  "view-profile",
];

/** Views restricted to admins. */
const ADMIN_ONLY: ViewName[] = [
  "admin-dashboard",
  "admin-users",
  "admin-verify",
  "admin-social",
  "admin-reports",
  "admin-flagged",
];

export function AppShell() {
  const view = useRouter((s) => s.view);
  const navigate = useRouter((s) => s.navigate);
  const user = useCurrentUser();

  // Auth-gating redirects — keep the prototype from showing a blank gated page.
  useEffect(() => {
    if (!user && (AUTH_REQUIRED.includes(view) || ADMIN_ONLY.includes(view))) {
      navigate("login");
    } else if (user && ADMIN_ONLY.includes(view) && user.role !== "admin") {
      navigate("dashboard");
    } else if (user && (view === "login" || view === "register")) {
      // Already logged in — send to the right home.
      navigate(user.role === "admin" ? "admin-dashboard" : "dashboard");
    }
  }, [user, view, navigate]);

  const ViewComponent = VIEWS[view] ?? NotFound;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <ViewComponent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  const navigate = useRouter((s) => s.navigate);
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-[var(--font-display)] text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-xl font-semibold">This page wandered off.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Like a borrowed librong inasam, it's not where we left it. Let's get you back.
      </p>
      <button
        onClick={() => navigate("landing")}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to home
      </button>
    </div>
  );
}
