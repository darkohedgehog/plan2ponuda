"use client";

import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import {
  getRequiredBillingProfileFields,
  usesCompanyBillingName,
  usesPublicSectorReferences,
} from "@/lib/billing/profile-fields";
import type {
  BillingProfile,
  BillingProfileFieldKey,
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

type BillingProfileFormState = Record<BillingProfileFieldKey, string> & {
  customerType: CustomerType;
};

type BillingProfileErrorKey = "invalidInput" | "saveFailed";

type BillingProfileErrorState = {
  key: BillingProfileErrorKey;
  missingFields: BillingProfileFieldKey[];
};
type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

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

function getMissingFieldNames(
  fields: BillingProfileFieldKey[],
  translateField: (key: string) => string,
): string {
  return fields.map((field) => translateField(`fields.${field}`)).join(", ");
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
  const [errorState, setErrorState] =
    useState<BillingProfileErrorState | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiredFields = getRequiredBillingProfileFields(
    formState.customerType,
  );
  const isCompanyProfile = usesCompanyBillingName(formState.customerType);
  const isPublicSectorProfile = usesPublicSectorReferences(
    formState.customerType,
  );
  const showOib =
    formState.customerType === "croatian_business_b2b" ||
    formState.customerType === "croatian_b2g";
  const showVat =
    formState.customerType === "eu_business" ||
    formState.customerType === "eu_b2g_needs_review";
  const showTaxId = formState.customerType === "outside_eu";
  const showPhone =
    formState.customerType === "croatian_individual" ||
    formState.customerType === "croatian_business_b2b" ||
    formState.customerType === "eu_business" ||
    formState.customerType === "outside_eu";
  const showContactPerson = formState.customerType !== "croatian_individual";

  function isRequired(field: BillingProfileFieldKey): boolean {
    return requiredFields.includes(field);
  }

  function isMissing(field: BillingProfileFieldKey): boolean {
    return errorState?.missingFields.includes(field) ?? false;
  }

  function getInputClassName(field: BillingProfileFieldKey): string {
    return isMissing(field)
      ? `${formControlClassName} border-red-300 focus:border-red-400 focus:ring-red-100`
      : formControlClassName;
  }

  function updateField(
    field: keyof BillingProfileFormState,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setErrorState(null);
    setShowSaved(false);
    setFormState((currentState) => ({
      ...currentState,
      [field]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setErrorState(null);
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
      setErrorState({
        key:
          payload && !payload.ok && payload.error.code === "invalid_input"
            ? "invalidInput"
            : "saveFailed",
        missingFields: payload && !payload.ok ? payload.error.missingFields ?? [] : [],
      });
      return;
    }

    setFormState(toFormState(payload.profile));
    setShowSaved(true);
    router.refresh();
  }

  const invalidInputMessage =
    errorState?.key === "invalidInput" && errorState.missingFields.length > 0
      ? tValidation("missingBillingProfileFields", {
          fields: getMissingFieldNames(
            errorState.missingFields,
            tBillingProfile,
          ),
        })
      : tValidation("invalidBillingProfileInput");

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <BillingSection
        description={tBillingProfile("sections.customerType.description")}
        title={tBillingProfile("sections.customerType.title")}
      >
        <BillingField
          field="customerType"
          isRequired
          label={tBillingProfile("fields.customerType")}
          requiredLabel={tBillingProfile("labels.required")}
        >
          <select
            className={getInputClassName("customerType")}
            onChange={(event) => updateField("customerType", event)}
            required
            value={formState.customerType}
          >
            {customerTypeOptions.map((customerType) => (
              <option key={customerType} value={customerType}>
                {tCustomerTypes(customerType)}
              </option>
            ))}
          </select>
        </BillingField>
        {formState.customerType === "eu_b2g_needs_review" ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 md:col-span-2">
            {tBillingProfile("messages.manualInvoiceReview")}
          </div>
        ) : null}
      </BillingSection>

      <BillingSection
        description={tBillingProfile("sections.billingContact.description")}
        title={tBillingProfile("sections.billingContact.title")}
      >
        {isCompanyProfile ? (
          <BillingInput
            field="companyName"
            formState={formState}
            getInputClassName={getInputClassName}
            isRequired={isRequired("companyName")}
            label={tBillingProfile("fields.companyName")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
        ) : (
          <BillingInput
            field="billingName"
            formState={formState}
            getInputClassName={getInputClassName}
            isRequired={isRequired("billingName")}
            label={tBillingProfile("fields.billingName")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
        )}
        {formState.customerType === "outside_eu" ? (
          <BillingInput
            field="companyName"
            formState={formState}
            getInputClassName={getInputClassName}
            isRequired={false}
            label={tBillingProfile("fields.companyName")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
        ) : null}
        <BillingInput
          field="billingEmail"
          formState={formState}
          getInputClassName={getInputClassName}
          inputType="email"
          isRequired={isRequired("billingEmail")}
          label={tBillingProfile("fields.billingEmail")}
          onChange={updateField}
          optionalLabel={tBillingProfile("labels.optional")}
          requiredLabel={tBillingProfile("labels.required")}
        />
        {showContactPerson ? (
          <BillingInput
            field="contactPerson"
            formState={formState}
            getInputClassName={getInputClassName}
            isRequired={isRequired("contactPerson")}
            label={tBillingProfile("fields.contactPerson")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
        ) : null}
        {showPhone ? (
          <BillingInput
            field="phone"
            formState={formState}
            getInputClassName={getInputClassName}
            inputType="tel"
            isRequired={isRequired("phone")}
            label={tBillingProfile("fields.phone")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
        ) : null}
      </BillingSection>

      <BillingSection
        description={tBillingProfile("sections.address.description")}
        title={tBillingProfile("sections.address.title")}
      >
        <BillingInput
          field="billingAddressLine1"
          formState={formState}
          getInputClassName={getInputClassName}
          isRequired={isRequired("billingAddressLine1")}
          label={tBillingProfile("fields.billingAddressLine1")}
          onChange={updateField}
          optionalLabel={tBillingProfile("labels.optional")}
          requiredLabel={tBillingProfile("labels.required")}
        />
        <BillingInput
          field="billingAddressLine2"
          formState={formState}
          getInputClassName={getInputClassName}
          isRequired={isRequired("billingAddressLine2")}
          label={tBillingProfile("fields.billingAddressLine2")}
          onChange={updateField}
          optionalLabel={tBillingProfile("labels.optional")}
          requiredLabel={tBillingProfile("labels.required")}
        />
        <BillingInput
          field="billingCity"
          formState={formState}
          getInputClassName={getInputClassName}
          isRequired={isRequired("billingCity")}
          label={tBillingProfile("fields.billingCity")}
          onChange={updateField}
          optionalLabel={tBillingProfile("labels.optional")}
          requiredLabel={tBillingProfile("labels.required")}
        />
        <BillingInput
          field="billingPostalCode"
          formState={formState}
          getInputClassName={getInputClassName}
          isRequired={isRequired("billingPostalCode")}
          label={tBillingProfile("fields.billingPostalCode")}
          onChange={updateField}
          optionalLabel={tBillingProfile("labels.optional")}
          requiredLabel={tBillingProfile("labels.required")}
        />
        <BillingInput
          field="billingCountry"
          formState={formState}
          getInputClassName={getInputClassName}
          isRequired={isRequired("billingCountry")}
          label={tBillingProfile("fields.billingCountry")}
          onChange={updateField}
          optionalLabel={tBillingProfile("labels.optional")}
          requiredLabel={tBillingProfile("labels.required")}
        />
      </BillingSection>

      {showOib || showVat || showTaxId ? (
        <BillingSection
          description={tBillingProfile("sections.companyTax.description")}
          title={tBillingProfile("sections.companyTax.title")}
        >
          {showOib ? (
            <BillingInput
              field="oib"
              formState={formState}
              getInputClassName={getInputClassName}
              helperText={tBillingProfile("helpers.oib")}
              isRequired={isRequired("oib")}
              label={tBillingProfile("fields.oib")}
              onChange={updateField}
              optionalLabel={tBillingProfile("labels.optional")}
              requiredLabel={tBillingProfile("labels.required")}
            />
          ) : null}
          {showVat ? (
            <BillingInput
              field="vatId"
              formState={formState}
              getInputClassName={getInputClassName}
              helperText={tBillingProfile("helpers.vatId")}
              isRequired={isRequired("vatId")}
              label={tBillingProfile("fields.vatId")}
              onChange={updateField}
              optionalLabel={tBillingProfile("labels.optional")}
              requiredLabel={tBillingProfile("labels.required")}
            />
          ) : null}
          {showTaxId ? (
            <BillingInput
              field="taxId"
              formState={formState}
              getInputClassName={getInputClassName}
              helperText={tBillingProfile("helpers.taxId")}
              isRequired={isRequired("taxId")}
              label={tBillingProfile("fields.taxId")}
              onChange={updateField}
              optionalLabel={tBillingProfile("labels.optional")}
              requiredLabel={tBillingProfile("labels.required")}
            />
          ) : null}
        </BillingSection>
      ) : null}

      {isPublicSectorProfile ? (
        <BillingSection
          description={tBillingProfile("sections.publicSector.description")}
          title={tBillingProfile("sections.publicSector.title")}
        >
          <BillingInput
            field="purchaseOrderNumber"
            formState={formState}
            getInputClassName={getInputClassName}
            helperText={tBillingProfile("helpers.purchaseOrderNumber")}
            isRequired={isRequired("purchaseOrderNumber")}
            label={tBillingProfile("fields.purchaseOrderNumber")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
          <BillingInput
            field="eInvoiceReference"
            formState={formState}
            getInputClassName={getInputClassName}
            helperText={tBillingProfile("helpers.eInvoiceReference")}
            isRequired={isRequired("eInvoiceReference")}
            label={tBillingProfile("fields.eInvoiceReference")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
          <BillingInput
            field="procurementReference"
            formState={formState}
            getInputClassName={getInputClassName}
            helperText={tBillingProfile("helpers.procurementReference")}
            isRequired={isRequired("procurementReference")}
            label={tBillingProfile("fields.procurementReference")}
            onChange={updateField}
            optionalLabel={tBillingProfile("labels.optional")}
            requiredLabel={tBillingProfile("labels.required")}
          />
        </BillingSection>
      ) : null}

      <BillingSection
        description={tBillingProfile("sections.notes.description")}
        title={tBillingProfile("sections.notes.title")}
      >
        <BillingField
          field="notes"
          helperText={tBillingProfile("helpers.notes")}
          isRequired={isRequired("notes")}
          label={tBillingProfile("fields.notes")}
          optionalLabel={tBillingProfile("labels.optional")}
          requiredLabel={tBillingProfile("labels.required")}
        >
          <textarea
            className={`${getInputClassName("notes")} min-h-24 py-2 md:col-span-2`}
            onChange={(event) => updateField("notes", event)}
            required={isRequired("notes")}
            value={formState.notes}
          />
        </BillingField>
      </BillingSection>

      {errorState ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorState.key === "invalidInput"
            ? invalidInputMessage
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
  field: BillingProfileFieldKey;
  helperText?: string;
  isRequired: boolean;
  label: string;
  optionalLabel?: string;
  requiredLabel: string;
};

function BillingField({
  children,
  helperText,
  isRequired,
  label,
  optionalLabel,
  requiredLabel,
}: BillingFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-deep-twilight-800">
        <span>
          {label}
          {isRequired ? <span aria-hidden="true"> *</span> : null}
        </span>
        <span className="rounded-sm bg-frosted-blue-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-normal text-deep-twilight-600">
          {isRequired ? requiredLabel : optionalLabel}
        </span>
      </span>
      {children}
      {helperText ? (
        <span className="text-xs leading-5 text-deep-twilight-600">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}

type BillingInputProps = {
  field: Exclude<BillingProfileFieldKey, "customerType" | "notes">;
  formState: BillingProfileFormState;
  getInputClassName: (field: BillingProfileFieldKey) => string;
  helperText?: string;
  inputType?: "email" | "tel" | "text";
  isRequired: boolean;
  label: string;
  onChange: (
    field: keyof BillingProfileFormState,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  optionalLabel: string;
  requiredLabel: string;
};

function BillingInput({
  field,
  formState,
  getInputClassName,
  helperText,
  inputType = "text",
  isRequired,
  label,
  onChange,
  optionalLabel,
  requiredLabel,
}: BillingInputProps) {
  return (
    <BillingField
      field={field}
      helperText={helperText}
      isRequired={isRequired}
      label={label}
      optionalLabel={optionalLabel}
      requiredLabel={requiredLabel}
    >
      <input
        className={getInputClassName(field)}
        onChange={(event) => onChange(field, event)}
        required={isRequired}
        type={inputType}
        value={formState[field]}
      />
    </BillingField>
  );
}
