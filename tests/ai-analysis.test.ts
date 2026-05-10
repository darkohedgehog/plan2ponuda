import assert from "node:assert/strict";
import test from "node:test";

import {
  mapAiRoomType,
  normalizeAiFloorPlanOutput,
  type RawAiFloorPlanOutput,
} from "../src/lib/ai/analysis-service";
import type { RoomType } from "../src/types/room";

type IsEqual<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;

type Assert<Condition extends true> = Condition;

type ExpectedRawAiFloorPlanOutput = {
  rooms: Array<{
    confidence: number | null;
    estimatedAreaM2: number | null;
    name: string;
    type: RoomType;
  }>;
};

type _RawAiFloorPlanOutputMatchesStructuredOutput = Assert<
  IsEqual<RawAiFloorPlanOutput, ExpectedRawAiFloorPlanOutput>
>;

test("maps supported and multilingual room labels to stored room types", () => {
  assert.equal(mapAiRoomType("living_room"), "living_room");
  assert.equal(mapAiRoomType("Dnevni boravak"), "living_room");
  assert.equal(mapAiRoomType("Küche"), "kitchen");
  assert.equal(mapAiRoomType("kopalnica"), "bathroom");
  assert.equal(mapAiRoomType("Arbeitszimmer"), "office");
});

test("maps unsupported room labels to unknown", () => {
  assert.equal(mapAiRoomType("technical room"), "unknown");
  assert.equal(mapAiRoomType(undefined), "unknown");
});

test("normalizes AI floor plan output before database writes", () => {
  const normalized = normalizeAiFloorPlanOutput({
    rooms: [
      {
        confidence: 87,
        estimatedAreaM2: 12.345,
        name: " Spavaća soba ",
        type: "bedroom",
      },
      {
        confidence: null,
        estimatedAreaM2: null,
        name: "Hodnik",
        type: "unknown",
      },
    ],
  });

  assert.deepEqual(normalized, {
    rooms: [
      {
        confidence: 0.87,
        estimatedAreaM2: 12.35,
        name: "Spavaća soba",
        type: "bedroom",
      },
      {
        name: "Hodnik",
        type: "hallway",
      },
    ],
  });
});
