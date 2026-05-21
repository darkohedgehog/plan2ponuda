"use client";

import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ComponentProps, useState } from "react";

import { formControlClassName } from "@/components/ui/form-control";
import { cn } from "@/lib/utils/helpers";
import type { Material } from "@/types/quote";

type MaterialPriceEditorProps = {
  defaultPrice: string;
  materialId: string;
};

type SaveMaterialResponse =
  | {
      material: Material;
    }
  | {
      error: string;
    };

type MaterialPriceErrorKey =
  | "forbidden"
  | "invalidPrice"
  | "notFound"
  | "saveFailed";
type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

const MONEY_INPUT_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

function isValidPriceInput(value: string): boolean {
  return MONEY_INPUT_PATTERN.test(value.trim());
}

export function MaterialPriceEditor({
  defaultPrice,
  materialId,
}: MaterialPriceEditorProps) {
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tMaterials = useTranslations("Materials");
  const tValidation = useTranslations("Validation");
  const [price, setPrice] = useState(defaultPrice);
  const [savedPrice, setSavedPrice] = useState(defaultPrice);
  const [errorKey, setErrorKey] = useState<MaterialPriceErrorKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const isDirty = price !== savedPrice;

  function getErrorMessage(key: MaterialPriceErrorKey): string {
    if (key === "invalidPrice") {
      return tValidation("enterValidPrice");
    }

    if (key === "notFound") {
      return tMaterials("errors.materialNotFound");
    }

    if (key === "forbidden") {
      return tMaterials("errors.catalogAdminOnly");
    }

    return tValidation("unableSavePrice");
  }

  async function savePrice(event: FormSubmitEvent) {
    event.preventDefault();

    if (!isValidPriceInput(price)) {
      setErrorKey("invalidPrice");
      setShowSaved(false);
      return;
    }

    setErrorKey(null);
    setShowSaved(false);
    setIsSaving(true);

    const response = await fetch(`/api/materials/${materialId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        defaultPrice: price.trim(),
      }),
    });
    const payload = (await response
      .json()
      .catch((): SaveMaterialResponse | null => null)) as
      | SaveMaterialResponse
      | null;

    setIsSaving(false);

    if (!response.ok || !payload || "error" in payload) {
      setErrorKey(
        response.status === 403
          ? "forbidden"
          : response.status === 404
            ? "notFound"
            : "saveFailed",
      );
      return;
    }

    setPrice(payload.material.defaultPrice);
    setSavedPrice(payload.material.defaultPrice);
    setShowSaved(true);
    router.refresh();
  }

  return (
    <form
      className="flex flex-col items-end gap-2"
      onSubmit={savePrice}
    >
      <div className="flex w-full max-w-[13rem] items-center justify-end gap-2">
        <input
          aria-label={tMaterials("priceEditor.inputAriaLabel")}
          className={cn(formControlClassName, "w-24 text-right")}
          disabled={isSaving}
          inputMode="decimal"
          onChange={(event) => {
            setErrorKey(null);
            setShowSaved(false);
            setPrice(event.target.value);
          }}
          pattern="\d+(?:[.,]\d{1,2})?"
          type="text"
          value={price}
        />
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-deep-twilight-600 px-3 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-deep-twilight-700 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-deep-twilight-300"
          disabled={isSaving || !isDirty}
          type="submit"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSaving ? tActions("saving") : tActions("save")}
        </button>
      </div>
      {errorKey ? (
        <p className="text-right text-xs font-medium text-red-700">
          {getErrorMessage(errorKey)}
        </p>
      ) : showSaved ? (
        <p className="text-right text-xs font-medium text-emerald-700">
          {tActions("saved")}
        </p>
      ) : null}
    </form>
  );
}
