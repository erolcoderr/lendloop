"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  Package,
  ArrowRightLeft,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  UserPlus,
  Ban,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { useCurrentUser, useData, useRouter } from "@/lib/store";
import {
  addDaysISO,
  calculateTrustScore,
  formatDate,
  timeAgo,
  todayISO,
} from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* --------------------------------------------------------------- motion */

const containerVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const itemVar = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/* ----------------------------------------------------------- chart conf */

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--popover-foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  padding: "0.5rem 0.75rem",
} as const;

/* ------------------------------------------------------------- activity */

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  text: ReactNode;
  at: string;
  badge?: ReactNode;
}

/* ============================================================ component */

export default function AdminDashboardView() {
  const user = useCurrentUser();
  const users = useData((s) => s.users);
  const items = useData((s) => s.items);
  const requests = useData((s) => s.requests);
  const reviews = useData((s) => s.reviews);
  const navigate = useRouter((s) => s.navigate);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(t);
  }, []);

  const weekData = useMemo(() => {
    const today = todayISO();
    const out: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDaysISO(today, -i);
      const label = new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
      });
      const count = requests.filter(
        (r) => r.createdAt.slice(0, 10) === d
      ).length;
      out.push({ day: label, count });
    }
    return out;
  }, [requests]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) map.set(it.category, (map.get(it.category) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const activity = useMemo<ActivityItem[]>(() => {
    const rows: ActivityItem[] = [];
    for (const r of requests) {
      const borrower = users.find((u) => u.id === r.borrowerId);
      const owner = users.find((u) => u.id === r.ownerId);
      const it = items.find((i) => i.id === r.itemId);
      rows.push({
        id: "req-" + r.id,
        icon: ArrowRightLeft,
        text: (
          <span>
            <b className="font-semibold text-foreground">
              {borrower?.name ?? "A neighbor"}
            </b>{" "}
            requested{" "}
            <b className="font-semibold text-foreground">
              {it?.title ?? "an item"}
            </b>{" "}
            from {owner?.name?.split(" ")[0] ?? "a kapitbahay"}
          </span>
        ),
        at: r.createdAt,
        badge: <StatusBadge status={r.status} />,
      });
    }
    for (const rv of reviews) {
      const from = users.find((u) => u.id === rv.fromUserId);
      const to = users.find((u) => u.id === rv.toUserId);
      rows.push({
        id: "rev-" + rv.id,
        icon: MessageSquare,
        text: (
          <span>
            <b className="font-semibold text-foreground">
              {from?.name ?? "Someone"}
            </b>{" "}
            left a {rv.rating}★ review for{" "}
            <b className="font-semibold text-foreground">
              {to?.name ?? "a neighbor"}
            </b>
          </span>
        ),
        at: rv.createdAt,
      });
    }
    for (const u of users) {
      rows.push({
        id: "usr-" + u.id,
        icon: u.status === "suspended" ? Ban : UserPlus,
        text:
          u.status === "suspended" ? (
            <span>
              <b className="font-semibold text-foreground">{u.name}</b> was
              suspended
            </span>
          ) : (
            <span>
              <b className="font-semibold text-foreground">{u.name}</b> joined
              the community
            </span>
          ),
        at: u.joinedAt,
      });
    }
    return rows
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 8);
  }, [requests, reviews, users, items]);

  if (!user || user.role !== "admin") return null;
  if (loading) return <DashboardSkeleton />;

  /* --- derived stats (non-hook) --- */
  const totalMembers = users.filter((u) => u.role === "user").length;
  const totalItems = items.length;
  const activeBorrows = requests.filter((r) =>
    ["pending", "approved", "borrowed"].includes(r.status)
  ).length;
  const flaggedMembers = users.filter((u) => {
    if (u.role === "admin") return false;
    const score = calculateTrustScore(
      reviews.filter((rv) => rv.toUserId === u.id)
    );
    return u.status === "suspended" || score < 55;
  }).length;

  const stats: {
    icon: LucideIcon;
    value: number;
    label: string;
    sub: string;
    tone: string;
  }[] = [
    {
      icon: Users,
      value: totalMembers,
      label: "Total Members",
      sub: "Kapitbahay in the loop",
      tone: "bg-primary/10 text-primary",
    },
    {
      icon: Package,
      value: totalItems,
      label: "Items Shared",
      sub: "Circulating across barangays",
      tone: "bg-chart-2/15 text-chart-2",
    },
    {
      icon: ArrowRightLeft,
      value: activeBorrows,
      label: "Active Borrows",
      sub: "Pending, approved, or out",
      tone: "bg-chart-3/15 text-chart-3",
    },
    {
      icon: AlertTriangle,
      value: flaggedMembers,
      label: "Flagged Members",
      sub: "Suspended or low trust",
      tone: "bg-chart-5/15 text-chart-5",
    },
  ];

  const today = formatDate(todayISO());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          <span className="h-px w-6 bg-primary/50" />
          Steward Console
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Community Stewardship
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {user.barangay} · {user.city} · {today}
        </p>
      </header>

      {/* Stat cards */}
      <motion.section
        variants={containerVar}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Community summary"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={itemVar}>
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  {s.label}
                </CardTitle>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}
                >
                  <s.icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-[var(--font-display)] text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
                  {s.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      {/* Two-column charts */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] text-lg">
              Borrows this week
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              New requests logged each day — the loop's heartbeat.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weekData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0.55}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                    width={32}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Requests"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    fill="url(#weekGrad)"
                    dot={{ r: 3, fill: "var(--chart-1)" }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] text-lg">
              Category distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              What the barangay loves to lend — by category.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-[200px] w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="var(--card)"
                      strokeWidth={2}
                    >
                      {categoryData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-1.5 text-sm sm:w-1/2">
                {categoryData.slice(0, 6).map((c, i) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      {c.name}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {c.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity + quick links */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] text-lg">
              Recent activity
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              The latest bayanihan moments across the community.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="max-h-96 space-y-1 overflow-y-auto pr-1">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-muted-foreground">
                      {a.text}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      {timeAgo(a.at)}
                    </p>
                  </div>
                  {a.badge && <span className="shrink-0">{a.badge}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <QuickLink
            title="Manage members"
            description="Suspend, activate, or review trust across the barangay."
            icon={Users}
            onClick={() => navigate("admin-users")}
          />
          <QuickLink
            title="View reports"
            description="Dive into borrow trends, top lenders, and return health."
            icon={ChevronRight}
            onClick={() => navigate("admin-reports")}
          />
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------- quick link */

function QuickLink({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left"
    >
      <Card className="transition-all duration-200 hover:border-primary/40 hover:shadow-md">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-[var(--font-display)] text-base font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </CardContent>
      </Card>
    </button>
  );
}

/* ------------------------------------------------------------- skeleton */

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="mt-2 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[240px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
