import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { getOpenAiClient, type AiProvider } from "@/lib/ai/client";
import { roomTypeSchema } from "@/lib/validations/room.schema";
import type { RoomType } from "@/types/room";

type FloorPlanFileInput = {
  bytes: Buffer;
  fileName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
};

export type RunFloorPlanAnalysisInput = {
  floorPlan: FloorPlanFileInput;
  projectId: string;
};

export type AiDetectedRoom = {
  confidence?: number;
  estimatedAreaM2?: number;
  name: string;
  type: RoomType;
};

export type AiFloorPlanOutput = {
  rooms: AiDetectedRoom[];
};

export type RunFloorPlanAnalysisResult =
  | {
      model: string;
      ok: true;
      parsedResponse: AiFloorPlanOutput;
      provider: AiProvider;
      rawResponseJson: unknown;
    }
  | {
      ok: false;
      reason: "malformed_ai_response" | "missing_api_key" | "provider_error";
    };

const rawAiRoomSchema = z.object({
  confidence: z.number().nullable(),
  estimatedAreaM2: z.number().nullable(),
  name: z.string().trim().min(1).max(100),
  type: roomTypeSchema,
});

const rawAiFloorPlanOutputSchema = z.object({
  rooms: z.array(rawAiRoomSchema).max(100),
});

export type RawAiFloorPlanOutput = z.infer<typeof rawAiFloorPlanOutputSchema>;

export const aiFloorPlanAnalysisOutputSchema = z.object({
  rooms: z
    .array(
      z.object({
        confidence: z.number().min(0).max(1).optional(),
        estimatedAreaM2: z.number().positive().optional(),
        name: z.string().trim().min(1).max(100),
        type: roomTypeSchema,
      }),
    )
    .max(100),
});

const roomTypeAliases: Record<RoomType, string[]> = {
  bathroom: [
    "bad",
    "badezimmer",
    "bathroom",
    "bath",
    "kupatilo",
    "kupaonica",
    "kopalnica",
    "toilet",
    "wc",
  ],
  bedroom: [
    "bedroom",
    "schlafzimmer",
    "spalnica",
    "spavaca",
    "spavaca soba",
  ],
  hallway: [
    "flur",
    "gang",
    "hall",
    "hallway",
    "hodnik",
    "predsoblje",
    "vorraum",
  ],
  kitchen: ["kuche", "kitchen", "kuhinja", "kuhinje"],
  living_room: [
    "boravak",
    "dnevna soba",
    "dnevni boravak",
    "living room",
    "living_room",
    "livingroom",
    "wohnraum",
    "wohnzimmer",
  ],
  office: ["arbeitszimmer", "biro", "buro", "kancelarija", "office", "pisarna", "ured"],
  unknown: ["unknown"],
};

const ANALYSIS_INSTRUCTIONS = [
  "Detect rooms from the uploaded residential or office floor plan.",
  "Return only structured JSON matching the schema, with every room field present.",
  "Use the room name text as it appears on the plan when readable.",
  "For type, choose one of: living_room, bedroom, kitchen, bathroom, hallway, office, unknown.",
  "Floor plan labels may be Serbian, Croatian, German, or Slovenian; classify them into the allowed type values.",
  "If estimatedAreaM2 or confidence is unknown, return null for that field.",
].join(" ");

