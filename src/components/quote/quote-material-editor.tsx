"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useState } from "react";

import type {
  MaterialCategory,
  MaterialUnit,
  ProjectMaterial,
  Quote,
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
  onSaved?: (result: {
    materials: ProjectMaterial[];
    quote: Quote;
  }) => void;
  projectId: string;
};

type DraftMaterial = QuoteMaterialEditorMaterial & {
  clientId: string;
  isNew: boolean;
};

type SaveMaterialsResponse =
  | {
      materials: ProjectMaterial[];
      quote: Quote;
    }
  | {
      error: string;
    };

type QuoteMaterialErrorKey = "invalidInput" | "saveFailed";

const categoryOptions: MaterialCategory[] = [
  "cable",
  "socket",
  "switch",
  "breaker",
  "box",
  "panel",
  "other",
];

const unitOptions: MaterialUnit[] = ["pcs", "m", "set"];

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

function toEditorMaterial(
  material: ProjectMaterial,
  fallbackMaterialName: string,
): QuoteMaterialEditorMaterial {
  const editorMaterial: QuoteMaterialEditorMaterial = {
    category: material.material?.category ?? "other",
    id: material.id,
    materialId: material.materialId,
    name: material.material?.name ?? fallbackMaterialName,
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
  onSaved,
  projectId,
}: QuoteMaterialEditorProps) {
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tCommon = useTranslations("Common");
  const tMaterials = useTranslations("Materials");
  const tValidation = useTranslations("Validation");
  const tWorkspace = useTranslations("QuoteWorkspace");
  const [materials, setMaterials] = useState<DraftMaterial[]>(
    initialMaterials.map(toDraftMaterial),
  );
  const [deletedMaterialIds, setDeletedMaterialIds] = useState<string[]>([]);
  const [errorKey, setErrorKey] = useState<QuoteMaterialErrorKey | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addMaterial() {
    setErrorKey(null);
    setShowSaved(false);
    setMaterials((currentMaterials) => [
      ...currentMaterials,
      createManualMaterial(),
    ]);
  }

  function deleteMaterial(material: DraftMaterial) {
    setErrorKey(null);
    setShowSaved(false);

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
    setErrorKey(null);
    setShowSaved(false);
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
      setErrorKey("invalidInput");
      setShowSaved(false);
      return;
    }

    setErrorKey(null);
    setShowSaved(false);
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
      setErrorKey(response.status === 400 ? "invalidInput" : "saveFailed");
      return;
    }

    setMaterials(
      payload.materials
        .map((material) =>
          toEditorMaterial(material, tMaterials("fallbackName")),
        )
        .map(toDraftMaterial),
    );
    setDeletedMaterialIds([]);
    setShowSaved(true);
    onSaved?.({
      materials: payload.materials,
      quote: payload.quote,
    });
    router.refresh();
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm shadow-slate-200/50 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showSaved ? (
            <p className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              {tWorkspace("messages.materialsSaved")}
            </p>
          ) : (
            <div className="hidden sm:block" />
          )}
          <div className="grid gap-2 sm:flex sm:justify-end">
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 sm:w-auto"
              onClick={addMaterial}
              type="button"
            >
              {tActions("addMaterial")}
            </button>
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
              disabled={isSubmitting}
              onClick={saveMaterials}
              type="button"
            >
              {isSubmitting ? tActions("saving") : tActions("saveMaterials")}
            </button>
          </div>
        </div>
      </div>

      {errorKey ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorKey === "invalidInput"
            ? tValidation("invalidQuoteMaterialInput")
            : tValidation("unableSaveMaterials")}
        </div>
      ) : null}

      {materials.length > 0 ? (
        <div className="space-y-3 2xl:overflow-hidden 2xl:rounded-2xl 2xl:border 2xl:border-slate-200 2xl:bg-white 2xl:shadow-sm 2xl:shadow-slate-200/50">
          <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 2xl:grid 2xl:grid-cols-[minmax(16rem,1.7fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(11rem,0.9fr)_minmax(9rem,0.75fr)_minmax(9rem,0.75fr)_minmax(6rem,0.55fr)] 2xl:gap-4">
            <span>{tMaterials("fields.materialName")}</span>
            <span>{tCommon("category")}</span>
            <span>{tCommon("source")}</span>
            <span className="text-right">{tCommon("quantity")}</span>
            <span className="text-right">{tCommon("unitPrice")}</span>
            <span className="text-right">{tCommon("total")}</span>
            <span className="text-right">{tActions("delete")}</span>
          </div>

          <div className="space-y-3 2xl:space-y-0 2xl:divide-y 2xl:divide-slate-100">
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <h3 className="text-base font-semibold text-slate-950">
            {tWorkspace("materials.emptyTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            {tWorkspace("materials.emptyDescription")}
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
  const locale = useLocale();
  const tActions = useTranslations("Actions");
  const tCategories = useTranslations("MaterialCategories");
  const tCommon = useTranslations("Common");
  const tMaterials = useTranslations("Materials");
  const tUnits = useTranslations("MaterialUnits");
  const total = calculateTotal(material);
  const translatedCategoryOptions = categoryOptions.map((category) => ({
    label: tCategories(category),
    value: category,
  }));
  const translatedUnitOptions = unitOptions.map((unit) => ({
    label: tUnits(unit),
    value: unit,
  }));
  const sourceLabel =
    material.source === "manual"
      ? tMaterials("sources.manual")
      : material.source === "rule"
        ? tMaterials("sources.rule")
        : material.source;

  return (
    <article className="grid min-w-0 gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm shadow-slate-200/50 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(11rem,0.8fr)_minmax(10rem,0.7fr)] 2xl:grid-cols-[minmax(16rem,1.7fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(11rem,0.9fr)_minmax(9rem,0.75fr)_minmax(9rem,0.75fr)_minmax(6rem,0.55fr)] 2xl:items-center 2xl:gap-4 2xl:rounded-none 2xl:border-0 2xl:shadow-none">
      <MaterialResponsiveField
        className="sm:col-span-2 lg:col-span-1 2xl:col-span-1"
        label={tMaterials("fields.materialName")}
      >
        {material.isNew ? (
          <TextInput
            ariaLabel={tMaterials("fields.materialName")}
            onChange={(event) => onUpdate({ name: event.target.value })}
            placeholder={tMaterials("fields.materialName")}
            value={material.name}
          />
        ) : (
          <div className="min-w-0 overflow-hidden">
            <p className="break-words font-semibold leading-5 text-slate-950 2xl:truncate">
              {material.name}
            </p>
            {material.code ? (
              <p className="mt-1 break-all font-mono text-xs text-slate-500">
                {material.code}
              </p>
            ) : null}
          </div>
        )}
      </MaterialResponsiveField>

      <MaterialResponsiveField label={tCommon("category")}>
        {material.isNew ? (
          <SelectInput
            ariaLabel={tCommon("category")}
            onChange={(event) =>
              onUpdate({ category: event.target.value as MaterialCategory })
            }
            options={translatedCategoryOptions}
            pill
            value={material.category}
          />
        ) : (
          <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <span className="truncate">{tCategories(material.category)}</span>
          </span>
        )}
      </MaterialResponsiveField>

      <MaterialResponsiveField label={tCommon("source")}>
        <span
          className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getSourceBadgeClassName(
            material.source,
          )}`}
        >
          <span className="truncate">{sourceLabel}</span>
        </span>
      </MaterialResponsiveField>

      <MaterialResponsiveField align="right" label={tCommon("quantity")}>
        <div className="flex min-w-0 items-center gap-2 sm:justify-end">
          {material.isNew ? (
            <SelectInput
              ariaLabel={tCommon("unit")}
              compact
              onChange={(event) =>
                onUpdate({ unit: event.target.value as MaterialUnit })
              }
              options={translatedUnitOptions}
              value={material.unit}
            />
          ) : (
            <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 px-2.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              {tUnits(material.unit)}
            </span>
          )}
          <NumberInput
            ariaLabel={tCommon("quantity")}
            onChange={(event) => onUpdate({ quantity: event.target.value })}
            size="compact"
            value={material.quantity}
          />
        </div>
      </MaterialResponsiveField>

      <MaterialResponsiveField align="right" label={tCommon("unitPrice")}>
        <NumberInput
          ariaLabel={tCommon("unitPrice")}
          onChange={(event) => onUpdate({ unitPrice: event.target.value })}
          size="price"
          value={material.unitPrice}
        />
      </MaterialResponsiveField>

      <MaterialResponsiveField align="right" label={tCommon("total")}>
        <span className="inline-flex h-10 max-w-full items-center justify-end rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold tabular-nums text-slate-950 shadow-inner shadow-slate-200/40">
          {formatMoney(total, locale)}
        </span>
      </MaterialResponsiveField>

      <div className="min-w-0 sm:col-span-2 lg:col-span-3 2xl:col-span-1 2xl:flex 2xl:justify-end">
        <button
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 outline-none transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-100 focus-visible:ring-offset-2 2xl:h-9 2xl:w-auto"
          onClick={onDelete}
          type="button"
        >
          {tActions("delete")}
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
      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
  );
}

type NumberInputProps = {
  ariaLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  size?: "compact" | "default" | "price";
  value: string;
};

function NumberInput({
  ariaLabel,
  onChange,
  size = "default",
  value,
}: NumberInputProps) {
  const widthClassName =
    size === "compact"
      ? "w-20 sm:w-24"
      : size === "price"
        ? "w-24 sm:w-28 2xl:w-full"
        : "w-28 2xl:w-full";

  return (
    <input
      aria-label={ariaLabel}
      className={`${widthClassName} h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-right text-sm font-medium tabular-nums text-slate-950 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
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
  pill?: boolean;
  value: TValue;
};

function SelectInput<TValue extends string>({
  ariaLabel,
  compact = false,
  onChange,
  options,
  pill = false,
  value,
}: SelectInputProps<TValue>) {
  const shapeClassName = pill
    ? "rounded-full bg-slate-50 text-xs font-semibold text-slate-700"
    : "rounded-xl bg-white text-sm font-medium text-slate-950";

  return (
    <select
      aria-label={ariaLabel}
      className={`h-10 min-w-0 border border-slate-200 px-3 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${shapeClassName} ${
        compact ? "w-16 shrink-0" : "w-full"
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

type MaterialResponsiveFieldProps = {
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
  label: string;
};

function MaterialResponsiveField({
  align = "left",
  children,
  className = "",
  label,
}: MaterialResponsiveFieldProps) {
  return (
    <div className={`min-w-0 overflow-hidden ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">
        {label}
      </span>
      <div
        className={`min-w-0 ${
          align === "right" ? "sm:text-right 2xl:text-right" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function getSourceBadgeClassName(source: string): string {
  if (source === "manual") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (source === "rule") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    style: "currency",
  }).format(value);
}
