"use client";

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
  companyEmail: string;
  companyName: string;
  companyPhone: string;
  currency: string;
  fullName: string;
  laborFactor: string;
};

function toFormState(settings: UserSettingsProfile): SettingsFormState {
  return {
    companyAddress: settings.companyAddress ?? "",
    companyEmail: settings.companyEmail ?? "",
    companyName: settings.companyName ?? "",
    companyPhone: settings.companyPhone ?? "",
    currency: settings.currency,
    fullName: settings.fullName ?? "",
    laborFactor: settings.laborFactor,
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<SettingsFormState>(
    toFormState(initialSettings),
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof SettingsFormState,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setError(null);
    setSuccessMessage(null);
    setFormState((currentState) => ({
      ...currentState,
      [field]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const laborFactor = Number(formState.laborFactor);

    if (!Number.isFinite(laborFactor) || laborFactor <= 0) {
      setError("Labor factor must be a positive number.");
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);
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
      setError(
        payload && !payload.ok
          ? payload.error.message
          : "Unable to save settings.",
      );
      return;
    }

    setFormState(toFormState(payload.settings));
    setSuccessMessage("Settings saved.");
    router.refresh();
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <SettingsSection
        description="Basic account information used inside your workspace."
        title="Account"
      >
        <SettingsField label="Full name">
          <input
            className={formControlClassName}
            onChange={(event) => updateField("fullName", event)}
            placeholder="Your name"
            type="text"
            value={formState.fullName}
          />
        </SettingsField>
        <SettingsField
          helperText="Email changes are not supported yet."
          label="Email"
        >
          <input
            className={`${formControlClassName} bg-slate-50 text-slate-500`}
            readOnly
            type="email"
            value={initialSettings.email}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        description="Company details can be reused later for quote and PDF branding."
        title="Company information"
      >
        <SettingsField label="Company name">
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyName", event)}
            placeholder="Company name"
            type="text"
            value={formState.companyName}
          />
        </SettingsField>
        <SettingsField label="Company address">
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyAddress", event)}
            placeholder="Street, city"
            type="text"
            value={formState.companyAddress}
          />
        </SettingsField>
        <SettingsField label="Company phone">
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyPhone", event)}
            placeholder="+385..."
            type="tel"
            value={formState.companyPhone}
          />
        </SettingsField>
        <SettingsField label="Company email">
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyEmail", event)}
            placeholder="company@example.com"
            type="email"
            value={formState.companyEmail}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        description="Defaults used when generating future quote totals."
        title="Estimating preferences"
      >
        <SettingsField
          helperText="Labor cost is project area multiplied by this factor."
          label="Labor factor"
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
        <SettingsField label="Currency">
          <input
            className={formControlClassName}
            onChange={(event) => updateField("currency", event)}
            placeholder="EUR"
            type="text"
            value={formState.currency}
          />
        </SettingsField>
      </SettingsSection>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Save Settings"}
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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
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
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
      {helperText ? (
        <span className="text-xs leading-5 text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}
