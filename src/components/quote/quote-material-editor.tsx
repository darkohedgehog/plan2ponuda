"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useState } from "react";

import type {
  MaterialCategory,
  MaterialUnit,
  ProjectMaterial,
} from "@/types/quote";

export type QuoteMaterialEditorMaterial = {
  category: MaterialCategory;
  code?: string;
  id: string;
  materialId: string;
  name: string;
  quantity: string;
  source: string;
  totalPrice: string;
  unit: MaterialUnit;
  unitPrice: string;
};

type QuoteMaterialEditorProps = {
  initialMaterials: QuoteMaterialEditorMaterial[];
  projectId: string;
};

type DraftMaterial = QuoteMaterialEditorMaterial & {
  clientId: string;
  isNew: boolean;
};

type SaveMaterialsResponse =
  | {
      materials: ProjectMaterial[];
      quote: unknown;
    }
  | {
      error: string;
    };

const categoryOptions: Array<{
  label: string;
  value: MaterialCategory;
}> = [
  { label: "Cable", value: "cable" },
  { label: "Socket", value: "socket" },
  { label: "Switch", value: "switch" },
  { label: "Breaker", value: "breaker" },
  { label: "Box", value: "box" },
  { label: "Panel", value: "panel" },
  { label: "Other", value: "other" },
];

const unitOptions: Array<{
  label: string;
  value: MaterialUnit;
}> = [
  { label: "pcs", value: "pcs" },
  { label: "m", value: "m" },
  { label: "set", value: "set" },
];