export async function runFloorPlanAnalysis(
  input: RunFloorPlanAnalysisInput,
): Promise<RunFloorPlanAnalysisResult> {
  const openAi = getOpenAiClient();

  if (!openAi.ok) {
    return openAi;
  }

  try {
    const response = await openAi.client.responses.parse({
      input: [
        {
          content: ANALYSIS_INSTRUCTIONS,
          role: "developer",
        },
        {
          content: [
            {
              text: "Analyze this floor plan and return detected rooms only.",
              type: "input_text",
            },
            createFloorPlanInputContent(input.floorPlan),
          ],
          role: "user",
        },
      ],
      model: openAi.config.analysisModel,
      safety_identifier: input.projectId.slice(0, 64),
      store: false,
      text: {
        format: zodTextFormat(
          rawAiFloorPlanOutputSchema,
          "floor_plan_room_detection",
        ),
      },
    });

    if (!response.output_parsed) {
      return {
        ok: false,
        reason: "malformed_ai_response",
      };
    }

    return {
      model: openAi.config.analysisModel,
      ok: true,
      parsedResponse: normalizeAiFloorPlanOutput(response.output_parsed),
      provider: openAi.config.provider,
      rawResponseJson: {
        id: response.id,
        model: response.model,
        outputText: response.output_text,
        status: response.status,
        usage: response.usage,
      },
    };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      console.error("OpenAI floor plan analysis returned malformed output", error);

      return {
        ok: false,
        reason: "malformed_ai_response",
      };
    }

    console.error("OpenAI floor plan analysis failed", error);

    return {
      ok: false,
      reason: "provider_error",
    };
  }
}

export function normalizeAiFloorPlanOutput(value: unknown): AiFloorPlanOutput {
  const parsedOutput = rawAiFloorPlanOutputSchema.safeParse(value);

  if (!parsedOutput.success) {
    throw new z.ZodError(parsedOutput.error.issues);
  }

  const normalizedOutput: AiFloorPlanOutput = {
    rooms: parsedOutput.data.rooms.map((room) => {
      const typeFromField = mapAiRoomType(room.type);
      const type =
        typeFromField === "unknown" ? mapAiRoomType(room.name) : typeFromField;

      return {
        ...withOptionalNumber("confidence", normalizeConfidence(room.confidence)),
        ...withOptionalNumber("estimatedAreaM2", normalizeArea(room.estimatedAreaM2)),
        name: room.name.trim(),
        type,
      };
    }),
  };
  const validatedOutput =
    aiFloorPlanAnalysisOutputSchema.safeParse(normalizedOutput);

  if (!validatedOutput.success) {
    throw new z.ZodError(validatedOutput.error.issues);
  }

  return validatedOutput.data;
}

export function mapAiRoomType(label: string | undefined): RoomType {
  if (!label) {
    return "unknown";
  }

  const normalizedLabel = normalizeRoomLabel(label);

  for (const [roomType, aliases] of Object.entries(roomTypeAliases)) {
    if (aliases.some((alias) => normalizeRoomLabel(alias) === normalizedLabel)) {
      return roomType as RoomType;
    }
  }

  return "unknown";
}

function createFloorPlanInputContent(floorPlan: FloorPlanFileInput) {
  const base64 = floorPlan.bytes.toString("base64");

  if (floorPlan.mimeType === "application/pdf") {
    return {
      detail: "high" as const,
      file_data: base64,
      filename: floorPlan.fileName,
      type: "input_file" as const,
    };
  }

  return {
    detail: "high" as const,
    image_url: `data:${floorPlan.mimeType};base64,${base64}`,
    type: "input_image" as const,
  };
}

function normalizeRoomLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeArea(areaM2: number | null): number | undefined {
  if (areaM2 === null || !Number.isFinite(areaM2) || areaM2 <= 0) {
    return undefined;
  }

  return roundToTwoDecimals(areaM2);
}

function normalizeConfidence(confidence: number | null): number | undefined {
  if (confidence === null || !Number.isFinite(confidence)) {
    return undefined;
  }

  if (confidence >= 0 && confidence <= 1) {
    return roundToTwoDecimals(confidence);
  }

  if (confidence > 1 && confidence <= 100) {
    return roundToTwoDecimals(confidence / 100);
  }

  return undefined;
}

function withOptionalNumber<Key extends string>(
  key: Key,
  value: number | undefined,
): Record<Key, number> | Record<string, never> {
  return value === undefined ? {} : { [key]: value } as Record<Key, number>;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
