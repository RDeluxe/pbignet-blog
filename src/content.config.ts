import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tag: z.enum(['Essay', 'Note']),
    readTime: z.number(),
  }),
})

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tag: z.enum(['Guide']),
    chapters: z.string(),
  }),
})

export const collections = { writing, guides }
