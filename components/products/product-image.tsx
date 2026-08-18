"use client";

import * as React from "react";
import Image from "next/image";
import { Droplet, Scissors, Sparkles, Sun, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

const CATEGORY_ICON: Record<ProductCategory, React.ElementType> = {
  Haar: Sparkles,
  Lichaam: Droplet,
  Ogen: Sun,
  Gezicht: Sun,
  Overig: PackageSearch,
};

interface ProductImageProps {
  image: string | undefined | null;
  name: string;
  category?: ProductCategory;
  className?: string;
  sizes?: string;
  icon?: React.ElementType;
}

export function ProductImage({ image, name, category, className, sizes, icon }: ProductImageProps) {
  const [errored, setErrored] = React.useState(false);
  const Icon = icon ?? (category ? CATEGORY_ICON[category] : PackageSearch);
  const showPlaceholder = !image || errored;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-radius bg-beige-50",
        className
      )}
    >
      {!showPlaceholder && image && (
        <Image
          src={image}
          alt={name}
          fill
          sizes={sizes ?? "96px"}
          className="object-contain p-2"
          onError={() => setErrored(true)}
          unoptimized={image.startsWith("http")}
        />
      )}
      {showPlaceholder && (
        <div className="flex flex-col items-center justify-center gap-1 text-beige-400">
          <Icon className="size-7" strokeWidth={1.6} />
        </div>
      )}
    </div>
  );
}

export { Scissors };
