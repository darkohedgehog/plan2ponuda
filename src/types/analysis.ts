import type { Room } from "@/types/room";

export type ElectricalSuggestion = {
  id: string;
  roomId: string;
  label: string;
  quantity: number;
};

export type Analysis = {
  projectId: string;
  rooms: Room[];
  suggestions: ElectricalSuggestion[];
};
