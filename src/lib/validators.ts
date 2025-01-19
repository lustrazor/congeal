import { z } from 'zod'

export const GroupSchema = z.object({
  name: z.string().min(1).max(100),
  iconName: z.string().optional(),
  iconColor: z.string().optional(),
  isDivider: z.boolean().optional(),
  viewMode: z.enum(['grid', 'list']).optional()
})

export type GroupInput = z.infer<typeof GroupSchema> 