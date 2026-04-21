import { NextResponse } from "next/server";
import { z } from "zod";

import { signUpSchema } from "@/lib/validations/auth.schema";
import { createUserWithPassword } from "@/server/services/auth-service";
import type { SignUpResponse } from "@/types/auth";

const invalidInputResponse: SignUpResponse = {
  ok: false,
  error: {
    code: "invalid_input",
    message: "Enter a valid email and a password with at least 8 characters.",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch((): unknown => null);
    const input = signUpSchema.parse(body);
    const result = await createUserWithPassword(input);

    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(invalidInputResponse, { status: 400 });
    }

    const response: SignUpResponse = {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to create account.",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