function createClientId(): string {
  return `material-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDraftMaterial(material: QuoteMaterialEditorMaterial): DraftMaterial {
  return {
    ...material,
    clientId: material.id,
    isNew: false,
  };
}

function toEditorMaterial(material: ProjectMaterial): QuoteMaterialEditorMaterial {
  const editorMaterial: QuoteMaterialEditorMaterial = {
    category: material.material?.category ?? "other",
    id: material.id,
    materialId: material.materialId,
    name: material.material?.name ?? "Material",
    quantity: material.quantity,
    source: material.source,
    totalPrice: material.totalPrice,
    unit: material.material?.unit ?? "pcs",
    unitPrice: material.unitPrice,
  };

  if (material.material?.code) {
    return {
      ...editorMaterial,
      code: material.material.code,
    };
  }

  return editorMaterial;
}

function createManualMaterial(): DraftMaterial {
  return {
    category: "other",
    clientId: createClientId(),
    id: "",
    isNew: true,
    materialId: "",
    name: "",
    quantity: "1",
    source: "manual",
    totalPrice: "0",
    unit: "pcs",
    unitPrice: "0",
  };
}

function parseDecimal(value: string): number | null {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function calculateTotal(material: DraftMaterial): number {
  const quantity = parseDecimal(material.quantity) ?? 0;
  const unitPrice = parseDecimal(material.unitPrice) ?? 0;

  return quantity * unitPrice;
}

export function QuoteMaterialEditor({
  initialMaterials,
  projectId,
}: QuoteMaterialEditorProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<DraftMaterial[]>(
    initialMaterials.map(toDraftMaterial),
  );
  const [deletedMaterialIds, setDeletedMaterialIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addMaterial() {
    setError(null);
    setSuccessMessage(null);
    setMaterials((currentMaterials) => [
      ...currentMaterials,
      createManualMaterial(),
    ]);
  }

  function deleteMaterial(material: DraftMaterial) {
    setError(null);
    setSuccessMessage(null);

    if (!material.isNew) {
      setDeletedMaterialIds((currentIds) => [...currentIds, material.id]);
    }

    setMaterials((currentMaterials) =>
      currentMaterials.filter(
        (currentMaterial) => currentMaterial.clientId !== material.clientId,
      ),
    );
  }

  function updateMaterial(
    clientId: string,
    updates: Partial<
      Pick<
        DraftMaterial,
        "category" | "name" | "quantity" | "unit" | "unitPrice"
      >
    >,
  ) {
    setError(null);
    setSuccessMessage(null);
    setMaterials((currentMaterials) =>
      currentMaterials.map((material) =>
        material.clientId === clientId
          ? {
              ...material,
              ...updates,
            }
          : material,
      ),
    );
  }

  async function saveMaterials() {
    const invalidMaterial = materials.find((material) => {
      const quantity = parseDecimal(material.quantity);
      const unitPrice = parseDecimal(material.unitPrice);

      return (
        material.name.trim().length === 0 ||
        quantity === null ||
        unitPrice === null
      );
    });

    if (invalidMaterial) {
      setError("Enter a name, quantity, and unit price for every material.");
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/quotes/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deletedMaterialIds,
        existingMaterials: materials
          .filter((material) => !material.isNew)
          .map((material) => ({
            id: material.id,
            quantity: parseDecimal(material.quantity) ?? 0,
            unitPrice: parseDecimal(material.unitPrice) ?? 0,
          })),
        manualMaterials: materials
          .filter((material) => material.isNew)
          .map((material) => ({
            category: material.category,
            name: material.name.trim(),
            quantity: parseDecimal(material.quantity) ?? 0,
            unit: material.unit,
            unitPrice: parseDecimal(material.unitPrice) ?? 0,
          })),
      }),
    });
    const payload = (await response
      .json()
      .catch((): SaveMaterialsResponse | null => null)) as
      | SaveMaterialsResponse
      | null;

    setIsSubmitting(false);

    if (!response.ok || !payload || "error" in payload) {
      setError(
        payload && "error" in payload
          ? payload.error
          : "Unable to save materials.",
      );
      return;
    }

    setMaterials(payload.materials.map(toEditorMaterial).map(toDraftMaterial));
    setDeletedMaterialIds([]);
    setSuccessMessage("Materials saved.");
    router.refresh();
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2"
            onClick={addMaterial}
            type="button"
          >
            Add Material
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSubmitting}
            onClick={saveMaterials}
            type="button"
          >
            {isSubmitting ? "Saving..." : "Save Materials"}
          </button>
        </div>
        {successMessage ? (
          <p className="text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {materials.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
          <div className="hidden bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 xl:grid xl:grid-cols-[minmax(12rem,1.3fr)_minmax(7rem,0.7fr)_8rem_7rem_8rem_8rem_5rem] xl:gap-4">
            <span>Material</span>
            <span>Category</span>
            <span>Source</span>
            <span className="text-right">Quantity</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Total</span>
            <span className="text-right">Delete</span>
          </div>

          <div className="divide-y divide-slate-200">
            {materials.map((material) => (
              <MaterialEditorRow
                key={material.clientId}
                material={material}
                onDelete={() => deleteMaterial(material)}
                onUpdate={(updates) =>
                  updateMaterial(material.clientId, updates)
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <h3 className="text-base font-semibold text-slate-950">
            No materials in this quote
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Add a manual material line and save to include it in quote totals.
          </p>
        </div>
      )}
    </div>
  );
}

type MaterialEditorRowProps = {
  material: DraftMaterial;
  onDelete: () => void;
  onUpdate: (
    updates: Partial<
      Pick<
        DraftMaterial,
        "category" | "name" | "quantity" | "unit" | "unitPrice"
      >
    >,
  ) => void;
};

function MaterialEditorRow({
  material,
  onDelete,
  onUpdate,
}: MaterialEditorRowProps) {
  const total = calculateTotal(material);

  return (
    <article className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[minmax(12rem,1.3fr)_minmax(7rem,0.7fr)_8rem_7rem_8rem_8rem_5rem] xl:items-center xl:gap-4">
      <div className="min-w-0">
        {material.isNew ? (
          <TextInput
            ariaLabel="Material name"
            onChange={(event) => onUpdate({ name: event.target.value })}
            placeholder="Material name"
            value={material.name}
          />
        ) : (
          <>
            <p className="font-semibold text-slate-950">{material.name}</p>
            {material.code ? (
              <p className="mt-1 text-xs text-slate-500">{material.code}</p>
            ) : null}
          </>
        )}
      </div>

      <MaterialMobileField label="Category">
        {material.isNew ? (
          <SelectInput
            ariaLabel="Material category"
            onChange={(event) =>
              onUpdate({ category: event.target.value as MaterialCategory })
            }
            options={categoryOptions}
            value={material.category}
          />
        ) : (
          <span className="capitalize text-slate-700">{material.category}</span>
        )}
      </MaterialMobileField>

      <MaterialMobileField label="Source">
        <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold capitalize text-slate-600">
          {material.source}
        </span>
      </MaterialMobileField>

      <MaterialMobileField align="right" label="Quantity">
        <div className="flex items-center justify-end gap-2">
          <NumberInput
            ariaLabel="Material quantity"
            onChange={(event) => onUpdate({ quantity: event.target.value })}
            value={material.quantity}
          />
          {material.isNew ? (
            <SelectInput
              ariaLabel="Material unit"
              compact
              onChange={(event) =>
                onUpdate({ unit: event.target.value as MaterialUnit })
              }
              options={unitOptions}
              value={material.unit}
            />
          ) : (
            <span className="w-8 text-left text-xs font-medium text-slate-500">
              {material.unit}
            </span>
          )}
        </div>
      </MaterialMobileField>

      <MaterialMobileField align="right" label="Unit price">
        <NumberInput
          ariaLabel="Material unit price"
          onChange={(event) => onUpdate({ unitPrice: event.target.value })}
          value={material.unitPrice}
        />
      </MaterialMobileField>

      <MaterialMobileField align="right" label="Total">
        <span className="font-semibold text-slate-950">
          {formatMoney(total)}
        </span>
      </MaterialMobileField>

      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-100 focus-visible:ring-offset-2"
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

type TextInputProps = {
  ariaLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  value: string;
};

function TextInput({ ariaLabel, onChange, placeholder, value }: TextInputProps) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
  );
}

type NumberInputProps = {
  ariaLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

function NumberInput({ ariaLabel, onChange, value }: NumberInputProps) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-10 w-28 rounded-md border border-slate-300 bg-white px-3 text-right text-sm font-medium text-slate-950 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      min="0"
      onChange={onChange}
      step="0.01"
      type="number"
      value={value}
    />
  );
}

type SelectInputProps<TValue extends string> = {
  ariaLabel: string;
  compact?: boolean;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{
    label: string;
    value: TValue;
  }>;
  value: TValue;
};

function SelectInput<TValue extends string>({
  ariaLabel,
  compact = false,
  onChange,
  options,
  value,
}: SelectInputProps<TValue>) {
  return (
    <select
      aria-label={ariaLabel}
      className={`h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
        compact ? "w-20" : "w-full"
      }`}
      onChange={onChange}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

type MaterialMobileFieldProps = {
  align?: "left" | "right";
  children: ReactNode;
  label: string;
};

function MaterialMobileField({
  align = "left",
  children,
  label,
}: MaterialMobileFieldProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 xl:block ${
        align === "right" ? "xl:text-right" : ""
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 xl:hidden">
        {label}
      </span>
      {children}
    </div>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("hr-HR", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}
