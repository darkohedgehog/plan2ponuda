"use client";

import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import type { SaveSettingsResponse, UserSettingsProfile } from "@/types/settings";

type SettingsFormProps = {
  initialSettings: UserSettingsProfile;
};

type SettingsFormState = {
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyEmail: string;
  companyName: string;
  companyPhone: string;
  companyTaxId: string;
  currency: string;
  fullName: string;
  laborFactor: string;
};

type SettingsErrorKey = "invalidInput" | "laborFactor" | "saveFailed";

function toFormState(settings: UserSettingsProfile): SettingsFormState {
  return {
    companyAddress: settings.companyAddress ?? "",
    companyCity: settings.companyCity ?? "",
    companyCountry: settings.companyCountry ?? "",
    companyEmail: settings.companyEmail ?? "",
    companyName: settings.companyName ?? "",
    companyPhone: settings.companyPhone ?? "",
    companyTaxId: settings.companyTaxId ?? "",
    currency: settings.currency,
    fullName: settings.fullName ?? "",
    laborFactor: settings.laborFactor,
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tCompany = useTranslations("Company");
  const tEstimating = useTranslations("Estimating");
  const tProfile = useTranslations("Profile");
  const tSettings = useTranslations("Settings");
  const tValidation = useTranslations("Validation");
  const [formState, setFormState] = useState<SettingsFormState>(
    toFormState(initialSettings),
  );
  const [errorKey, setErrorKey] = useState<SettingsErrorKey | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof SettingsFormState,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setErrorKey(null);
    setShowSaved(false);
    setFormState((currentState) => ({
      ...currentState,
      [field]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const laborFactor = Number(formState.laborFactor);

    if (!Number.isFinite(laborFactor) || laborFactor <= 0) {
      setErrorKey("laborFactor");
      setShowSaved(false);
      return;
    }

    setErrorKey(null);
    setShowSaved(false);
    setIsSubmitting(true);

    const response = await fetch("/api/settings", {
      body: JSON.stringify({
        ...formState,
        laborFactor,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });
    const payload = (await response
      .json()
      .catch((): SaveSettingsResponse | null => null)) as
      | SaveSettingsResponse
      | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      setErrorKey(
        payload && !payload.ok && payload.error.code === "invalid_input"
          ? "invalidInput"
          : "saveFailed",
      );
      return;
    }

    setFormState(toFormState(payload.settings));
    setShowSaved(true);
    router.refresh();
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <SettingsSection
        description={tProfile("section.description")}
        title={tProfile("section.title")}
      >
        <SettingsField label={tProfile("fields.fullName")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("fullName", event)}
            placeholder={tProfile("placeholders.fullName")}
            type="text"
            value={formState.fullName}
          />
        </SettingsField>
        <SettingsField
          helperText={tProfile("helpers.emailReadOnly")}
          label={tProfile("fields.email")}
        >
          <input
            className={`${formControlClassName} bg-frosted-blue-50 text-deep-twilight-700/70`}
            readOnly
            type="email"
            value={initialSettings.email}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        description={tCompany("section.description")}
        title={tCompany("section.title")}
      >
        <SettingsField label={tCompany("fields.name")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyName", event)}
            placeholder={tCompany("placeholders.name")}
            type="text"
            value={formState.companyName}
          />
        </SettingsField>
        <SettingsField label={tCompany("fields.address")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyAddress", event)}
            placeholder={tCompany("placeholders.address")}
            type="text"
            value={formState.companyAddress}
          />
        </SettingsField>
        <SettingsField label={tCompany("fields.city")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyCity", event)}
            placeholder={tCompany("placeholders.city")}
            type="text"
            value={formState.companyCity}
          />
        </SettingsField>
        <SettingsField label={tCompany("fields.country")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyCountry", event)}
            placeholder={tCompany("placeholders.country")}
            type="text"
            value={formState.companyCountry}
          />
        </SettingsField>
        <SettingsField label={tCompany("fields.taxId")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyTaxId", event)}
            placeholder={tCompany("placeholders.taxId")}
            type="text"
            value={formState.companyTaxId}
          />
        </SettingsField>
        <SettingsField label={tCompany("fields.email")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyEmail", event)}
            placeholder={tCompany("placeholders.email")}
            type="email"
            value={formState.companyEmail}
          />
        </SettingsField>
        <SettingsField label={tCompany("fields.phone")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyPhone", event)}
            placeholder={tCompany("placeholders.phone")}
            type="tel"
            value={formState.companyPhone}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        description={tEstimating("section.description")}
        title={tEstimating("section.title")}
      >
        <SettingsField
          helperText={tEstimating("helpers.laborFactor")}
          label={tEstimating("fields.laborFactor")}
        >
          <input
            className={formControlClassName}
            min="0.01"
            onChange={(event) => updateField("laborFactor", event)}
            step="0.01"
            type="number"
            value={formState.laborFactor}
          />
        </SettingsField>
        <SettingsField label={tEstimating("fields.currency")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("currency", event)}
            placeholder={tEstimating("placeholders.currency")}
            type="text"
            value={formState.currency}
          />
        </SettingsField>
      </SettingsSection>

      {errorKey ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorKey === "laborFactor"
            ? tValidation("laborFactorPositive")
            : errorKey === "invalidInput"
              ? tValidation("invalidSettingsInput")
              : tSettings("errors.saveFailed")}
        </div>
      ) : null}
      {showSaved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {tSettings("messages.saved")}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSubmitting ? tActions("saving") : tActions("saveSettings")}
        </Button>
      </div>
    </form>
  );
}

type SettingsSectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

function SettingsSection({
  children,
  description,
  title,
}: SettingsSectionProps) {
  return (
    <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-frosted-blue-200 pb-4">
        <h2 className="text-lg font-semibold text-deep-twilight-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-deep-twilight-700">{description}</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

type SettingsFieldProps = {
  children: ReactNode;
  helperText?: string;
  label: string;
};

function SettingsField({ children, helperText, label }: SettingsFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-deep-twilight-800">{label}</span>
      {children}
      {helperText ? (
        <span className="text-xs leading-5 text-deep-twilight-700/70">{helperText}</span>
      ) : null}
    </label>
  );
}
