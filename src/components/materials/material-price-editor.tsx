"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

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

const MONEY_INPUT_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

function isValidPriceInput(value: string): boolean {
  return MONEY_INPUT_PATTERN.test(value.trim());
}

export function MaterialPriceEditor({
  defaultPrice,
  materialId,
}: MaterialPriceEditorProps) {
  const router = useRouter();
  const [price, setPrice] = useState(defaultPrice);
  const [savedPrice, setSavedPrice] = useState(defaultPrice);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const isDirty = price !== savedPrice;

  async function savePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidPriceInput(price)) {
      setError("Enter a valid price.");
      setShowSaved(false);
      return;
    }

    setError(null);
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
      setError(
        payload && "error" in payload
          ? payload.error
          : "Unable to save price.",
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
          aria-label="Default material price"
          className={cn(formControlClassName, "w-24 text-right")}
          disabled={isSaving}
          inputMode="decimal"
          onChange={(event) => {
            setError(null);
            setShowSaved(false);
            setPrice(event.target.value);
          }}
          pattern="\d+(?:[.,]\d{1,2})?"
          type="text"
          value={price}
        />
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={isSaving || !isDirty}
          type="submit"
        >
          {isSaving ? "Saving" : "Save"}
        </button>
      </div>
      {error ? (
        <p className="text-right text-xs font-medium text-red-700">{error}</p>
      ) : showSaved ? (
        <p className="text-right text-xs font-medium text-emerald-700">
          Saved
        </p>
      ) : null}
    </form>
  );
}
