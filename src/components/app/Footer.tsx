"use client";

import { Heart, Github, Mail } from "lucide-react";
import { useRouter } from "@/lib/store";
import { Logo } from "@/components/shared/Logo";
import type { ViewName } from "@/lib/types";

/**
 * Footer — sticky to the viewport bottom on short pages, pushed down naturally
 * on long pages (handled by AppShell's `min-h-screen flex flex-col` + `mt-auto`).
 * Marketing-quality copy + trust-building community stats, no filler.
 */
export function Footer() {
  const navigate = useRouter((s) => s.navigate);

  const cols: { heading: string; links: { label: string; view: ViewName }[] }[] = [
    {
      heading: "Community",
      links: [
        { label: "Browse items", view: "browse" },
        { label: "How it works", view: "landing" },
        { label: "Lend an item", view: "add-item" },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "Dashboard", view: "dashboard" },
        { label: "Notifications", view: "notifications" },
        { label: "Profile & trust", view: "profile" },
      ],
    },
    {
      heading: "Stewardship",
      links: [
        { label: "Admin overview", view: "admin-dashboard" },
        { label: "User management", view: "admin-users" },
        { label: "Community reports", view: "admin-reports" },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Reviving the Filipino spirit of <span className="font-medium text-foreground">bayanihan</span> —
              one shared drill, tent, and kaldero at a time.
            </p>
            <div className="flex items-center gap-3 text-muted-foreground">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.heading}
              </h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LendLoop. A project prototype for community good.</p>
          <p className="inline-flex items-center gap-1.5">
            Built with <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> in the Philippines
          </p>
        </div>
      </div>
    </footer>
  );
}
