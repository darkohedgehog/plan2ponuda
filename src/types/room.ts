export type RoomType =
  | "living_room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "hallway"
  | "office"
  | "unknown";

export type Room = {
  id: string;
  projectId: string;
  name: string;
  type: RoomType;
  estimatedAreaM2?: number;
  confidence?: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomSuggestion = {
  id: string;
  roomId: string;
  suggestedSockets: number;
  suggestedSwitches: number;
  suggestedLights: number;
  userSockets?: number;
  userSwitches?: number;
  userLights?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};
