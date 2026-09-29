"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/store";
import { apiGet, apiPatch } from "@/lib/api-client";
import { formatDate, timeAgo } from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/lib/store";
import type { Report, ReportStatus } from "@/lib/types";

const STATUS_META: Record<ReportStatus, { label: string; classes: string; icon: typeof Clock }> = {
  open: { label: "Open", classes: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  reviewing: { label: "Reviewing", classes: "bg-teal-100 text-teal-800 border-teal-200", icon: Loader2 },
  resolved: { label: "Resolved", classes: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", classes: "bg-zinc-100 text-zinc-600 border-zinc-200", icon: XCircle },
};

export default function AdminFlaggedView() {
  const user = useCurrentUser();
  const users = useData((s) => s.users);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    apiGet<{ reports: Report[] }>("/api/reports")
      .then((res) => setReports(res.reports))
      .catch(() => toast.error("Could not load reports."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? reports : reports.filter((r) => r.status === filter)),
    [reports, filter],
  );

  async function handleStatusChange(id: string, status: ReportStatus) {
    try {
      await apiPatch(`/api/reports/${id}`, { status });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Marked as ${status}.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update.");
    }
  }

  if (!user || user.role !== "admin") return null;

  const userById = (id: string) => users.find((u) => u.id === id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Reported Concerns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and resolve reports filed by members of your barangay.
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reports</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No reports"
          description="When a member files a concern, it will appear here for your review."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {filtered.map((r) => {
            const reporter = userById(r.reporterId);
            const meta = STATUS_META[r.status];
            return (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {reporter && <Avatar user={reporter} size={40} />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-foreground">{r.subject}</h2>
                        <Badge variant="outline" className={meta.classes}>
                          <meta.icon className="mr-1 h-3 w-3" />
                          {meta.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{r.type}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {reporter?.name ?? "Unknown"} · {formatDate(r.createdAt)} · {timeAgo(r.createdAt)}
                      </p>
                      <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">{r.description}</p>
                      {r.adminNote && (
                        <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin note</p>
                          <p className="mt-1 text-foreground">{r.adminNote}</p>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {r.status !== "reviewing" && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(r.id, "reviewing")}>
                            Mark as reviewing
                          </Button>
                        )}
                        {r.status !== "resolved" && (
                          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleStatusChange(r.id, "resolved")}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                          </Button>
                        )}
                        {r.status !== "dismissed" && (
                          <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50" onClick={() => handleStatusChange(r.id, "dismissed")}>
                            <XCircle className="h-3.5 w-3.5" /> Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
