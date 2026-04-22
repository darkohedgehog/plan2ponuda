import type { RoomType } from "@/types/room";

export type RoomSuggestionCounts = {
  sockets: number;
  switches: number;
  lights: number;
};

export type GeneratedRoomSuggestion = {
  suggestedSockets: number;
  suggestedSwitches: number;
  suggestedLights: number;
};

export type RoomSuggestionOverrides = {
  userSockets?: number;
  userSwitches?: number;
  userLights?: number;
};

export type ResolvedRoomSuggestion = GeneratedRoomSuggestion &
  RoomSuggestionOverrides & {
    resolvedSockets: number;
    resolvedSwitches: number;
    resolvedLights: number;
  };

type RoomRuleInput = {
  estimatedAreaM2?: number;
  type: RoomType;
};

const baseRoomRules: Record<RoomType, RoomSuggestionCounts> = {
  living_room: {
    sockets: 5,
    switches: 2,
    lights: 2,
  },
  bedroom: {
    sockets: 4,
    switches: 1,
    lights: 1,
  },
  kitchen: {
    sockets: 6,
    switches: 2,
    lights: 2,
  },
  bathroom: {
    sockets: 2,
    switches: 1,
    lights: 1,
  },
  hallway: {
    sockets: 1,
    switches: 1,
    lights: 1,
  },
  office: {
    sockets: 5,
    switches: 1,
    lights: 2,
  },
  unknown: {
    sockets: 2,
    switches: 1,
    lights: 1,
  },
};

export function getBaseRoomRule(roomType: RoomType): RoomSuggestionCounts {
  return baseRoomRules[roomType];
}

export function applyAreaAdjustments(
  roomType: RoomType,
  areaM2: number | undefined,
  baseRule: RoomSuggestionCounts,
): RoomSuggestionCounts {
  const adjustedRule = {
    ...baseRule,
  };

  if (areaM2 === undefined) {
    return adjustedRule;
  }

  switch (roomType) {
    case "living_room":
      if (areaM2 > 25) {
        adjustedRule.sockets += 2;
        adjustedRule.lights += 1;
      }
      break;
    case "bedroom":
      if (areaM2 > 18) {
        adjustedRule.sockets += 1;
      }
      break;
    case "kitchen":
      if (areaM2 > 15) {
        adjustedRule.sockets += 2;
      }

      if (areaM2 > 20) {
        adjustedRule.lights += 1;
      }
      break;
    case "bathroom":
      if (areaM2 > 10) {
        adjustedRule.lights += 1;
      }
      break;
    case "office":
      if (areaM2 > 20) {
        adjustedRule.sockets += 2;
        adjustedRule.lights += 1;
      }
      break;
    case "hallway":
      if (areaM2 > 8) {
        adjustedRule.lights += 1;
      }
      break;
    case "unknown":
      break;
  }

  return adjustedRule;
}

export function generateRoomSuggestions(
  room: RoomRuleInput,
): GeneratedRoomSuggestion {
  const adjustedRule = applyAreaAdjustments(
    room.type,
    room.estimatedAreaM2,
    getBaseRoomRule(room.type),
  );

  return {
    suggestedSockets: adjustedRule.sockets,
    suggestedSwitches: adjustedRule.switches,
    suggestedLights: adjustedRule.lights,
  };
}

export function resolveRoomSuggestion(
  generatedSuggestion: GeneratedRoomSuggestion,
  overrides: RoomSuggestionOverrides = {},
): ResolvedRoomSuggestion {
  return {
    ...generatedSuggestion,
    ...overrides,
    resolvedSockets:
      overrides.userSockets ?? generatedSuggestion.suggestedSockets,
    resolvedSwitches:
      overrides.userSwitches ?? generatedSuggestion.suggestedSwitches,
    resolvedLights: overrides.userLights ?? generatedSuggestion.suggestedLights,
  };
}
