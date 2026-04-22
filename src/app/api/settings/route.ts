import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import { updateSettingsSchema } from "@/lib/validations/settings.schema";
import { updateUserSettings } from "@/server/services/settings-service";
import type { SaveSettingsResponse } from "@/types/settings";

const invalidInputResponse: SaveSettingsResponse = {
  error: {
    code: "invalid_input",
    message: "Enter valid profile, company, and estimating preference values.",
  },
  ok: false,
};

export async function PUT(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = updateSettingsSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(invalidInputResponse, { status: 400 });
  }

  const settings = await updateUserSettings(
    auth.user.id,
    parsedInput.data,
  ).catch((error: unknown) => {
    console.error("Settings save failed", error);

    return null;
  });

  if (!settings) {
    const response: SaveSettingsResponse = {
      error: {
        code: "server_error",
        message: "Unable to save settings.",
      },
      ok: false,
    };

    return NextResponse.json(response, { status: 500 });
  }

  const response: SaveSettingsResponse = {
    ok: true,
    settings,
  };

  return NextResponse.json(response);
}
