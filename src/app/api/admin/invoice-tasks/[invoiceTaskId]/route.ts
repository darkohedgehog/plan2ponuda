import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/guards";
import {
  invoiceTaskIdParamSchema,
  updateInvoiceTaskSchema,
} from "@/lib/validations/billing.schema";
import { updateAdminInvoiceTask } from "@/server/services/invoice-task-service";
import type { UpdateAdminInvoiceTaskResponse } from "@/types/billing";

type InvoiceTaskRouteContext = {
  params: Promise<{
    invoiceTaskId: string;
  }>;
};

function getServiceErrorResponse(
  reason:
    | "invoice_task_not_found"
    | "issued_status_locked"
    | "synesis_invoice_number_required",
): { body: UpdateAdminInvoiceTaskResponse; status: number } {
  if (reason === "invoice_task_not_found") {
    return {
      body: {
        error: {
          code: "invoice_task_not_found",
          message: "Invoice task not found.",
        },
        ok: false,
      },
      status: 404,
    };
  }

  if (reason === "issued_status_locked") {
    return {
      body: {
        error: {
          code: "issued_status_locked",
          message: "Issued invoice tasks cannot be moved to another status.",
        },
        ok: false,
      },
      status: 409,
    };
  }

  return {
    body: {
      error: {
        code: "synesis_invoice_number_required",
        message: "Synesis invoice number is required when marking issued.",
      },
      ok: false,
    },
    status: 400,
  };
}

export async function PATCH(
  request: Request,
  context: InvoiceTaskRouteContext,
) {
  const auth = await requireApiAdmin();

  if (!auth.ok) {
    const response: UpdateAdminInvoiceTaskResponse = {
      error: {
        code: auth.response.status === 401 ? "unauthorized" : "forbidden",
        message: auth.response.status === 401 ? "Unauthorized" : "Forbidden",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: auth.response.status });
  }

  const parsedParams = invoiceTaskIdParamSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    const response: UpdateAdminInvoiceTaskResponse = {
      error: {
        code: "invalid_input",
        message: "Invalid invoice task.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = updateInvoiceTaskSchema.safeParse(body);

  if (!parsedInput.success) {
    const response: UpdateAdminInvoiceTaskResponse = {
      error: {
        code: "invalid_input",
        message: "Enter valid invoice task update values.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  const result = await updateAdminInvoiceTask(
    parsedParams.data.invoiceTaskId,
    parsedInput.data,
  ).catch((error: unknown) => {
    console.error("Invoice task update failed", error);

    return "server_error" as const;
  });

  if (result === "server_error") {
    const response: UpdateAdminInvoiceTaskResponse = {
      error: {
        code: "server_error",
        message: "Unable to update invoice task.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  if (!result.ok) {
    const response = getServiceErrorResponse(result.reason);

    return NextResponse.json(response.body, { status: response.status });
  }

  const response: UpdateAdminInvoiceTaskResponse = {
    ok: true,
    task: result.task,
  };

  return NextResponse.json(response);
}
