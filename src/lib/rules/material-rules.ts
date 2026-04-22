import type { MaterialCategory, MaterialUnit } from "@/types/quote";

export type ResolvedRoomPoints = {
  resolvedLights: number;
  resolvedSockets: number;
  resolvedSwitches: number;
};

export type ProjectPointTotals = {
  totalLights: number;
  totalSockets: number;
  totalSwitches: number;
};

export type MaterialRuleCode =
  | "BREAKER"
  | "CABLE-3X1.5"
  | "CABLE-3X2.5"
  | "INSTALLATION-MISC"
  | "JUNCTION-BOX"
  | "LIGHT-POINT"
  | "PANEL"
  | "SOCKET-MODULE"
  | "SWITCH-MODULE";

export type MaterialRuleLine = {
  category: MaterialCategory;
  code: MaterialRuleCode;
  name: string;
  quantity: number;
  unit: MaterialUnit;
};

export type PricedMaterialRuleLine = MaterialRuleLine & {
  totalPrice: number;
  unitPrice: number;
};

export function aggregateProjectPoints(
  rooms: ResolvedRoomPoints[],
): ProjectPointTotals {
  return rooms.reduce<ProjectPointTotals>(
    (totals, room) => ({
      totalLights: totals.totalLights + room.resolvedLights,
      totalSockets: totals.totalSockets + room.resolvedSockets,
      totalSwitches: totals.totalSwitches + room.resolvedSwitches,
    }),
    {
      totalLights: 0,
      totalSockets: 0,
      totalSwitches: 0,
    },
  );
}

export function generateProjectMaterials(
  totals: ProjectPointTotals,
): MaterialRuleLine[] {
  const breakerQuantity = Math.max(
    1,
    Math.ceil((totals.totalSockets + totals.totalLights) / 8),
  );

  return [
    {
      category: "socket",
      code: "SOCKET-MODULE",
      name: "Socket module",
      quantity: totals.totalSockets,
      unit: "pcs",
    },
    {
      category: "switch",
      code: "SWITCH-MODULE",
      name: "Switch module",
      quantity: totals.totalSwitches,
      unit: "pcs",
    },
    {
      category: "other",
      code: "LIGHT-POINT",
      name: "Light point",
      quantity: totals.totalLights,
      unit: "pcs",
    },
    {
      category: "box",
      code: "JUNCTION-BOX",
      name: "Junction box",
      quantity: totals.totalSockets + totals.totalSwitches,
      unit: "pcs",
    },
    {
      category: "cable",
      code: "CABLE-3X2.5",
      name: "Cable 3x2.5",
      quantity: totals.totalSockets * 4,
      unit: "m",
    },
    {
      category: "cable",
      code: "CABLE-3X1.5",
      name: "Cable 3x1.5",
      quantity: totals.totalLights * 5,
      unit: "m",
    },
    {
      category: "breaker",
      code: "BREAKER",
      name: "Breaker",
      quantity: breakerQuantity,
      unit: "pcs",
    },
    {
      category: "panel",
      code: "PANEL",
      name: "Panel",
      quantity: 1,
      unit: "set",
    },
    {
      category: "other",
      code: "INSTALLATION-MISC",
      name: "Installation miscellaneous",
      quantity: 1,
      unit: "set",
    },
  ];
}

export function calculateMaterialTotals(
  lines: Array<MaterialRuleLine & { unitPrice: number }>,
): PricedMaterialRuleLine[] {
  return lines.map((line) => ({
    ...line,
    totalPrice: line.quantity * line.unitPrice,
  }));
}
