"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Handshake,
  Loader2,
  MapPin,
  PartyPopper,
  PhilippinePeso,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { actions, useCurrentUser, useData, useRouter } from "@/lib/store";
import type { BorrowRequest, Item, User } from "@/lib/types";
import {
  dateRangeToDays,
  formatDate,
  formatPeso,
} from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { SmartImage } from "@/components/shared/SmartImage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------- types */

type Step = 1 | 2 | 3;

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

const MESSAGE_MAX = 500;

/* ============================================================ BorrowFlowView */

export default function BorrowFlowView() {
  const navigate = useRouter((s) => s.navigate);
  const back = useRouter((s) => s.back);
  const itemId = useRouter((s) => s.params.itemId);
  const user = useCurrentUser();
  const items = useData((s) => s.items);
  const users = useData((s) => s.users);

  const item = useMemo(
    () => items.find((it) => it.id === itemId),
    [items, itemId],
  );
  const owner = useMemo(
    () => (item ? users.find((u) => u.id === item.ownerId) : undefined),
    [item, users],
  );

  const itemMissing = !item || !owner;
  const isOwner = !!(user && item && user.id === item.ownerId);

  // Redirect on invalid state. AppShell handles the !user case (auth-gating),
  // so we only toast+navigate when user is logged in but item is missing or
  // the user is the owner.
  useEffect(() => {
    if (!user) return;
    if (itemMissing) {
      toast.error("This item is no longer available to borrow.");
      back();
    } else if (isOwner) {
      toast.error("You can't borrow your own item — but neighbors can!");
      back();
    }
  }, [user, itemMissing, isOwner, back]);

  if (!user || itemMissing || isOwner || !item || !owner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground sm:px-6 lg:px-8">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm">Redirecting…</p>
      </div>
    );
  }

  return (
    <BorrowFlow
      key={item.id}
      item={item}
      owner={owner}
      user={user}
      onBack={() => back()}
      onNavigate={navigate}
    />
  );
}

/* ============================================================ BorrowFlow */

