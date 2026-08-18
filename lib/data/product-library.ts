import type { FrequencyRule, NewProductInput, ProductCategory, RoutinePeriod, Unit } from "@/lib/types";

/**
 * Curated catalogue of common personal care products, searchable when adding
 * a new product so users don't have to fill in every field from scratch.
 * Purely local data — no network call, works offline.
 */
export interface LibraryProduct {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  volume: number;
  unit: Unit;
  period: RoutinePeriod | "both";
  frequency: FrequencyRule;
  instructions: string;
  usageMin: number;
  usageMax: number;
  usageUnit: Unit;
}

export const PRODUCT_LIBRARY: LibraryProduct[] = [
  { id: "lib-head-shoulders-classic", name: "Classic Clean Shampoo", brand: "Head & Shoulders", category: "Haar", volume: 285, unit: "ml", period: "morning", frequency: { type: "daily" }, instructions: "Inmasseren in nat haar, laten intrekken en uitspoelen.", usageMin: 3, usageMax: 5, usageUnit: "ml" },
  { id: "lib-nizoral", name: "Anti-roos Shampoo", brand: "Nizoral", category: "Haar", volume: 200, unit: "ml", period: "morning", frequency: { type: "timesPerWeek", times: 2 }, instructions: "Inmasseren, 3-5 minuten laten intrekken en uitspoelen.", usageMin: 3, usageMax: 5, usageUnit: "ml" },
  { id: "lib-americancrew-forming", name: "Forming Cream", brand: "American Crew", category: "Haar", volume: 85, unit: "g", period: "morning", frequency: { type: "daily" }, instructions: "Kleine hoeveelheid tussen handen verwarmen en door droog haar werken.", usageMin: 1, usageMax: 2, usageUnit: "g" },
  { id: "lib-reuzel-clay", name: "Matte Clay", brand: "Reuzel", category: "Haar", volume: 113, unit: "g", period: "morning", frequency: { type: "daily" }, instructions: "Kleine hoeveelheid opwarmen en door droog haar stylen.", usageMin: 1, usageMax: 2, usageUnit: "g" },
  { id: "lib-loreal-elvive", name: "Elvive Conditioner", brand: "L'Oréal Paris", category: "Haar", volume: 300, unit: "ml", period: "morning", frequency: { type: "specificWeekdays", weekdays: [1, 3, 5] }, instructions: "Aanbrengen in de lengtes, 2 minuten laten intrekken en uitspoelen.", usageMin: 4, usageMax: 6, usageUnit: "ml" },
  { id: "lib-cerave-cleanser", name: "Hydrating Facial Cleanser", brand: "CeraVe", category: "Gezicht", volume: 236, unit: "ml", period: "both", frequency: { type: "daily" }, instructions: "Op vochtig gezicht masseren en afspoelen met lauw water.", usageMin: 1, usageMax: 2, usageUnit: "ml" },
  { id: "lib-cerave-moisturizer", name: "Moisturizing Lotion", brand: "CeraVe", category: "Gezicht", volume: 236, unit: "ml", period: "both", frequency: { type: "daily" }, instructions: "Dun laagje aanbrengen op schoon gezicht.", usageMin: 1, usageMax: 2, usageUnit: "ml" },
  { id: "lib-nivea-men", name: "Sensitive Post Shave Balm", brand: "Nivea Men", category: "Gezicht", volume: 100, unit: "ml", period: "morning", frequency: { type: "shaveDaysOnly" }, instructions: "Na het scheren aanbrengen op schone huid.", usageMin: 2, usageMax: 3, usageUnit: "ml" },
  { id: "lib-lamer-eye", name: "The Eye Concentrate", brand: "La Mer", category: "Ogen", volume: 15, unit: "ml", period: "morning", frequency: { type: "daily" }, instructions: "Klein beetje onder de ogen inkloppen met ringvinger.", usageMin: 0.2, usageMax: 0.4, usageUnit: "ml" },
  { id: "lib-kiehls-eye", name: "Creamy Eye Treatment", brand: "Kiehl's", category: "Ogen", volume: 14, unit: "ml", period: "evening", frequency: { type: "daily" }, instructions: "Voorzichtig aanbrengen rond de oogcontour.", usageMin: 0.2, usageMax: 0.4, usageUnit: "ml" },
  { id: "lib-dove-bodywash", name: "Men+Care Bodywash", brand: "Dove", category: "Lichaam", volume: 400, unit: "ml", period: "morning", frequency: { type: "daily" }, instructions: "Opschuimen onder de douche en afspoelen.", usageMin: 5, usageMax: 8, usageUnit: "ml" },
  { id: "lib-nivea-deo", name: "Men Deep Deodorant", brand: "Nivea", category: "Lichaam", volume: 50, unit: "ml", period: "morning", frequency: { type: "daily" }, instructions: "Aanbrengen op schone, droge oksels.", usageMin: 1, usageMax: 1, usageUnit: "stuks" },
  { id: "lib-vaseline-lotion", name: "Intensive Care Lotion", brand: "Vaseline", category: "Lichaam", volume: 400, unit: "ml", period: "evening", frequency: { type: "timesPerWeek", times: 4 }, instructions: "Inmasseren op droge huid na het douchen.", usageMin: 5, usageMax: 10, usageUnit: "ml" },
  { id: "lib-listerine", name: "Cool Mint Mondwater", brand: "Listerine", category: "Overig", volume: 500, unit: "ml", period: "both", frequency: { type: "daily" }, instructions: "20 ml gedurende 30 seconden spoelen.", usageMin: 20, usageMax: 20, usageUnit: "ml" },
  { id: "lib-oralb", name: "Elektrische Tandenborstel Opzetstukjes", brand: "Oral-B", category: "Overig", volume: 1, unit: "stuks", period: "both", frequency: { type: "daily" }, instructions: "2 minuten poetsen, ochtend en avond.", usageMin: 1, usageMax: 1, usageUnit: "stuks" },
];

export function libraryToInput(item: LibraryProduct): Partial<NewProductInput> {
  return {
    name: item.name,
    brand: item.brand,
    category: item.category,
    volume: item.volume,
    unit: item.unit,
    period: item.period,
    frequency: item.frequency,
    instructions: item.instructions,
    usagePerApplication: { min: item.usageMin, max: item.usageMax, unit: item.usageUnit },
  };
}
