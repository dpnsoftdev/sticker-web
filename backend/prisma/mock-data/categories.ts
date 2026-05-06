/**
 * Mock categories for sticker shop (5 items).
 * Used by seed-mock.ts to populate the database.
 */

export interface MockCategory {
  name: string;
  slug: string;
  description: string | null;
  images: string[];
}

export const mockCategories: MockCategory[] = [
  {
    name: "Cute Animals",
    slug: "cute-animals",
    description: "Stickers featuring kawaii animals: cats, bunnies, bears, and more.",
    images: [],
  },
  {
    name: "Kawaii Food & Drinks",
    slug: "kawaii-food-drinks",
    description: "Adorable food and drink stickers for planners and laptops.",
    images: [],
  },
  {
    name: "Anime & Characters",
    slug: "anime-characters",
    description: "Anime-style characters, chibi, and fan-art stickers.",
    images: [],
  },
  {
    name: "Emoji & Expressions",
    slug: "emoji-expressions",
    description: "Fun faces, emotions, and reaction stickers.",
    images: [],
  },
  {
    name: "Decorative & Aesthetic",
    slug: "decorative-aesthetic",
    description: "Minimalist and aesthetic stickers for journals and devices.",
    images: [],
  },
];
