"use client";

import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  Save,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  type ComponentType,
  type FormEvent,
  type SVGProps,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import type { Locale } from "@/i18n/routing";
import {
  getInvoiceTaskSnapshotFields,
  shouldShowEuB2gReviewNotice,
} from "@/lib/billing/invoice-task-snapshot-fields";
import { cn } from "@/lib/utils/helpers";
import type {
  AdminInvoiceTask,
  InvoiceTaskStatus,
  UpdateAdminInvoiceTaskResponse,
} from "@/types/billing";

type InvoiceTaskQueueProps = {
  locale: Locale;
  tasks: AdminInvoiceTask[];
};

type InvoiceTaskUpdateErrorKey =
  | "issuedLocked"
  | "saveFailed"
  | "synesisRequired";

const statusBadgeClassNames: Record<InvoiceTaskStatus, string> = {
  failed: "border-red-200 bg-red-50 text-red-700",
  issued: "border-emerald-200 bg-emerald-50 text-emerald-700",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  not_required: "border-frosted-blue-200 bg-frosted-blue-50 text-deep-twilight-700",
  pending: "border-bright-teal-blue-100 bg-bright-teal-blue-50 text-bright-teal-blue-800",
};

function formatDateTime(value: string | null, locale: Locale): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAmount(value: string | null, locale: Locale): string {
  if (!value) {
    return "-";
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatBillingPeriod(task: AdminInvoiceTask, locale: Locale): string {
  if (!task.periodStart && !task.periodEnd) {
    return "-";
  }

  return `${formatDateTime(task.periodStart, locale)} - ${formatDateTime(
    task.periodEnd,
    locale,
  )}`;
}

function getBillingDisplayName(task: AdminInvoiceTask): string {
  return task.companyName ?? task.billingName ?? "-";
}

export function InvoiceTaskQueue({ locale, tasks }: InvoiceTaskQueueProps) {
  const tAdmin = useTranslations("Admin.billing");

  if (tasks.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-frosted-blue-300 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-deep-twilight-950">
          {tAdmin("empty.title")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
          {tAdmin("empty.description")}
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-frosted-blue-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] table-fixed divide-y divide-frosted-blue-100 text-left text-sm">
          <thead className="bg-frosted-blue-50 text-xs uppercase text-deep-twilight-700/70">
            <tr>
              <th className="w-36 px-4 py-3 font-semibold">
                {tAdmin("fields.createdAt")}
              </th>
              <th className="w-48 px-4 py-3 font-semibold">
                {tAdmin("fields.userEmail")}
              </th>
              <th className="w-48 px-4 py-3 font-semibold">
                {tAdmin("fields.billingName")}
              </th>
              <th className="w-44 px-4 py-3 font-semibold">
                {tAdmin("fields.customerType")}
              </th>
              <th className="w-40 px-4 py-3 font-semibold">
                {tAdmin("fields.subscription")}
              </th>
              <th className="w-28 px-4 py-3 text-right font-semibold">
                {tAdmin("fields.amountPaid")}
              </th>
              <th className="w-24 px-4 py-3 font-semibold">
                {tAdmin("fields.currency")}
              </th>
              <th className="w-56 px-4 py-3 font-semibold">
                {tAdmin("fields.billingPeriod")}
              </th>
              <th className="w-48 px-4 py-3 font-semibold">
                {tAdmin("fields.stripeInvoiceId")}
              </th>
              <th className="w-36 px-4 py-3 font-semibold">
                {tAdmin("fields.status")}
              </th>
              <th className="w-40 px-4 py-3 font-semibold">
                {tAdmin("fields.synesisInvoiceNumber")}
              </th>
              <th className="w-32 px-4 py-3 text-right font-semibold">
                {tAdmin("fields.review")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-frosted-blue-100">
            {tasks.map((task) => (
              <InvoiceTaskRow key={task.id} locale={locale} task={task} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type InvoiceTaskRowProps = {
  locale: Locale;
  task: AdminInvoiceTask;
};

function InvoiceTaskRow({ locale, task }: InvoiceTaskRowProps) {
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tAdmin = useTranslations("Admin.billing");
  const tBillingProfile = useTranslations("BillingProfile");
  const tBilling = useTranslations("Billing");
  const tCustomerTypes = useTranslations("CustomerTypes");
  const tPlans = useTranslations("Plans");
  const [currentTask, setCurrentTask] = useState(task);
  const [isExpanded, setIsExpanded] = useState(false);
  const [adminNotes, setAdminNotes] = useState(task.adminNotes ?? "");
  const [errorKey, setErrorKey] = useState<InvoiceTaskUpdateErrorKey | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [synesisInvoiceNumber, setSynesisInvoiceNumber] = useState(
    task.synesisInvoiceNumber ?? "",
  );
  const billingProfile = currentTask.billingSnapshot.billingProfile;
  const snapshotFields = getInvoiceTaskSnapshotFields(billingProfile);
  const showEuB2gReviewNotice = shouldShowEuB2gReviewNotice(
    currentTask.customerType,
  );
  const subscriptionLabel = currentTask.subscriptionPlan
    ? `${tPlans(`${currentTask.subscriptionPlan}.name`)} / ${tBilling(
        `statuses.${currentTask.subscriptionStatus ?? "free"}`,
      )}`
    : "-";

  function getErrorMessage(key: InvoiceTaskUpdateErrorKey): string {
    if (key === "synesisRequired") {
      return tAdmin("errors.synesisInvoiceNumberRequired");
    }

    if (key === "issuedLocked") {
      return tAdmin("errors.issuedStatusLocked");
    }

    return tAdmin("errors.saveFailed");
  }

  async function updateTask(nextStatus?: InvoiceTaskStatus) {
    if (nextStatus === "issued" && synesisInvoiceNumber.trim().length === 0) {
      setErrorKey("synesisRequired");
      setShowSaved(false);
      return;
    }

    setErrorKey(null);
    setShowSaved(false);
    setIsSaving(true);

    const response = await fetch(`/api/admin/invoice-tasks/${currentTask.id}`, {
      body: JSON.stringify({
        adminNotes,
        status: nextStatus,
        synesisInvoiceNumber,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    const payload = (await response
      .json()
      .catch((): UpdateAdminInvoiceTaskResponse | null => null)) as
      | UpdateAdminInvoiceTaskResponse
      | null;

    setIsSaving(false);

    if (!response.ok || !payload?.ok) {
      const code = payload && !payload.ok ? payload.error.code : null;

      setErrorKey(
        code === "synesis_invoice_number_required"
          ? "synesisRequired"
          : code === "issued_status_locked"
            ? "issuedLocked"
            : "saveFailed",
      );
      return;
    }

    setCurrentTask(payload.task);
    setAdminNotes(payload.task.adminNotes ?? "");
    setSynesisInvoiceNumber(payload.task.synesisInvoiceNumber ?? "");
    setShowSaved(true);
    router.refresh();
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void updateTask();
  }

  return (
    <>
      <tr className="align-top hover:bg-frosted-blue-50/60">
        <td className="px-4 py-4 text-deep-twilight-700">
          {formatDateTime(currentTask.createdAt, locale)}
        </td>
        <td className="px-4 py-4 font-medium text-deep-twilight-950">
          <span className="block truncate">{currentTask.userEmail}</span>
        </td>
        <td className="px-4 py-4 text-deep-twilight-800">
          <span className="block truncate">
            {getBillingDisplayName(currentTask)}
          </span>
        </td>
        <td className="px-4 py-4 text-deep-twilight-700">
          {tCustomerTypes(currentTask.customerType)}
        </td>
        <td className="px-4 py-4 text-deep-twilight-700">
          {subscriptionLabel}
        </td>
        <td className="px-4 py-4 text-right font-medium text-deep-twilight-950">
          {formatAmount(currentTask.amountPaid, locale)}
        </td>
        <td className="px-4 py-4 uppercase text-deep-twilight-700">
          {currentTask.currency}
        </td>
        <td className="px-4 py-4 text-deep-twilight-700">
          {formatBillingPeriod(currentTask, locale)}
        </td>
        <td className="px-4 py-4 font-mono text-xs text-deep-twilight-700">
          <span className="block truncate">
            {currentTask.stripeInvoiceId ?? "-"}
          </span>
        </td>
        <td className="px-4 py-4">
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
              statusBadgeClassNames[currentTask.status],
            )}
          >
            {tAdmin(`statuses.${currentTask.status}`)}
          </span>
        </td>
        <td className="px-4 py-4 text-deep-twilight-700">
          <span className="block truncate">
            {currentTask.synesisInvoiceNumber ?? "-"}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          <Button
            className="h-9 px-3"
            onClick={() => setIsExpanded((current) => !current)}
            variant="secondary"
          >
            {isExpanded
              ? tAdmin("actions.closeReview")
              : tAdmin("actions.openReview")}
          </Button>
        </td>
      </tr>
      {isExpanded ? (
        <tr>
          <td className="bg-frosted-blue-50/45 px-4 py-5" colSpan={12}>
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="min-w-0 rounded-lg border border-frosted-blue-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-deep-twilight-950">
                  {tAdmin("detail.billingSnapshot")}
                </h3>
                {snapshotFields.length > 0 ? (
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {snapshotFields.map((field) => (
                      <div
                        className={cn(
                          "min-w-0",
                          field.isImportant || field.isMissing
                            ? "rounded-md border px-3 py-2"
                            : "",
                          field.isMissing
                            ? "border-amber-300 bg-amber-50"
                            : field.isImportant
                              ? "border-bright-teal-blue-100 bg-bright-teal-blue-50/55"
                              : "",
                        )}
                        key={field.key}
                      >
                        <dt className="text-xs font-medium uppercase text-deep-twilight-700/55">
                          {tBillingProfile(`fields.${field.labelKey}`)}
                        </dt>
                        <dd
                          className={cn(
                            "mt-1 break-words text-sm font-medium",
                            field.isMissing
                              ? "text-amber-950"
                              : "text-deep-twilight-950",
                          )}
                        >
                          {field.value ??
                            (field.isMissing
                              ? tAdmin("detail.missingValue")
                              : tAdmin("detail.notProvidedValue"))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-deep-twilight-700">
                    {tAdmin("detail.noSnapshot")}
                  </p>
                )}
                {showEuB2gReviewNotice ? (
                  <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                    {tAdmin("detail.euB2gReviewNotice")}
                  </p>
                ) : null}
                {currentTask.billingSnapshot.missingFields.length > 0 ? (
                  <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                    {tAdmin("detail.missingFields", {
                      fields: currentTask.billingSnapshot.missingFields
                        .map((field) => tBillingProfile(`fields.${field}`))
                        .join(", "),
                    })}
                  </p>
                ) : null}
              </div>

              <form
                className="min-w-0 rounded-lg border border-frosted-blue-200 bg-white p-4"
                onSubmit={handleSave}
              >
                <h3 className="text-sm font-semibold text-deep-twilight-950">
                  {tAdmin("detail.review")}
                </h3>
                <dl className="mt-4 grid gap-3 text-sm">
                  <DetailItem
                    label={tAdmin("fields.stripeCustomerId")}
                    value={currentTask.stripeCustomerId}
                  />
                  <DetailItem
                    label={tAdmin("fields.stripeSubscriptionId")}
                    value={currentTask.stripeSubscriptionId}
                  />
                  <DetailItem
                    label={tAdmin("fields.stripeInvoiceId")}
                    value={currentTask.stripeInvoiceId}
                  />
                  <DetailItem
                    label={tAdmin("fields.stripePaymentIntentId")}
                    value={currentTask.stripePaymentIntentId}
                  />
                  <DetailItem
                    label={tAdmin("fields.amountPaid")}
                    value={`${formatAmount(currentTask.amountPaid, locale)} ${
                      currentTask.currency
                    }`}
                  />
                  <DetailItem
                    label={tAdmin("fields.billingPeriod")}
                    value={formatBillingPeriod(currentTask, locale)}
                  />
                  <DetailItem
                    label={tAdmin("fields.reviewedAt")}
                    value={formatDateTime(currentTask.reviewedAt, locale)}
                  />
                  <DetailItem
                    label={tAdmin("fields.issuedAt")}
                    value={formatDateTime(currentTask.issuedAt, locale)}
                  />
                </dl>

                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium text-deep-twilight-800">
                    {tAdmin("fields.synesisInvoiceNumber")}
                    <input
                      className={formControlClassName}
                      disabled={isSaving}
                      onChange={(event) => {
                        setErrorKey(null);
                        setShowSaved(false);
                        setSynesisInvoiceNumber(event.target.value);
                      }}
                      type="text"
                      value={synesisInvoiceNumber}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-deep-twilight-800">
                    {tAdmin("fields.adminNotes")}
                    <textarea
                      className={cn(formControlClassName, "min-h-28 py-3")}
                      disabled={isSaving}
                      onChange={(event) => {
                        setErrorKey(null);
                        setShowSaved(false);
                        setAdminNotes(event.target.value);
                      }}
                      value={adminNotes}
                    />
                  </label>
                </div>

                {errorKey ? (
                  <p className="mt-3 text-sm font-medium text-red-700">
                    {getErrorMessage(errorKey)}
                  </p>
                ) : showSaved ? (
                  <p className="mt-3 text-sm font-medium text-emerald-700">
                    {tAdmin("messages.saved")}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button disabled={isSaving} type="submit" variant="secondary">
                    <Save aria-hidden="true" className="h-4 w-4" />
                    {isSaving ? tActions("saving") : tActions("save")}
                  </Button>
                  <StatusButton
                    disabled={isSaving || currentTask.status === "issued"}
                    icon={AlertTriangle}
                    label={tAdmin("actions.markNeedsReview")}
                    onClick={() => void updateTask("needs_review")}
                  />
                  <StatusButton
                    disabled={isSaving || currentTask.status === "issued"}
                    icon={XCircle}
                    label={tAdmin("actions.markFailed")}
                    onClick={() => void updateTask("failed")}
                  />
                  <StatusButton
                    disabled={isSaving || currentTask.status === "issued"}
                    icon={MinusCircle}
                    label={tAdmin("actions.markNotRequired")}
                    onClick={() => void updateTask("not_required")}
                  />
                  <StatusButton
                    disabled={isSaving}
                    icon={CheckCircle2}
                    label={tAdmin("actions.markIssued")}
                    onClick={() => void updateTask("issued")}
                    primary
                  />
                </div>
              </form>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

type DetailItemProps = {
  label: string;
  value: string | null;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase text-deep-twilight-700/55">
        {label}
      </dt>
      <dd className="break-words font-mono text-xs text-deep-twilight-800">
        {value ?? "-"}
      </dd>
    </div>
  );
}

type StatusButtonProps = {
  disabled: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
  primary?: boolean;
};

function StatusButton({
  disabled,
  icon: Icon,
  label,
  onClick,
  primary = false,
}: StatusButtonProps) {
  return (
    <Button
      className="px-3"
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={primary ? "primary" : "secondary"}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </Button>
  );
}
