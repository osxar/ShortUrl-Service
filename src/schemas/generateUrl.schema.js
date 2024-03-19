import { z } from 'zod';

export const GenerateUrlSchema = z.object({
    body: z.object({
        url: z.string()
    }),
    params: z.any(),
    query: z.any(),
});
