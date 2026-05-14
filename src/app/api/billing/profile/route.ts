import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { updateBillingProfileSchema } from "@/lib/validations/billing.schema";
import {
  getBillingProfile,
  upsertBillingProfile,
} from "@/server/services/billing-service";
import type {
  BillingProfileResponse,
  SaveBillingProfileResponse,
} from "@/types/billing";

const invalidInputResponse: SaveBillingProfileResponse = {
  error: {
    code: "invalid_input",
    message: "Enter valid billing profile values.",
  },
  ok: false,
};

export async function GET() {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const profile = await getBillingProfile(auth.user.id).catch(
    (error: unknown): "load_failed" => {
      console.error("Billing profile load failed", error);

      return "load_failed";
    },
  );

  if (profile === "load_failed") {
    const response: BillingProfileResponse = {
      error: {
        code: "server_error",
        message: "Unable to load billing profile.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const response: BillingProfileResponse = {
    ok: true,
    profile,
  };

  return NextResponse.json(response);
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = updateBillingProfileSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const profile = await upsertBillingProfile(auth.user.id, parsedInput.data).catch(
    (error: unknown) => {
      console.error("Billing profile save failed", error);

      return null;
    },
  );

  if (!profile) {
    const response: SaveBillingProfileResponse = {
      error: {
        code: "server_error",
        message: "Unable to save billing profile.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const response: SaveBillingProfileResponse = {
    ok: true,
    profile,
  };

  return NextResponse.json(response);
}
