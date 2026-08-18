"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = useStore((s) => s.products.find((p) => p.id === id));

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
        <p className="text-foreground-muted">Dit product bestaat niet (meer).</p>
        <Button asChild variant="outline">
          <Link href="/products">Terug naar producten</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-6">
      <PageHeader title={product.name} subtitle="Product bewerken" />
      <ProductForm product={product} />
    </div>
  );
}
