"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { useStore } from "@/lib/store";

export default function ProductsPage() {
  const products = useStore((s) => s.products);
  const reorderProducts = useStore((s) => s.reorderProducts);
  const [tab, setTab] = useState("products");

  const sorted = [...products].sort((a, b) => a.order - b.order);

  function move(id: string, direction: -1 | 1) {
    const ids = sorted.map((p) => p.id);
    const idx = ids.indexOf(id);
    const target = idx + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    reorderProducts(ids);
  }

  return (
    <div className="flex flex-col pb-6">
      <PageHeader
        title="Producten"
        subtitle="Je routine en voorraad"
        action={
          tab === "products" && (
            <Button asChild size="icon">
              <Link href="/products/new" aria-label="Nieuw product">
                <Plus className="size-5" />
              </Link>
            </Button>
          )
        }
      />

      <div className="px-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="products" className="flex-1">Producten</TabsTrigger>
            <TabsTrigger value="shopping" className="flex-1">Boodschappen</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-radius-lg border border-dashed border-border-strong py-12 text-center">
                <Package className="size-8 text-foreground-subtle" strokeWidth={1.5} />
                <p className="text-sm text-foreground-muted">Nog geen producten toegevoegd</p>
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link href="/products/new">
                    <Plus className="size-3.5" />
                    Product toevoegen
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sorted.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFirst={idx === 0}
                    isLast={idx === sorted.length - 1}
                    onMoveUp={() => move(product.id, -1)}
                    onMoveDown={() => move(product.id, 1)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shopping">
            <ShoppingList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
