"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/components/products/product-form";
import type { ProductCategory } from "@/lib/types";

export default function NewProductPage() {
  const searchParams = useSearchParams();
  const shaveOnly = searchParams.get("shaveOnly") === "1";
  const category = (searchParams.get("category") as ProductCategory | null) ?? (shaveOnly ? "Gezicht" : undefined);

  return (
    <div className="flex flex-col pb-6">
      <PageHeader title="Nieuw product" subtitle="Voeg een product toe aan je routine of voorraad" />
      <ProductForm initialCategory={category ?? undefined} initialShaveOnly={shaveOnly} />
    </div>
  );
}
