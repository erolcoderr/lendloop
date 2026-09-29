"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { actions, useCurrentUser, useRouter } from "@/lib/store";
import type { ItemCategory, ItemCondition } from "@/lib/types";
import { ALL_CATEGORIES, CATEGORY_META } from "@/components/shared/CategoryArt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CONDITIONS: ItemCondition[] = ["Like New", "Good", "Fair"];
const MAX_IMAGES = 6;
const DESCRIPTION_MIN = 20;

interface ImagePreview {
  url: string;
  name: string;
}

/** Read a File as a base64 data URL. */
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an image to max 800px, JPEG 0.7 quality — keeps the base64
 * payload small so it persists in the database and loads fast for all users.
 */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => reject(new Error("Could not process that image."));
    img.src = dataUrl;
  });
}

export default function AddItemView() {
  const user = useCurrentUser();
  const navigate = useRouter((s) => s.navigate);
  const back = useRouter((s) => s.back);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Tools");
  const [condition, setCondition] = useState<ItemCondition>("Good");
  const [description, setDescription] = useState("");
  const [maxBorrowDays, setMaxBorrowDays] = useState(3);
  const [deposit, setDeposit] = useState("500");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  if (!user) return null;

  const depositNum = Number(deposit) || 0;
  const trimmedDesc = description.trim();
  const trimmedTitle = title.trim();
  const trimmedLocation = location.trim();

  const errors = {
    title: !trimmedTitle ? "Give your item a short, recognizable name." : null,
    description:
      trimmedDesc.length < DESCRIPTION_MIN
        ? `Add at least ${DESCRIPTION_MIN} characters so neighbors know what to expect.`
        : null,
    deposit: depositNum < 0 ? "Deposit can't be negative." : null,
    location: !trimmedLocation ? "Where can it be picked up?" : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.info(`You can add up to ${MAX_IMAGES} photos.`);
      e.target.value = "";
      return;
    }
    const toAdd: ImagePreview[] = [];
    for (const f of files.slice(0, remaining)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`"${f.name}" is not an image file.`);
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`"${f.name}" is too large. Use a photo under 5MB.`);
        continue;
      }
      try {
        const dataUrl = await compressImage(f);
        toAdd.push({ url: dataUrl, name: f.name });
      } catch {
        toast.error(`Could not read "${f.name}".`);
      }
    }
    if (toAdd.length === 0) {
      e.target.value = "";
      return;
    }
    setImages((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPrimaryIndex((prev) => {
      if (prev === i) return 0;
      if (prev > i) return prev - 1;
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await actions.createItem({
        title: trimmedTitle,
        description: trimmedDesc,
        category,
        condition,
        images: images.map((i) => i.url),
        primaryImageIndex: Math.min(primaryIndex, Math.max(0, images.length - 1)),
        maxBorrowDays,
        deposit: depositNum,
        location: trimmedLocation,
      });
      toast.success("Your item is live in the loop!");
      navigate("dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not publish your item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-bayanihan-weave min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mb-6">
          <button
            onClick={() => back()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <h1 className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Lend a new item
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            List once, lend many times. A clear title and honest photos mean
            fewer questions and smoother handoffs.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Title */}
            <Field
              id="item-title"
              label="Title"
              required
              error={touched ? errors.title : null}
              hint="e.g. Cordless Power Drill, 18V"
            >
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you lending?"
                aria-invalid={!!(touched && errors.title)}
                maxLength={80}
              />
            </Field>

            {/* Category + Condition */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="item-category" label="Category" required>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ItemCategory)}
                >
                  <SelectTrigger id="item-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map((c) => {
                      const Meta = CATEGORY_META[c].icon;
                      return (
                        <SelectItem key={c} value={c}>
                          <Meta className="h-4 w-4" />
                          {c}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="item-condition" label="Condition" required>
                <RadioGroup
                  value={condition}
                  onValueChange={(v) => setCondition(v as ItemCondition)}
                  className="grid grid-cols-3 gap-2"
                >
                  {CONDITIONS.map((c) => (
                    <Label
                      key={c}
                      htmlFor={`cond-${c}`}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                        condition === c
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <RadioGroupItem
                        id={`cond-${c}`}
                        value={c}
                        className="sr-only"
                      />
                      {c}
                    </Label>
                  ))}
                </RadioGroup>
              </Field>
            </div>

            {/* Description */}
            <Field
              id="item-description"
              label="Description"
              required
              error={touched ? errors.description : null}
              hint={`${trimmedDesc.length}/${DESCRIPTION_MIN}+ characters`}
            >
              <Textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's included? Any quirks neighbors should know about? Be honest — it builds trust."
                rows={4}
                aria-invalid={!!(touched && errors.description)}
              />
            </Field>

            {/* Max borrow days */}
            <Field
              id="item-days"
              label="Maximum borrow days"
              hint={`${maxBorrowDays} day${maxBorrowDays === 1 ? "" : "s"}`}
            >
              <Slider
                id="item-days"
                value={[maxBorrowDays]}
                min={1}
                max={30}
                step={1}
                onValueChange={(v) => setMaxBorrowDays(v[0] ?? 1)}
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>1 day</span>
                <span>30 days</span>
              </div>
            </Field>

            {/* Deposit + Location */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                id="item-deposit"
                label="Refundable deposit (PHP)"
                required
                error={touched ? errors.deposit : null}
                hint="Returned when the item comes back in good shape"
              >
                <Input
                  id="item-deposit"
                  type="number"
                  min={0}
                  step={50}
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  inputMode="numeric"
                  aria-invalid={!!(touched && errors.deposit)}
                />
              </Field>

              <Field
                id="item-location"
                label="Pickup location"
                required
                error={touched ? errors.location : null}
                hint="Street or landmark is enough"
              >
                <Input
                  id="item-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 8 Mabini St, Quezon City"
                  aria-invalid={!!(touched && errors.location)}
                />
              </Field>
            </div>

            {/* Images */}
            <Field
              id="item-images"
              label="Photos"
              hint={`${images.length}/${MAX_IMAGES} · mark one as the cover photo`}
            >
              {images.length === 0 ? (
                <label
                  htmlFor="item-images-input"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Click to upload photos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG or JPG · up to {MAX_IMAGES} photos · the first photo
                    will be the cover
                  </span>
                  <input
                    id="item-images-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((img, i) => (
                      <div
                        key={img.url}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                          i === primaryIndex
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border",
                        )}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-destructive hover:text-white"
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <label
                          className="absolute inset-x-1.5 bottom-1.5 flex cursor-pointer items-center justify-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium shadow-sm"
                          title="Set as cover photo"
                        >
                          <input
                            type="radio"
                            name="primary-image"
                            className="sr-only"
                            checked={i === primaryIndex}
                            onChange={() => setPrimaryIndex(i)}
                          />
                          <Star
                            className={cn(
                              "h-3 w-3",
                              i === primaryIndex
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground",
                            )}
                          />
                          {i === primaryIndex ? "Cover" : "Set cover"}
                        </label>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <label
                        htmlFor="item-images-input"
                        className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-[11px] font-medium">
                          Add more
                        </span>
                        <input
                          id="item-images-input"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </Field>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
                  </>
                ) : (
                  "Publish item"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
