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
import type {
  BillingProfile,
  CustomerType,
  SaveBillingProfileResponse,
} from "@/types/billing";

const customerTypeOptions: CustomerType[] = [
  "croatian_individual",
  "croatian_business_b2b",
  "croatian_b2g",
  "eu_business",
  "eu_b2g_needs_review",
  "outside_eu",
];

type BillingProfileFormProps = {
  initialProfile: BillingProfile | null;
};

type BillingProfileFormState = {
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingCountry: string;
  billingEmail: string;
  billingName: string;
  billingPostalCode: string;
  companyName: string;
  contactPerson: string;
  customerType: CustomerType;
  eInvoiceReference: string;
  notes: string;
  oib: string;
  phone: string;
  procurementReference: string;
  purchaseOrderNumber: string;
  taxId: string;
  vatId: string;
};

type BillingProfileErrorKey = "invalidInput" | "saveFailed";

function toFormState(
  profile: BillingProfile | null,
): BillingProfileFormState {
  return {
    billingAddressLine1: profile?.billingAddressLine1 ?? "",
    billingAddressLine2: profile?.billingAddressLine2 ?? "",
    billingCity: profile?.billingCity ?? "",
    billingCountry: profile?.billingCountry ?? "HR",
    billingEmail: profile?.billingEmail ?? "",
    billingName: profile?.billingName ?? "",
    billingPostalCode: profile?.billingPostalCode ?? "",
    companyName: profile?.companyName ?? "",
    contactPerson: profile?.contactPerson ?? "",
    customerType: profile?.customerType ?? "croatian_individual",
    eInvoiceReference: profile?.eInvoiceReference ?? "",
    notes: profile?.notes ?? "",
    oib: profile?.oib ?? "",
    phone: profile?.phone ?? "",
    procurementReference: profile?.procurementReference ?? "",
    purchaseOrderNumber: profile?.purchaseOrderNumber ?? "",
    taxId: profile?.taxId ?? "",
    vatId: profile?.vatId ?? "",
  };
}

export function BillingProfileForm({
  initialProfile,
}: BillingProfileFormProps) {
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tBilling = useTranslations("Billing");
  const tBillingProfile = useTranslations("BillingProfile");
  const tCustomerTypes = useTranslations("CustomerTypes");
  const tValidation = useTranslations("Validation");
  const [formState, setFormState] = useState<BillingProfileFormState>(
    toFormState(initialProfile),
  );
  const [errorKey, setErrorKey] = useState<BillingProfileErrorKey | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof BillingProfileFormState,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
    setErrorKey(null);
    setShowSaved(false);
    setIsSubmitting(true);

    const response = await fetch("/api/billing/profile", {
      body: JSON.stringify(formState),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    });
    const payload = (await response
      .json()
      .catch((): SaveBillingProfileResponse | null => null)) as
      | SaveBillingProfileResponse
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

    setFormState(toFormState(payload.profile));
    setShowSaved(true);
    router.refresh();
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <BillingSection
        description={tBillingProfile("section.description")}
        title={tBillingProfile("section.title")}
      >
        <BillingField label={tBillingProfile("fields.customerType")}>
          <select
            className={formControlClassName}
            onChange={(event) => updateField("customerType", event)}
            value={formState.customerType}
          >
            {customerTypeOptions.map((customerType) => (
              <option key={customerType} value={customerType}>
                {tCustomerTypes(customerType)}
              </option>
            ))}
          </select>
        </BillingField>
        <BillingField label={tBillingProfile("fields.billingName")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("billingName", event)}
            type="text"
            value={formState.billingName}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.billingEmail")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("billingEmail", event)}
            type="email"
            value={formState.billingEmail}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.companyName")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("companyName", event)}
            type="text"
            value={formState.companyName}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.billingAddressLine1")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("billingAddressLine1", event)}
            type="text"
            value={formState.billingAddressLine1}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.billingAddressLine2")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("billingAddressLine2", event)}
            type="text"
            value={formState.billingAddressLine2}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.billingCity")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("billingCity", event)}
            type="text"
            value={formState.billingCity}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.billingPostalCode")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("billingPostalCode", event)}
            type="text"
            value={formState.billingPostalCode}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.billingCountry")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("billingCountry", event)}
            type="text"
            value={formState.billingCountry}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.oib")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("oib", event)}
            type="text"
            value={formState.oib}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.vatId")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("vatId", event)}
            type="text"
            value={formState.vatId}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.taxId")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("taxId", event)}
            type="text"
            value={formState.taxId}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.contactPerson")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("contactPerson", event)}
            type="text"
            value={formState.contactPerson}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.phone")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("phone", event)}
            type="tel"
            value={formState.phone}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.purchaseOrderNumber")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("purchaseOrderNumber", event)}
            type="text"
            value={formState.purchaseOrderNumber}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.eInvoiceReference")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("eInvoiceReference", event)}
            type="text"
            value={formState.eInvoiceReference}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.procurementReference")}>
          <input
            className={formControlClassName}
            onChange={(event) => updateField("procurementReference", event)}
            type="text"
            value={formState.procurementReference}
          />
        </BillingField>
        <BillingField label={tBillingProfile("fields.notes")}>
          <textarea
            className={`${formControlClassName} min-h-24 py-2`}
            onChange={(event) => updateField("notes", event)}
            value={formState.notes}
          />
        </BillingField>
      </BillingSection>

      {errorKey ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorKey === "invalidInput"
            ? tValidation("invalidBillingProfileInput")
            : tBilling("errors.saveProfileFailed")}
        </div>
      ) : null}
      {showSaved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {tBilling("messages.profileSaved")}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSubmitting ? tActions("saving") : tActions("save")}
        </Button>
      </div>
    </form>
  );
}

type BillingSectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

function BillingSection({
  children,
  description,
  title,
}: BillingSectionProps) {
  return (
    <section className="rounded-lg border border-frosted-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-frosted-blue-200 pb-4">
        <h2 className="text-lg font-semibold text-deep-twilight-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-deep-twilight-700">
          {description}
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

type BillingFieldProps = {
  children: ReactNode;
  label: string;
};

function BillingField({ children, label }: BillingFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-deep-twilight-800">{label}</span>
      {children}
    </label>
  );
}
