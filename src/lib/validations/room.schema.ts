import { z } from "zod";

export const roomTypeSchema = z.enum([
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "hallway",
  "office",
  "unknown",
]);

export const roomSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  type: roomTypeSchema.default("unknown"),
  estimatedAreaM2: z.number().positive().optional(),
  confidence: z.number().min(0).max(1).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const saveProjectRoomSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(100),
  suggestion: z.object({
    userSockets: z.number().int().min(0).nullable().optional(),
    userSwitches: z.number().int().min(0).nullable().optional(),
    userLights: z.number().int().min(0).nullable().optional(),
  }),
  type: roomTypeSchema,
});

export const saveProjectRoomsSchema = z.object({
  rooms: z.array(saveProjectRoomSchema).max(100),
});

export const roomSuggestionSchema = z.object({
  roomId: z.string().min(1),
  suggestedSockets: z.number().int().min(0).default(0),
  suggestedSwitches: z.number().int().min(0).default(0),
  suggestedLights: z.number().int().min(0).default(0),
  userSockets: z.number().int().min(0).optional(),
  userSwitches: z.number().int().min(0).optional(),
  userLights: z.number().int().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type RoomInput = z.infer<typeof roomSchema>;
export type SaveProjectRoomsInput = z.infer<typeof saveProjectRoomsSchema>;
export type RoomSuggestionInput = z.infer<typeof roomSuggestionSchema>;
