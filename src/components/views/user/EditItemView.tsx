"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { actions, useCurrentUser, useRouter, useData } from "@/lib/store";
import type { Item, ItemCategory, ItemCondition } from "@/lib/types";
import { ALL_CATEGORIES, CATEGORY_META } from "@/components/shared/CategoryArt";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

/** Compress an image to max 800px, JPEG 0.7 quality. */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => reject(new Error("Could not process that image."));
    img.src = dataUrl;
  });
}

export default function EditItemView() {
  const user = useCurrentUser();
  const navigate = useRouter((s) => s.navigate);
  const itemId = useRouter((s) => s.params.itemId);
  const items = useData((s) => s.items);

  const item = items.find((it) => it.id === itemId);
  const valid = !!item && !!user && item.ownerId === user.id;

  useEffect(() => {
    if (!valid) {
      toast.error("We couldn't find that item, or you can't edit it.");
      navigate("dashboard");
    }
  }, [valid, navigate]);

  if (!user || !item || !valid) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return (
    <EditItemForm
      key={item.id}
      item={item}
      onUpdate={async (patch) => {
        try {
          await actions.updateItem(item.id, patch);
          toast.success("Item updated — neighbors will see your changes.");
          navigate("dashboard");
        } catch (e: any) {
          toast.error(e?.message ?? "Could not save your changes.");
        }
      }}
      onDelete={async () => {
        try {
          await actions.deleteItem(item.id);
          toast.success("Item removed from the loop.");
          navigate("dashboard");
        } catch (e: any) {
          toast.error(e?.message ?? "Could not delete the item.");
        }
      }}
      onBack={() => navigate("dashboard")}
    />
  );
}

function EditItemForm({
  item,
  onUpdate,
  onDelete,
  onBack,
}: {
  item: Item;
  onUpdate: (patch: Partial<Item>) => Promise<void>;
  onDelete: () => Promise<void> | void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [condition, setCondition] = useState<ItemCondition>(item.condition);
  const [description, setDescription] = useState(item.description);
  const [maxBorrowDays, setMaxBorrowDays] = useState(item.maxBorrowDays);
  const [deposit, setDeposit] = useState(String(item.deposit));
  const [location, setLocation] = useState(item.location);
  const [images, setImages] = useState<ImagePreview[]>(
    item.images.map((url, i) => ({ url, name: `Photo ${i + 1}` })),
  );
  const [primaryIndex, setPrimaryIndex] = useState(
    Math.min(item.primaryImageIndex, Math.max(0, item.images.length - 1)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

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
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setSubmitting(true);
    await onUpdate({
      title: trimmedTitle,
      category,
      condition,
      description: trimmedDesc,
      maxBorrowDays,
      deposit: depositNum,
      location: trimmedLocation,
      images: images.map((i) => i.url),
      primaryImageIndex: Math.min(primaryIndex, Math.max(0, images.length - 1)),
    });
    setSubmitting(false);
  };

  return (
    <div className="bg-bayanihan-weave min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to dashboard
            </button>
            <h1 className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Edit item
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your listing fresh — update photos, adjust the deposit, or
              pause lending by deleting it.
            </p>
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Field
              id="edit-title"
              label="Title"
              required
              error={touched ? errors.title : null}
            >
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                aria-invalid={!!(touched && errors.title)}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="edit-category" label="Category" required>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ItemCategory)}
                >
                  <SelectTrigger id="edit-category" className="w-full">
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

              <Field id="edit-condition" label="Condition" required>
                <RadioGroup
                  value={condition}
                  onValueChange={(v) => setCondition(v as ItemCondition)}
                  className="grid grid-cols-3 gap-2"
                >
                  {CONDITIONS.map((c) => (
                    <Label
                      key={c}
                      htmlFor={`edit-cond-${c}`}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                        condition === c
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <RadioGroupItem
                        id={`edit-cond-${c}`}
                        value={c}
                        className="sr-only"
                      />
                      {c}
                    </Label>
                  ))}
                </RadioGroup>
              </Field>
            </div>

            <Field
              id="edit-description"
              label="Description"
              required
              error={touched ? errors.description : null}
              hint={`${trimmedDesc.length}/${DESCRIPTION_MIN}+ characters`}
            >
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                aria-invalid={!!(touched && errors.description)}
              />
            </Field>

            <Field
              id="edit-days"
              label="Maximum borrow days"
              hint={`${maxBorrowDays} day${maxBorrowDays === 1 ? "" : "s"}`}
            >
              <Slider
                id="edit-days"
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

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                id="edit-deposit"
                label="Refundable deposit (PHP)"
                required
                error={touched ? errors.deposit : null}
              >
                <Input
                  id="edit-deposit"
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
                id="edit-location"
                label="Pickup location"
                required
                error={touched ? errors.location : null}
              >
                <Input
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-invalid={!!(touched && errors.location)}
                />
              </Field>
            </div>

            <Field
              id="edit-images"
              label="Photos"
              hint={`${images.length}/${MAX_IMAGES} · mark one as the cover photo`}
            >
              {images.length === 0 ? (
                <label
                  htmlFor="edit-images-input"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Click to upload photos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    No photos yet — a clear photo dramatically boosts requests
                  </span>
                  <input
                    id="edit-images-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((img, i) => (
                    <div
                      key={img.url + i}
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
                          name="edit-primary-image"
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
                      htmlFor="edit-images-input"
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[11px] font-medium">Add more</span>
                      <input
                        id="edit-images-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>
              )}
            </Field>

            <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete this item
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete &ldquo;{item.title}&rdquo;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the item from the loop. Active
                      requests on it will stay in your dashboard so you can
                      follow up. This can&rsquo;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={onDelete}
                    >
                      Delete item
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
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
