"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/products/product-card";

export function SortableProductCard({ product }: { product: Product }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative"
    >
      <ProductCard product={product} dragHandleProps={{ ...attributes, ...listeners }} isDragging={isDragging} />
    </div>
  );
}
