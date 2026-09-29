"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/lib/store";
import { apiPost } from "@/lib/api-client";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REPORT_TYPES = [
  { value: "item", label: "Item issue (damaged, misleading, unsafe)" },
  { value: "user", label: "User behavior (harassment, no-show, dishonesty)" },
  { value: "transaction", label: "Borrow transaction problem (dates, deposit, return)" },
  { value: "platform", label: "Platform / app bug or suggestion" },
  { value: "other", label: "Other concern" },
];

export default function ReportView() {
  const navigate = useRouter((s) => s.navigate);
  const [type, setType] = useState("item");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in the subject and description.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/reports", {
        type,
        subject: subject.trim(),
        description: description.trim(),
      });
      toast.success("Report submitted. The admin will review it shortly.");
      navigate("dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit your report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={() => navigate("dashboard")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Flag className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
            Report a concern
          </h1>
          <p className="text-sm text-muted-foreground">
            Let the barangay admin know about any issue — we take every report seriously.
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-border bg-card p-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="report-type">What are you reporting?</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="report-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="report-subject">Subject</Label>
          <Input
            id="report-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of the issue"
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="report-desc">Description</Label>
          <Textarea
            id="report-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us what happened. Include names, item titles, dates, or any details that will help the admin investigate."
            rows={6}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/2000 characters
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("dashboard")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit report
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
