"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SortableProductCard } from "@/components/products/sortable-product-card";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { useStore } from "@/lib/store";

export default function ProductsPage() {
  const products = useStore((s) => s.products);
  const reorderProducts = useStore((s) => s.reorderProducts);
  const [tab, setTab] = useState("products");

  const sorted = [...products].sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = sorted.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    ids.splice(newIndex, 0, ids.splice(oldIndex, 1)[0]);
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sorted.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-3">
                    {sorted.map((product) => (
                      <SortableProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
