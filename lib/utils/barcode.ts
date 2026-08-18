import type { NewProductInput } from "@/lib/types";

interface OpenBeautyFactsProduct {
  product_name?: string;
  brands?: string;
  image_url?: string;
  quantity?: string;
}

export interface BarcodeLookupResult {
  name: string;
  brand: string;
  image?: string;
}

/**
 * Looks up a barcode via Open Beauty Facts — a free, keyless public database
 * for cosmetics/personal-care products (sister project of Open Food Facts).
 * Returns null when the code isn't in the database rather than throwing, so
 * callers can fall back to manual entry.
 */
export async function lookupBarcode(code: string): Promise<BarcodeLookupResult | null> {
  const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const product: OpenBeautyFactsProduct = data.product;
  if (!product.product_name) return null;

  return {
    name: product.product_name,
    brand: product.brands?.split(",")[0]?.trim() ?? "",
    image: product.image_url,
  };
}

export function barcodeResultToInput(result: BarcodeLookupResult): Partial<NewProductInput> {
  return {
    name: result.name,
    brand: result.brand,
  };
}