function BorrowFlow({
  item,
  owner,
  user,
  onBack,
  onNavigate,
}: {
  item: Item;
  owner: User;
  user: User;
  onBack: () => void;
  onNavigate: (view: "browse" | "dashboard" | "view-item") => void;
}) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [message, setMessage] = useState("");

  // Step 2 state
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [wantsCopy, setWantsCopy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 3 state
  const [createdRequest, setCreatedRequest] = useState<BorrowRequest | null>(null);

  // Derived validation
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const bookedDateObjs = item.bookedDates
    .map((s) => new Date(s + "T00:00:00"))
    .filter((d) => !Number.isNaN(d.getTime()));

  const isDateDisabled = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < todayMidnight) return true;
    return bookedDateObjs.some((bd) => {
      const b = new Date(bd);
      b.setHours(0, 0, 0, 0);
      return b.getTime() === d.getTime();
    });
  };

  const datesValid = !!startDate && !!endDate && startDate <= endDate;
  const duration = datesValid ? dateRangeToDays(startDate!, endDate!).length : 0;
  const exceedsMax = datesValid && duration > item.maxBorrowDays;
  const messageValid = message.trim().length > 0;
  const step1Valid = datesValid && !exceedsMax && messageValid;

  const signatureMatches =
    signature.trim().length > 0 &&
    signature.trim().toLowerCase() === user.name.trim().toLowerCase();
  const step2Valid = agreed && signatureMatches;

  const handleSubmit = async () => {
    if (!step2Valid || submitting || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      // Build the agreement text to store with the request.
      const agreementText = `As a LendLoop kapitbahay, I pledge to:
1. Care for the "${item.title}" as if it were my own — no modifications, no misuse, no passing it on to someone else.
2. Return it to ${owner.name} on or before ${formatDate(endDate)}, in the same condition I received it.
3. Honor the ${formatPeso(item.deposit)} refundable deposit, knowing it covers loss or significant damage.
4. Communicate promptly with ${owner.name.split(" ")[0]} about pickup, any concerns during the borrow, and the return.
5. Leave an honest review within 48 hours of returning the item, so the loop keeps getting kinder.

Bayanihan means showing up for each other. My signature confirms I'm in — for a ${duration}-day borrow from ${formatDate(startDate)} to ${formatDate(endDate)}.

Signed: ${signature.trim()}
Date: ${new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`;

      const created = await actions.createRequest({
        itemId: item.id,
        startDate,
        endDate,
        message: message.trim(),
        agreementSigned: true,
        signatureName: signature.trim(),
        agreementText,
        wantsCopy,
      });
      setCreatedRequest(created);
      setStep(3);
      toast.success("Request sent!", {
        description: `${owner.name} will review it shortly. We'll notify you the moment it's approved.`,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-bayanihan-weave min-h-[60vh]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Top: back + title */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to item
        </button>

        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Handshake className="h-3.5 w-3.5" />
            Borrow request
          </span>
          <h1 className="mt-3 font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Borrow &ldquo;{item.title}&rdquo;
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick 3-step flow — pick dates, sign the agreement, and your request goes straight to {owner.name}.
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} className="mt-8" />

        {/* Step body */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              {...fadeUp}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 && (
                <StepRequest
                  item={item}
                  owner={owner}
                  startDate={startDate}
                  endDate={endDate}
                  message={message}
                  isDateDisabled={isDateDisabled}
                  onStartDate={(d) => {
                    setStartDate(d);
                    // If end is before the new start, clear it so the user re-picks.
                    if (endDate && d > endDate) setEndDate(undefined);
                  }}
                  onEndDate={setEndDate}
                  onMessage={setMessage}
                  duration={duration}
                  exceedsMax={exceedsMax}
                  datesValid={datesValid}
                  messageValid={messageValid}
                  onContinue={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <StepAgreement
                  item={item}
                  owner={owner}
                  user={user}
                  startDate={startDate!}
                  endDate={endDate!}
                  duration={duration}
                  agreed={agreed}
                  onAgreed={setAgreed}
                  signature={signature}
                  onSignature={setSignature}
                  signatureMatches={signatureMatches}
                  submitting={submitting}
                  onBack={() => setStep(1)}
                  onSubmit={handleSubmit}
                  wantsCopy={wantsCopy}
                  onWantsCopy={setWantsCopy}
                />
              )}
              {step === 3 && createdRequest && (
                <StepSuccess
                  item={item}
                  owner={owner}
                  request={createdRequest}
                  onGoDashboard={() => onNavigate("dashboard")}
                  onBrowseMore={() => onNavigate("browse")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ StepIndicator */

function StepIndicator({
  step,
  className,
}: {
  step: Step;
  className?: string;
}) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "Request" },
    { n: 2, label: "Agreement" },
    { n: 3, label: "Done" },
  ];
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 sm:gap-4",
        className,
      )}
      aria-label={`Step ${step} of 3`}
    >
      {steps.map((s, i) => {
        const isCurrent = step === s.n;
        const isComplete = step > s.n;
        return (
          <div key={s.n} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCurrent && "border-primary bg-primary text-primary-foreground shadow-sm",
                  isComplete && "border-emerald-500 bg-emerald-500 text-white",
                  !isCurrent && !isComplete && "border-border bg-card text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 sm:w-16",
                  step > s.n ? "bg-emerald-500" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================ StepRequest */

function StepRequest({
  item,
  owner,
  startDate,
  endDate,
  message,
  isDateDisabled,
  onStartDate,
  onEndDate,
  onMessage,
  duration,
  exceedsMax,
  datesValid,
  messageValid,
  onContinue,
}: {
  item: Item;
  owner: User;
  startDate: string | undefined;
  endDate: string | undefined;
  message: string;
  isDateDisabled: (date: Date) => boolean;
  onStartDate: (iso: string) => void;
  onEndDate: (iso: string) => void;
  onMessage: (v: string) => void;
  duration: number;
  exceedsMax: boolean;
  datesValid: boolean;
  messageValid: boolean;
  onContinue: () => void;
}) {
  const charCount = message.length;
  const overLimit = charCount > MESSAGE_MAX;

  return (
    <Card className="gap-6 p-5 sm:p-6">
      {/* Date range */}
      <div className="space-y-3">
        <div>
          <h2 className="font-[var(--font-display)] text-base font-semibold text-foreground">
            When do you need it?
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick a start and end date. Already-booked dates are disabled.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePickerField
            label="Start date"
            value={startDate}
            isDateDisabled={isDateDisabled}
            onChange={onStartDate}
          />
          <DatePickerField
            label="End date"
            value={endDate}
            isDateDisabled={isDateDisabled}
            onChange={onEndDate}
            minDate={startDate}
          />
        </div>
        {exceedsMax && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            That&rsquo;s {duration} days — but {owner.name.split(" ")[0]} lends this item for up to {item.maxBorrowDays} days. Shorten your window and try again.
          </p>
        )}
        {datesValid && !exceedsMax && (
          <p className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {duration} day{duration === 1 ? "" : "s"} — within the {item.maxBorrowDays}-day limit.
          </p>
        )}
      </div>

      <Separator />

      {/* Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="borrow-message" className="text-sm font-semibold text-foreground">
            Message to {owner.name.split(" ")[0]}
          </Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              overLimit ? "text-rose-500" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {charCount}/{MESSAGE_MAX}
          </span>
        </div>
        <Textarea
          id="borrow-message"
          value={message}
          onChange={(e) => onMessage(e.target.value.slice(0, MESSAGE_MAX + 50))}
          placeholder={`Hi ${owner.name.split(" ")[0]}! I'd love to borrow your ${item.title.toLowerCase()} for... I'll pick it up and return it on time. Salamat!`}
          rows={4}
          aria-describedby="borrow-message-help"
          className="resize-none"
        />
        <p id="borrow-message-help" className="text-xs text-muted-foreground">
          Share why you need it and how you&rsquo;ll care for it. A warm message helps your kapitbahay decide.
        </p>
      </div>

      <Separator />

      {/* Live summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Request summary</h3>
        <div className="grid gap-2 rounded-xl border border-border bg-card/50 p-4 text-sm sm:grid-cols-2">
          <SummaryRow
            icon={<CalendarDays className="h-4 w-4 text-primary" />}
            label="Start"
            value={startDate ? formatDate(startDate) : "—"}
          />
          <SummaryRow
            icon={<CalendarDays className="h-4 w-4 text-primary" />}
            label="End"
            value={endDate ? formatDate(endDate) : "—"}
          />
          <SummaryRow
            icon={<Clock className="h-4 w-4 text-primary" />}
            label="Duration"
            value={datesValid ? `${duration} day${duration === 1 ? "" : "s"}` : "—"}
          />
          <SummaryRow
            icon={<PhilippinePeso className="h-4 w-4 text-primary" />}
            label="Refundable deposit"
            value={formatPeso(item.deposit)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          size="lg"
          onClick={onContinue}
          disabled={!datesValid || exceedsMax || !messageValid || overLimit}
        >
          Continue to agreement
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

/* ============================================================ StepAgreement */

function StepAgreement({
  item,
  owner,
  user,
  startDate,
  endDate,
  duration,
  agreed,
  onAgreed,
  signature,
  onSignature,
  signatureMatches,
  submitting,
  onBack,
  onSubmit,
  wantsCopy,
  onWantsCopy,
}: {
  item: Item;
  owner: User;
  user: User;
  startDate: string;
  endDate: string;
  duration: number;
  agreed: boolean;
  onAgreed: (v: boolean) => void;
  signature: string;
  onSignature: (v: string) => void;
  signatureMatches: boolean;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
  wantsCopy: boolean;
  onWantsCopy: (v: boolean) => void;
}) {
  const trimmed = signature.trim();
  const showSignatureError = trimmed.length > 0 && !signatureMatches;

  return (
    <Card className="gap-6 p-5 sm:p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Borrower&rsquo;s Pledge
        </span>
        <h2 className="mt-3 font-[var(--font-display)] text-lg font-semibold text-foreground">
          The bayanihan agreement
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A short, signed promise that keeps the loop trustworthy for everyone.
        </p>
      </div>

      {/* Agreement text */}
      <div className="rounded-xl border border-border bg-card/50 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">As a LendLoop kapitbahay, I pledge to:</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Care for the <strong className="font-semibold text-foreground">{item.title}</strong> as if it were my own — no modifications, no misuse, no passing it on to someone else.
          </li>
          <li>
            Return it to <strong className="font-semibold text-foreground">{owner.name}</strong> on or before <strong className="font-semibold text-foreground">{formatDate(endDate)}</strong>, in the same condition I received it.
          </li>
          <li>
            Honor the <strong className="font-semibold text-foreground">{formatPeso(item.deposit)}</strong> refundable deposit, knowing it covers loss or significant damage.
          </li>
          <li>
            Communicate promptly with <strong className="font-semibold text-foreground">{owner.name.split(" ")[0]}</strong> about pickup, any concerns during the borrow, and the return.
          </li>
          <li>
            Leave an honest review within 48 hours of returning the item, so the loop keeps getting kinder.
          </li>
        </ol>
        <p className="mt-4 border-t border-border pt-3 text-foreground">
          <span className="font-medium">Bayanihan means showing up for each other.</span> My signature below confirms I&rsquo;m in — for a {duration}-day borrow from {formatDate(startDate)} to {formatDate(endDate)}.
        </p>
      </div>

      {/* Agree checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="agreement-agree"
          checked={agreed}
          onCheckedChange={(v) => onAgreed(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="agreement-agree" className="text-sm font-medium text-foreground cursor-pointer">
          I have read and agree to the borrower&rsquo;s pledge above.
        </Label>
      </div>

      {/* Wants copy checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="agreement-copy"
          checked={wantsCopy}
          onCheckedChange={(v) => onWantsCopy(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="agreement-copy" className="text-sm text-muted-foreground cursor-pointer">
          Send me a copy of this agreement — I&apos;ll be able to view it from my dashboard.
        </Label>
      </div>

      <Separator />

      {/* Digital signature */}
      <div className="space-y-2">
        <Label htmlFor="signature" className="text-sm font-semibold text-foreground">
          Digital signature
        </Label>
        <p className="text-xs text-muted-foreground">
          Type your full name exactly as it appears on your account. This counts as your signature.
        </p>
        <div className="rounded-xl border border-border bg-bayanihan-weave p-4">
          <input
            id="signature"
            type="text"
            value={signature}
            onChange={(e) => onSignature(e.target.value)}
            placeholder={user.name}
            aria-describedby="signature-help signature-error"
            aria-invalid={showSignatureError}
            className={cn(
              "w-full bg-transparent font-serif text-xl italic text-foreground outline-none placeholder:text-muted-foreground/50",
            )}
            autoComplete="off"
          />
        </div>
        {showSignatureError ? (
          <p
            id="signature-error"
            role="alert"
            className="text-sm text-rose-600 dark:text-rose-400"
          >
            That doesn&rsquo;t match the name on your account. Type it as: <strong>{user.name}</strong>.
          </p>
        ) : signatureMatches ? (
          <p
            id="signature-help"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            Signed — matches your account name.
          </p>
        ) : (
          <p id="signature-help" className="text-sm text-muted-foreground">
            Your account name: <strong className="text-foreground">{user.name}</strong>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="h-4 w-4" />
          Back to dates
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!agreed || !signatureMatches || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Confirm &amp; send request
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/* ============================================================ StepSuccess */

function StepSuccess({
  item,
  owner,
  request,
  onGoDashboard,
  onBrowseMore,
}: {
  item: Item;
  owner: User;
  request: BorrowRequest;
  onGoDashboard: () => void;
  onBrowseMore: () => void;
}) {
  return (
    <Card className="gap-6 p-6 text-center sm:p-8">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
      >
        <PartyPopper className="h-8 w-8" />
      </motion.div>

      <div className="space-y-1.5">
        <h2 className="font-[var(--font-display)] text-2xl font-bold text-foreground">
          Request sent, {owner.name.split(" ")[0]}&rsquo;s on it!
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Your borrow request is now in {owner.name.split(" ")[0]}&rsquo;s hands. We&rsquo;ll ping you the moment it&rsquo;s approved — usually within a day or two.
        </p>
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-3 text-left">
        <h3 className="text-sm font-semibold text-foreground">Request summary</h3>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <SmartImage
              src={item.images[item.primaryImageIndex]}
              alt={item.title}
              category={item.category}
              seed={item.title.length}
              className="h-full w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 font-semibold text-foreground">{item.title}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {item.location}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Avatar user={owner} size={20} />
              <span className="text-xs text-muted-foreground">{owner.name}</span>
              {owner.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />}
            </div>
          </div>
        </div>

        <div className="grid gap-2 rounded-xl border border-border bg-card/50 p-4 text-sm sm:grid-cols-2">
          <SummaryRow
            icon={<CalendarDays className="h-4 w-4 text-primary" />}
            label="Borrow from"
            value={formatDate(request.startDate)}
          />
          <SummaryRow
            icon={<CalendarDays className="h-4 w-4 text-primary" />}
            label="Return by"
            value={formatDate(request.endDate)}
          />
          <SummaryRow
            icon={<PhilippinePeso className="h-4 w-4 text-primary" />}
            label="Deposit"
            value={formatPeso(item.deposit)}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Status
            </span>
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={onGoDashboard}>
          Go to dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="lg" variant="outline" onClick={onBrowseMore}>
          Browse more items
        </Button>
      </div>
    </Card>
  );
}

/* ============================================================ DatePickerField */

function DatePickerField({
  label,
  value,
  isDateDisabled,
  onChange,
  minDate,
}: {
  label: string;
  value: string | undefined;
  isDateDisabled: (date: Date) => boolean;
  onChange: (iso: string) => void;
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
            aria-label={label}
          >
            <CalendarDays className="h-4 w-4 text-primary" />
            {value ? formatDate(value) : `Pick ${label.toLowerCase()}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              if (!d) return;
              // Don't allow end dates before the chosen start date.
              if (minDate) {
                const min = new Date(minDate + "T00:00:00");
                if (d < min) return;
              }
              onChange(d.toISOString().slice(0, 10));
              setOpen(false);
            }}
            disabled={isDateDisabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ============================================================ SummaryRow */

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
