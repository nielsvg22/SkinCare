"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import type {
  FrequencyRule,
  NewProductInput,
  Product,
  ProductCategory,
  RoutinePeriod,
  Unit,
} from "@/lib/types";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { uploadUserImage } from "@/lib/storage/supabase-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductImage } from "@/components/products/product-image";
import { LibraryPickerDialog } from "@/components/products/library-picker-dialog";
import { BarcodeScannerDialog } from "@/components/products/barcode-scanner-dialog";
import { WEEKDAY_LABELS_SHORT } from "@/lib/data/seed";
import { libraryToInput, type LibraryProduct } from "@/lib/data/product-library";
import type { BarcodeLookupResult } from "@/lib/utils/barcode";
import { cn } from "@/lib/utils";

const CATEGORIES: ProductCategory[] = ["Haar", "Lichaam", "Ogen", "Gezicht", "Overig"];
const UNITS: Unit[] = ["ml", "g", "stuks"];

type FrequencyType = FrequencyRule["type"];

interface FormValues {
  name: string;
  brand: string;
  category: ProductCategory;
  volume: string;
  unit: Unit;
  image: string;
  period: RoutinePeriod | "both";
  frequencyType: FrequencyType;
  weekdays: number[];
  timesPerWeek: string;
  instructions: string;
  usageMin: string;
  usageMax: string;
  usageUnit: Unit;
  bottlesUnopened: string;
  openIsOpen: boolean;
  openRemainingPercent: number;
  purchasePrice: string;
  purchaseUrl: string;
  optional: boolean;
  conditionalNote: string;
  shaveOnly: boolean;
  useCustomMoment: boolean;
  customMoment: string;
}

function defaultValues(overrides?: Partial<FormValues>): FormValues {
  return {
    name: "",
    brand: "",
    category: "Overig",
    volume: "",
    unit: "ml",
    image: "",
    period: "morning",
    frequencyType: "daily",
    weekdays: [1, 3, 5, 0],
    timesPerWeek: "3",
    instructions: "",
    usageMin: "",
    usageMax: "",
    usageUnit: "ml",
    bottlesUnopened: "1",
    openIsOpen: true,
    openRemainingPercent: 100,
    purchasePrice: "",
    purchaseUrl: "",
    optional: false,
    conditionalNote: "",
    shaveOnly: false,
    useCustomMoment: false,
    customMoment: "",
    ...overrides,
  };
}

function productToValues(product: Product): FormValues {
  return {
    name: product.name,
    brand: product.brand,
    category: product.category,
    volume: String(product.volume),
    unit: product.unit,
    image: product.image,
    period: product.period,
    frequencyType: product.frequency.type,
    weekdays: product.frequency.type === "specificWeekdays" ? product.frequency.weekdays : [1, 3, 5, 0],
    timesPerWeek: product.frequency.type === "timesPerWeek" ? String(product.frequency.times) : "3",
    instructions: product.instructions,
    usageMin: String(product.usagePerApplication.min),
    usageMax: String(product.usagePerApplication.max),
    usageUnit: product.usagePerApplication.unit,
    bottlesUnopened: String(product.stock.bottlesUnopened),
    openIsOpen: product.stock.openBottle.isOpen,
    openRemainingPercent: product.stock.openBottle.remainingPercent,
    purchasePrice: product.purchasePrice !== undefined ? String(product.purchasePrice) : "",
    purchaseUrl: product.purchaseUrl ?? "",
    optional: !!product.optional,
    conditionalNote: product.conditionalNote ?? "",
    shaveOnly: !!product.shaveOnly,
    useCustomMoment: !!product.customMoment,
    customMoment: product.customMoment ?? "",
  };
}

function buildFrequency(values: FormValues): FrequencyRule {
  switch (values.frequencyType) {
    case "daily":
      return { type: "daily" };
    case "shaveDaysOnly":
      return { type: "shaveDaysOnly" };
    case "timesPerWeek":
      return { type: "timesPerWeek", times: Math.max(1, Number(values.timesPerWeek) || 1) };
    case "specificWeekdays":
      return { type: "specificWeekdays", weekdays: values.weekdays };
    default:
      return { type: "daily" };
  }
}

interface ProductFormProps {
  product?: Product;
  initialCategory?: ProductCategory;
  initialShaveOnly?: boolean;
}

