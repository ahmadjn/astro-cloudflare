import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    installs: z.string(),
    rating: z.string(),
    developer: z.string(),
    genre: z.string(),
    category: z.string(),
    images: z.array(z.string()),
    url: z.string(),
    reviews: z
      .array(
        z.object({
          userName: z.string(),
          score: z.number(),
          text: z.string(),
          userImage: z.string().optional(),
        }),
      )
      .optional(),
    descriptionHTML: z.string(),
    publishDate: z.date(),
  }),
});

export const collections = {
  posts,
};
