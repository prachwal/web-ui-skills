# Content Schema

Patterns for defining and validating content types — from CMS integrations to API responses.

## Zod article schema

```ts
// src/models/article.ts
import { z } from "zod";

const ImageSchema = z.object({
  src:    z.string().url("Image src must be an absolute URL"),
  alt:    z.string().min(1, "Alt text is required for all images"),
  width:  z.number().int().positive(),
  height: z.number().int().positive(),
});

const AuthorSchema = z.object({
  name: z.string().min(1),
  bio:  z.string().max(500).optional(),
  avatar: ImageSchema.optional(),
});

export const ArticleSchema = z.object({
  id:          z.string().uuid(),
  title:       z.string().min(1).max(120),
  slug:        z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, digits, and hyphens"),
  summary:     z.string().min(50).max(300),
  body:        z.string().min(100),
  coverImage:  ImageSchema,
  author:      AuthorSchema,
  tags:        z.array(z.string().min(1)).max(10).default([]),
  publishedAt: z.coerce.date(),
  updatedAt:   z.coerce.date().optional(),
  status:      z.enum(["draft", "published", "archived"]).default("draft"),
  locale:      z.string().min(2).max(10).default("en"),
});

export type Article = z.infer<typeof ArticleSchema>;
```

## Product page schema

```ts
// src/models/product.ts
import { z } from "zod";

export const ProductSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1).max(200),
  slug:        z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(2000),
  price:       z.number().nonnegative(),
  currency:    z.string().length(3),  // ISO 4217
  images: z.array(
    z.object({
      src: z.string().url(),
      alt: z.string().min(1, "Product image alt text is required"),
      isPrimary: z.boolean().default(false),
    })
  ).min(1, "At least one product image is required"),
  category:  z.string().min(1),
  inStock:   z.boolean(),
  sku:       z.string().optional(),
  metadata: z.object({
    title:       z.string().max(120).optional(),
    description: z.string().max(300).optional(),
  }).optional(),
});

export type Product = z.infer<typeof ProductSchema>;
```

## CMS collection response wrapper

```ts
// src/models/collection.ts
import { z, ZodSchema } from "zod";

export function collectionSchema<T>(itemSchema: ZodSchema<T>) {
  return z.object({
    data:  z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page:  z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}

// Usage:
const ArticleListSchema = collectionSchema(ArticleSchema);
type ArticleList = z.infer<typeof ArticleListSchema>;
```

## Navigation / menu schema

```ts
export const NavItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z.object({
    label:    z.string().min(1),
    href:     z.string(),
    external: z.boolean().default(false),
    children: z.array(NavItemSchema).optional(),
  })
);

interface NavItem {
  label: string;
  href: string;
  external: boolean;
  children?: NavItem[];
}
```

## Content model rules

- Require `alt` on every image field — do not make it optional.
- Require `publishedAt` as a real date — use `z.coerce.date()` to handle ISO strings from APIs.
- Use `z.enum()` for status fields; do not allow free-form strings where only known values are valid.
- Use `z.string().min(1)` not just `z.string()` for required text fields to prevent empty strings passing validation.
- Export the TypeScript type alongside the schema so both can be imported independently.
- Keep schemas in `src/models/` — one file per domain entity.
