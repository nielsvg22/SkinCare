import type { Product } from "@/lib/types";

/**
 * Central product configuration — the single source of truth for the
 * starting product catalogue. Users can edit/add/remove products at
 * runtime through the Producten tab; this seed only powers the very
 * first app load (see lib/store.ts).
 *
 * Weekday numbers follow JS Date#getDay(): 0 = zondag ... 6 = zaterdag.
 */
export const SEED_PRODUCTS: Product[] = [
  {
    id: "boost-shampoo",
    name: "Boost Shampoo",
    brand: "American Crew",
    category: "Haar",
    volume: 250,
    unit: "ml",
    image: "/products/american-crew-boost-shampoo.png",
    period: "morning",
    frequency: { type: "daily" },
    instructions: "Kleine hoeveelheid inmasseren in nat haar en goed uitspoelen.",
    usagePerApplication: { min: 3, max: 5, unit: "ml" },
    stock: {
      bottlesUnopened: 7,
      openBottle: { isOpen: true, remainingPercent: 100 },
    },
    paused: false,
    order: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "daily-conditioner",
    name: "Daily Conditioner",
    brand: "Reuzel",
    category: "Haar",
    volume: 350,
    unit: "ml",
    image: "/products/reuzel-daily-conditioner-350ml.png",
    period: "morning",
    frequency: { type: "specificWeekdays", weekdays: [0, 1, 3, 5] },
    instructions: "Aanbrengen in de lengtes na het shampooën, laten intrekken en uitspoelen.",
    usagePerApplication: { min: 3, max: 5, unit: "ml" },
    stock: {
      bottlesUnopened: 0,
      openBottle: { isOpen: true, remainingPercent: 100 },
    },
    paused: false,
    order: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tea-tree-3in1",
    name: "3-in-1 Tea Tree",
    brand: "American Crew",
    category: "Lichaam",
    volume: 450,
    unit: "ml",
    image: "/products/american-crew-3-in-1-tea-tree.png",
    period: "morning",
    frequency: { type: "daily" },
    instructions: "Gebruiken als bodywash: opschuimen onder de douche en afspoelen.",
    usagePerApplication: { min: 5, max: 8, unit: "ml" },
    stock: {
      bottlesUnopened: 2,
      openBottle: { isOpen: true, remainingPercent: 100 },
    },
    paused: false,
    order: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "eye-repair",
    name: "Eye Repair Cream",
    brand: "CeraVe",
    category: "Ogen",
    volume: 14,
    unit: "ml",
    image: "/products/cerave-eye-repair-cream.png",
    period: "morning",
    frequency: { type: "daily" },
    instructions: "Klein beetje onder ieder oog en voorzichtig inkloppen.",
    usagePerApplication: { min: 0.2, max: 0.5, unit: "ml" },
    stock: {
      bottlesUnopened: 0,
      openBottle: { isOpen: true, remainingPercent: 100 },
    },
    paused: false,
    order: 4,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "face-balm",
    name: "Face Balm SPF 15",
    brand: "American Crew",
    category: "Gezicht",
    volume: 170,
    unit: "ml",
    image: "/products/american-crew-face-balm-spf15.png",
    period: "both",
    frequency: { type: "daily" },
    instructions: "Dun laagje aanbrengen op gezicht en hals.",
    usagePerApplication: { min: 1, max: 2, unit: "ml" },
    stock: {
      bottlesUnopened: 2,
      openBottle: { isOpen: true, remainingPercent: 100 },
    },
    conditionalNote: "Alleen gebruiken als je huid droog of trekkerig aanvoelt.",
    shaveDayNote: "Op scheerdagen: aanbrengen nadat de aftershave is ingetrokken.",
    paused: false,
    order: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];
