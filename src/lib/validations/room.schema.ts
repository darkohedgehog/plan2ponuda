import { z } from "zod";

export const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  areaSquareMeters: z.number().positive().optional(),
});

export type RoomInput = z.infer<typeof roomSchema>;
