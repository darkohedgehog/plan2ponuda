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

export type RoomReviewItem = Pick<
  Room,
  "confidence" | "estimatedAreaM2" | "id" | "name" | "type"
> & {
  suggestion: RoomSuggestionReviewItem;
};

export type RoomSuggestionReviewItem = {
  id?: string;
  suggestedSockets: number;
  suggestedSwitches: number;
  suggestedLights: number;
  userSockets?: number;
  userSwitches?: number;
  userLights?: number;
  resolvedSockets: number;
  resolvedSwitches: number;
  resolvedLights: number;
};

export type RoomErrorCode =
  | "invalid_input"
  | "invalid_room_reference"
  | "not_found"
  | "server_error";

export type RoomError = {
  code: RoomErrorCode;
  message: string;
};

export type SaveProjectRoomsResponse =
  | {
      ok: true;
      rooms: RoomReviewItem[];
    }
  | {
      ok: false;
      error: RoomError;
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
