"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRightLeft,
  CheckCircle2,
  Coins,
  Users,
  Download,
  type LucideIcon,
} from "lucide-react";

import { useCurrentUser, useData } from "@/lib/store";
import { addDaysISO, formatPeso, todayISO } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/* ----------------------------------------------------------- motion */

const containerVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
};
const itemVar = {
  hidden: { opacity: 0, y: 14 },
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

type RangeKey = "7d" | "30d" | "all";

/* ============================================================ component */

export default function AdminReportsView() {
  const user = useCurrentUser();
  const users = useData((s) => s.users);
  const items = useData((s) => s.items);
  const requests = useData((s) => s.requests);

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(t);
  }, []);

  /* --- KPIs --- */
  const kpis = useMemo(() => {
    const totalBorrows = requests.length;
    const returned = requests.filter(
      (r) => r.status === "returned" && r.returnedAt
    );
    const onTime = returned.filter(
      (r) => (r.returnedAt ?? "").slice(0, 10) <= r.endDate
    ).length;
    const onTimeRate =
      returned.length > 0
        ? Math.round((onTime / returned.length) * 100)
        : 100;
    const avgDeposit =
      items.length > 0
        ? Math.round(items.reduce((s, i) => s + i.deposit, 0) / items.length)
        : 0;
    const activeLenders = new Set(items.map((i) => i.ownerId)).size;
    return { totalBorrows, onTimeRate, avgDeposit, activeLenders };
  }, [requests, items]);

  /* --- top lenders --- */
  const topLenders = useMemo(() => {
    return users
      .map((u) => ({
        name: u.name.split(" ")[0],
        fullName: u.name,
        items: items.filter((i) => i.ownerId === u.id).length,
      }))
      .filter((d) => d.items > 0)
      .sort((a, b) => b.items - a.items)
      .slice(0, 5);
  }, [users, items]);

  /* --- most borrowed items --- */
  const topItems = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of requests)
      map.set(r.itemId, (map.get(r.itemId) ?? 0) + 1);
    return items
      .map((i) => ({
        name:
          i.title.length > 14 ? i.title.slice(0, 14) + "…" : i.title,
        fullName: i.title,
        borrows: map.get(i.id) ?? 0,
      }))
      .filter((d) => d.borrows > 0)
      .sort((a, b) => b.borrows - a.borrows)
      .slice(0, 5);
  }, [items, requests]);

  /* --- borrows trend (weekly, ~6 weeks) --- */
  const trend = useMemo(() => {
    const today = todayISO();
    const out: { week: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const wStart = addDaysISO(today, -7 * i - 6);
      const wEnd = addDaysISO(today, -7 * i);
      const count = requests.filter((r) => {
        const d = r.createdAt.slice(0, 10);
        return d >= wStart && d <= wEnd;
      }).length;
      const label = new Date(wStart + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      out.push({ week: label, count });
    }
    return out;
  }, [requests]);

  /* --- category distribution --- */
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) map.set(it.category, (map.get(it.category) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  /* --- returns vs overdue --- */
  const returnsData = useMemo(() => {
    const returned = requests.filter(
      (r) => r.status === "returned" && r.returnedAt
    );
    let onTime = 0;
    let late = 0;
    for (const r of returned) {
      if ((r.returnedAt ?? "").slice(0, 10) <= r.endDate) onTime++;
      else late++;
    }
    return [
      { name: "On-time", value: onTime },
      { name: "Late", value: late },
    ];
  }, [requests]);

  if (!user || user.role !== "admin") return null;
  if (loading) return <ReportsSkeleton />;

  const kpiCards: {
    icon: LucideIcon;
    value: string;
    label: string;
    sub: string;
    tone: string;
  }[] = [
    {
      icon: ArrowRightLeft,
      value: String(kpis.totalBorrows),
      label: "Total Borrows",
      sub: "Requests logged all-time",
      tone: "bg-primary/10 text-primary",
    },
    {
      icon: CheckCircle2,
      value: `${kpis.onTimeRate}%`,
      label: "On-time Return Rate",
      sub: "Returned on or before due date",
      tone: "bg-chart-4/15 text-chart-4",
    },
    {
      icon: Coins,
      value: formatPeso(kpis.avgDeposit),
      label: "Avg Deposit",
      sub: "Refundable trust hold",
      tone: "bg-chart-2/15 text-chart-2",
    },
    {
      icon: Users,
      value: String(kpis.activeLenders),
      label: "Active Lenders",
      sub: "Members sharing ≥ 1 item",
      tone: "bg-chart-3/15 text-chart-3",
    },
  ];

  const topCategory = categoryData[0];
  const topCategoryPct =
    items.length > 0
      ? Math.round(((topCategory?.value ?? 0) / items.length) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="h-px w-6 bg-primary/50" />
            Steward Console
          </span>
          <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Community Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            How the bayanihan loop is flowing across {user.barangay}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={range}
            onValueChange={(v) => setRange(v as RangeKey)}
          >
            <SelectTrigger className="w-[150px]" aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() =>
              toast.success("Report exported — check your downloads")
            }
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export report</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </header>

      {/* KPI row */}
      <motion.section
        variants={containerVar}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Key performance indicators"
      >
        {kpiCards.map((k) => (
          <motion.div key={k.label} variants={itemVar}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  {k.label}
                </CardTitle>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.tone}`}
                >
                  <k.icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-[var(--font-display)] text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                  {k.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      {/* Charts */}
      <motion.section
        variants={containerVar}
        initial="hidden"
        animate="show"
        className="mt-6 grid gap-6 lg:grid-cols-2"
      >
        {/* Top lenders */}
        <motion.div variants={itemVar}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-lg">
                Top lenders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                The most generous kapitbahay — ranked by items shared.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topLenders}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                      width={56}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    />
                    <Bar
                      dataKey="items"
                      name="Items shared"
                      fill="var(--chart-1)"
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Most borrowed items */}
        <motion.div variants={itemVar}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-lg">
                Most-borrowed items
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                What the neighborhood reaches for most often.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topItems}
                    margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                      width={32}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    />
                    <Bar
                      dataKey="borrows"
                      name="Borrows"
                      fill="var(--chart-2)"
                      radius={[6, 6, 0, 0]}
                      barSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Borrows trend */}
        <motion.div variants={itemVar}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-lg">
                Borrows trend
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Weekly request volume — steady hands keep the loop alive.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--chart-3)"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-3)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="week"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                      width={32}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Borrows"
                      stroke="var(--chart-3)"
                      strokeWidth={2.5}
                      fill="url(#trendGrad)"
                      dot={{ r: 3, fill: "var(--chart-3)" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category distribution donut */}
        <motion.div variants={itemVar}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-lg">
                Category distribution
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {topCategory
                  ? `${topCategory.name} lead the loop — ${topCategoryPct}% of all items.`
                  : "No items yet — the catalog is still growing."}
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
                            backgroundColor:
                              CHART_COLORS[i % CHART_COLORS.length],
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
        </motion.div>
      </motion.section>

      {/* Returns vs overdue (full width) */}
      <motion.section
        variants={containerVar}
        initial="hidden"
        animate="show"
        className="mt-6"
      >
        <motion.div variants={itemVar}>
          <Card>
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-lg">
                Returns vs overdue
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {kpis.onTimeRate >= 85
                  ? "Excellent return discipline — the barangay honors its word."
                  : "A few late returns to watch — nudge borrowers before due dates."}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={returnsData}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke="var(--muted-foreground)"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke="var(--muted-foreground)"
                        width={32}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      />
                      <Bar
                        dataKey="value"
                        name="Returns"
                        radius={[6, 6, 0, 0]}
                        barSize={48}
                      >
                        {returnsData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i === 0 ? "var(--chart-4)" : "var(--chart-5)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <ReturnStat
                    label="On-time returns"
                    value={returnsData[0]?.value ?? 0}
                    color="var(--chart-4)"
                  />
                  <ReturnStat
                    label="Late returns"
                    value={returnsData[1]?.value ?? 0}
                    color="var(--chart-5)"
                  />
                  <div className="rounded-lg border border-border bg-accent/40 p-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {kpis.onTimeRate}%
                      </span>{" "}
                      of returned items came back on time.{" "}
                      {kpis.onTimeRate >= 85
                        ? "The community is thriving."
                        : "Consider gentle reminders for upcoming due dates."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>
    </div>
  );
}

/* ----------------------------------------------------------- helper */

function ReturnStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="font-[var(--font-display)] text-xl font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

/* ----------------------------------------------------------- skeleton */

function ReportsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
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
    </div>
  );
}
