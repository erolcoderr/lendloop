"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser, useData } from "@/lib/store";
import { apiGet, apiPatch } from "@/lib/api-client";
import { formatDate, timeAgo } from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/lib/types";

/* ----------------------------------------------------------- motion */

const gridVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};
const cardVar = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/* ----------------------------------------------------------- types */

interface QueueEntry {
  id: string;
  name: string;
  email: string;
  barangay: string;
  city: string;
  avatar: string;
  joinedAt: string;
  verificationSubmittedAt: string | null;
  faceImage: string | null;
  idImage: string | null;
}

type ImageMap = Record<string, {
  faceImage: string | null;
  idImage: string | null;
  submittedAt: string | null;
}>;

/* ============================================================ component */

export default function AdminVerifyView() {
  const user = useCurrentUser();
  const users = useData((s) => s.users);

  const [loading, setLoading] = useState(true);
  const [imageMap, setImageMap] = useState<ImageMap>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);

  // Fetch the verification queue (the ONE endpoint that returns faceImage +
  // idImage) on mount. setState lives inside the .then() callback so it
  // doesn't trip the synchronous-setState-in-effect lint rule.
  useEffect(() => {
    apiGet<{ queue: QueueEntry[] }>("/api/verification")
      .then((res) => {
        const map: ImageMap = {};
        for (const q of res.queue) {
          map[q.id] = {
            faceImage: q.faceImage,
            idImage: q.idImage,
            submittedAt: q.verificationSubmittedAt,
          };
        }
        setImageMap(map);
      })
      .catch(() => {
        // If the fetch fails, the cards will just show the avatar without
        // the face/ID photos — still usable.
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = useMemo(
    () =>
      users
        .filter((u) => u.verificationStatus === "pending")
        .sort((a, b) => {
          const aT = a.verificationSubmittedAt ? +new Date(a.verificationSubmittedAt) : 0;
          const bT = b.verificationSubmittedAt ? +new Date(b.verificationSubmittedAt) : 0;
          return aT - bT;
        }),
    [users],
  );

  const visible = pending.filter((u) => !dismissed.has(u.id));

  async function handleApprove(target: User) {
    setDismissed((prev) => new Set(prev).add(target.id));
    try {
      await apiPatch(`/api/verification/${target.id}`, { action: "approve" });
      toast.success(`Approved ${target.name}. They can now log in.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not approve.");
      setDismissed((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  }

  async function handleReject(target: User, note: string) {
    setDismissed((prev) => new Set(prev).add(target.id));
    try {
      await apiPatch(`/api/verification/${target.id}`, {
        action: "reject",
        note: note.trim() || undefined,
      });
      toast.success(`Rejected ${target.name}.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reject.");
      setDismissed((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Verification Queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review profile pictures, face photos, and IDs from new kapitbahay before they can lend or borrow.
          {visible.length > 0 && (
            <span className="ml-1 font-semibold text-foreground">
              {visible.length} waiting
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No pending verifications"
          description="When a new neighbor registers, they'll appear here for your review before they can log in."
        />
      ) : (
        <motion.div
          variants={gridVar}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          {visible.map((applicant) => {
            const images = imageMap[applicant.id];
            return (
              <motion.div key={applicant.id} variants={cardVar}>
                <VerificationCard
                  applicant={applicant}
                  faceImage={images?.faceImage ?? null}
                  idImage={images?.idImage ?? null}
                  submittedAt={images?.submittedAt ?? null}
                  onApprove={() => handleApprove(applicant)}
                  onReject={() => setRejectTarget(applicant)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Reject dialog */}
      <RejectDialog
        target={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(note) => {
          if (rejectTarget) handleReject(rejectTarget, note);
          setRejectTarget(null);
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------- verification card */

function VerificationCard({
  applicant,
  faceImage,
  idImage,
  submittedAt,
  onApprove,
  onReject,
}: {
  applicant: User;
  faceImage: string | null;
  idImage: string | null;
  submittedAt: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [approving, setApproving] = useState(false);

  const handleApproveClick = async () => {
    setApproving(true);
    try {
      await Promise.resolve(onApprove());
    } finally {
      setApproving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row: avatar + name + email + location + submitted-at */}
        <div className="flex items-start gap-3 border-b border-border bg-card/60 p-4">
          <Avatar user={applicant} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-[var(--font-display)] text-base font-bold tracking-tight text-foreground">
                {applicant.name}
              </h2>
              <Badge className="border-transparent bg-amber-100 font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <Clock className="mr-1 h-3 w-3" /> Pending
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" /> {applicant.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {applicant.barangay}, {applicant.city}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              Submitted {submittedAt ? `${formatDate(submittedAt)} · ${timeAgo(submittedAt)}` : "just now"}
            </p>
          </div>
        </div>

        {/* Image previews: profile picture (large) + face + ID */}
        <div className="space-y-3 p-4">
          {/* Profile picture */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Profile picture
            </p>
            <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-3">
              <img
                src={applicant.avatar}
                alt={`${applicant.name}'s profile picture`}
                className="h-28 w-28 rounded-full object-cover ring-4 ring-card"
              />
            </div>
          </div>

          {/* Face + ID side by side */}
          <div className="grid grid-cols-2 gap-3">
            <PhotoPreview
              label="Face photo"
              icon={UserCircle2}
              src={faceImage}
            />
            <PhotoPreview
              label="ID photo"
              icon={IdCard}
              src={idImage}
            />
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-col gap-2 border-t border-border bg-muted/30 p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
          >
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button
            type="button"
            onClick={handleApproveClick}
            disabled={approving}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Approving…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------- photo preview */

function PhotoPreview({
  label,
  icon: Icon,
  src,
}: {
  label: string;
  icon: typeof UserCircle2;
  src: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <Icon className="h-8 w-8" />
            <span className="text-[10px]">Loading…</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- reject dialog */

function RejectDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: User | null;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject verification</DialogTitle>
          <DialogDescription>
            {target?.name} will be notified. They can re-register with different photos.
          </DialogDescription>
        </DialogHeader>
        <RejectForm key={target?.id ?? "none"} onConfirm={onConfirm} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function RejectForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="reject-note">
          Rejection note <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="reject-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Photos are blurry — please re-register with clearer pictures."
          rows={3}
          maxLength={300}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => onConfirm(note)}
        >
          <XCircle className="h-4 w-4" /> Reject
        </Button>
      </div>
    </div>
  );
}