export function ProductForm({ product, initialCategory, initialShaveOnly }: ProductFormProps) {
  const router = useRouter();
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const userId = useStore((s) => s.userId);
  const isEditing = !!product;

  const [values, setValues] = React.useState<FormValues>(() =>
    product
      ? productToValues(product)
      : defaultValues({
          category: initialCategory ?? "Overig",
          shaveOnly: initialShaveOnly ?? false,
          period: initialShaveOnly ? "morning" : "morning",
        })
  );
  const [uploading, setUploading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function applyLibraryItem(item: LibraryProduct) {
    const input = libraryToInput(item);
    setValues((v) => ({
      ...v,
      name: input.name ?? v.name,
      brand: input.brand ?? v.brand,
      category: input.category ?? v.category,
      volume: input.volume !== undefined ? String(input.volume) : v.volume,
      unit: input.unit ?? v.unit,
      period: input.period ?? v.period,
      frequencyType: input.frequency?.type ?? v.frequencyType,
      weekdays: input.frequency?.type === "specificWeekdays" ? input.frequency.weekdays : v.weekdays,
      timesPerWeek: input.frequency?.type === "timesPerWeek" ? String(input.frequency.times) : v.timesPerWeek,
      instructions: input.instructions ?? v.instructions,
      usageMin: input.usagePerApplication ? String(input.usagePerApplication.min) : v.usageMin,
      usageMax: input.usagePerApplication ? String(input.usagePerApplication.max) : v.usageMax,
      usageUnit: input.usagePerApplication?.unit ?? v.usageUnit,
    }));
    toast.success("Velden ingevuld vanuit de bibliotheek");
  }

  function applyBarcodeResult(result: BarcodeLookupResult) {
    setValues((v) => ({
      ...v,
      name: result.name || v.name,
      brand: result.brand || v.brand,
    }));
    toast.success("Product gevonden — controleer en vul de overige velden aan");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const url = await uploadUserImage(createClient(), userId, file);
      set("image", url);
    } catch {
      toast.error("Afbeelding uploaden is mislukt");
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Productnaam is verplicht";
    if (!values.brand.trim()) next.brand = "Merk is verplicht";
    if (!values.volume || Number(values.volume) <= 0) next.volume = "Vul een geldige inhoud in";
    if (!values.usageMin || !values.usageMax || Number(values.usageMin) > Number(values.usageMax)) {
      next.usage = "Vul een geldig min/max verbruik in";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Controleer de gemarkeerde velden");
      return;
    }

    const input: NewProductInput = {
      name: values.name.trim(),
      brand: values.brand.trim(),
      category: values.category,
      volume: Number(values.volume),
      unit: values.unit,
      image: values.image,
      period: values.period,
      frequency: buildFrequency(values),
      instructions: values.instructions.trim(),
      usagePerApplication: {
        min: Number(values.usageMin),
        max: Number(values.usageMax),
        unit: values.usageUnit,
      },
      stock: {
        bottlesUnopened: Math.max(0, Number(values.bottlesUnopened) || 0),
        openBottle: {
          isOpen: values.openIsOpen,
          remainingPercent: values.openIsOpen ? values.openRemainingPercent : 0,
        },
      },
      purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined,
      purchaseUrl: values.purchaseUrl.trim() || undefined,
      optional: values.optional,
      conditionalNote: values.optional && values.conditionalNote ? values.conditionalNote : undefined,
      shaveOnly: values.shaveOnly,
      customMoment: values.useCustomMoment && values.customMoment.trim() ? values.customMoment.trim() : undefined,
      paused: product?.paused ?? false,
    };

    if (isEditing && product) {
      updateProduct(product.id, input);
      toast.success("Product bijgewerkt");
    } else {
      addProduct(input);
      toast.success("Product toegevoegd");
    }
    router.push("/products");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-5 pb-10">
      {!isEditing && (
        <section className="flex flex-wrap gap-2">
          <LibraryPickerDialog onPick={applyLibraryItem} />
          <BarcodeScannerDialog onFound={applyBarcodeResult} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground-muted">Basisgegevens</h2>

        <div className="flex items-center gap-4">
          <ProductImage image={values.image} name={values.name || "Product"} category={values.category} className="size-20 shrink-0" />
          <div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button asChild type="button" variant="outline" size="sm">
              <label htmlFor="image-upload" className="cursor-pointer">
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                Foto uploaden
              </label>
            </Button>
            <p className="mt-1.5 text-xs text-foreground-subtle">Optioneel — anders tonen we een nette placeholder.</p>
          </div>
        </div>

        <Field label="Productnaam" error={errors.name}>
          <Input value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Bijv. Boost Shampoo" />
        </Field>

        <Field label="Merk" error={errors.brand}>
          <Input value={values.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Bijv. American Crew" />
        </Field>

        <Field label="Categorie">
          <Select value={values.category} onValueChange={(v) => set("category", v as ProductCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inhoud" error={errors.volume}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={values.volume}
              onChange={(e) => set("volume", e.target.value)}
              placeholder="250"
            />
          </Field>
          <Field label="Eenheid">
            <Select value={values.unit} onValueChange={(v) => set("unit", v as Unit)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground-muted">Voorraad</h2>
        <Field label="Aantal ongeopende flessen/tubes op voorraad">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={values.bottlesUnopened}
            onChange={(e) => set("bottlesUnopened", e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between rounded-radius border border-border p-3">
          <Label htmlFor="open-bottle" className="text-sm">Er is momenteel een fles geopend</Label>
          <Switch id="open-bottle" checked={values.openIsOpen} onCheckedChange={(v) => set("openIsOpen", v)} />
        </div>

        {values.openIsOpen && (
          <Field label={`Resterend in geopende fles: ${values.openRemainingPercent}%`}>
            <Slider
              value={[values.openRemainingPercent]}
              onValueChange={([v]) => set("openRemainingPercent", v)}
              min={0}
              max={100}
              step={5}
            />
          </Field>
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground-muted">Gebruik & routine</h2>

        <div className="flex items-center justify-between rounded-radius border border-border p-3">
          <div>
            <Label htmlFor="custom-moment-toggle" className="text-sm">Eigen routine-moment</Label>
            <p className="text-xs text-foreground-muted">Bijv. &quot;Na het sporten&quot; — i.p.v. ochtend/avond</p>
          </div>
          <Switch
            id="custom-moment-toggle"
            checked={values.useCustomMoment}
            onCheckedChange={(v) => set("useCustomMoment", v)}
          />
        </div>

        {values.useCustomMoment ? (
          <Field label="Naam van het moment">
            <Input
              value={values.customMoment}
              onChange={(e) => set("customMoment", e.target.value)}
              placeholder="Bijv. Na het sporten"
            />
          </Field>
        ) : (
          <Field label="Moment">
            <Select value={values.period} onValueChange={(v) => set("period", v as FormValues["period"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Ochtend</SelectItem>
                <SelectItem value="evening">Avond</SelectItem>
                <SelectItem value="both">Ochtend & avond</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label="Herhaalpatroon">
          <Select
            value={values.frequencyType}
            onValueChange={(v) => set("frequencyType", v as FrequencyType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Iedere dag</SelectItem>
              <SelectItem value="specificWeekdays">Specifieke weekdagen</SelectItem>
              <SelectItem value="shaveDaysOnly">Alleen op scheerdagen</SelectItem>
              <SelectItem value="timesPerWeek">X keer per week</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {values.frequencyType === "specificWeekdays" && (
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS_SHORT.map((label, idx) => {
              const active = values.weekdays.includes(idx);
              return (
                <button
                  type="button"
                  key={label}
                  onClick={() =>
                    set(
                      "weekdays",
                      active ? values.weekdays.filter((d) => d !== idx) : [...values.weekdays, idx]
                    )
                  }
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border-strong text-foreground-muted"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {values.frequencyType === "timesPerWeek" && (
          <Field label="Aantal keer per week">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={14}
              value={values.timesPerWeek}
              onChange={(e) => set("timesPerWeek", e.target.value)}
            />
          </Field>
        )}

        <Field label="Gebruiksaanwijzing">
          <Textarea
            value={values.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            placeholder="Bijv. Kleine hoeveelheid inmasseren en goed uitspoelen."
          />
        </Field>

        <Field label="Geschat verbruik per toepassing" error={errors.usage}>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={values.usageMin}
              onChange={(e) => set("usageMin", e.target.value)}
              placeholder="min"
            />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={values.usageMax}
              onChange={(e) => set("usageMax", e.target.value)}
              placeholder="max"
            />
            <Select value={values.usageUnit} onValueChange={(v) => set("usageUnit", v as Unit)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Field>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground-muted">Extra</h2>

        <div className="flex items-center justify-between rounded-radius border border-border p-3">
          <div>
            <Label htmlFor="optional-toggle" className="text-sm">Optioneel</Label>
            <p className="text-xs text-foreground-muted">Mag per dag worden overgeslagen zonder streak te breken</p>
          </div>
          <Switch id="optional-toggle" checked={values.optional} onCheckedChange={(v) => set("optional", v)} />
        </div>

        {values.optional && (
          <Field label="Toelichting bij optioneel gebruik">
            <Textarea
              value={values.conditionalNote}
              onChange={(e) => set("conditionalNote", e.target.value)}
              placeholder="Bijv. Alleen gebruiken als je huid droog aanvoelt."
            />
          </Field>
        )}

        <div className="flex items-center justify-between rounded-radius border border-border p-3">
          <div>
            <Label htmlFor="shave-only-toggle" className="text-sm">Scheerdag-product</Label>
            <p className="text-xs text-foreground-muted">Verschijnt alleen in de routine op scheerdagen (bijv. aftershave)</p>
          </div>
          <Switch id="shave-only-toggle" checked={values.shaveOnly} onCheckedChange={(v) => set("shaveOnly", v)} />
        </div>

        <Field label="Aankoopprijs (optioneel)">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={values.purchasePrice}
            onChange={(e) => set("purchasePrice", e.target.value)}
            placeholder="€"
          />
        </Field>

        <Field label="Herbevoorraad-link (optioneel)">
          <Input
            type="url"
            value={values.purchaseUrl}
            onChange={(e) => set("purchaseUrl", e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-foreground-subtle">
            Waar je dit product meestal koopt — verschijnt als snelkoppeling bij &quot;bijna op&quot;.
          </p>
        </Field>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/products")}>
          Annuleren
        </Button>
        <Button type="submit" className="flex-1">
          {isEditing ? "Wijzigingen opslaan" : "Product toevoegen"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm text-foreground-muted">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
