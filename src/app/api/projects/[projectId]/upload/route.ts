import { NextResponse } from "next/server";

import { requireApiVerifiedUser } from "@/lib/auth/guards";
import {
  MAX_FLOOR_PLAN_UPLOAD_BODY_SIZE_BYTES,
  isFileInput,
  projectIdSchema,
  uploadFloorPlanSchema,
  validateFloorPlanFile,
} from "@/lib/validations/project.schema";
import { isUploadBodyTooLarge } from "@/lib/validations/upload-request";
import { uploadFloorPlan } from "@/server/services/project-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type { ProjectError, UploadFloorPlanResponse } from "@/types/project";

type UploadFloorPlanRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

const invalidFileError: ProjectError = {
  code: "invalid_file",
  message: "Select a floor plan file to upload.",
};

function getFileValidationError(fileInput: FormDataEntryValue | null): ProjectError {
  if (!isFileInput(fileInput)) {
    return invalidFileError;
  }

  return validateFloorPlanFile(fileInput) ?? invalidFileError;
}

function getUploadErrorStatus(error: ProjectError): number {
  switch (error.code) {
    case "file_too_large":
      return 413;
    case "floor_plan_limit_reached":
      return 403;
    case "not_found":
      return 404;
    case "server_error":
      return 500;
    default:
      return 400;
  }
}

export async function POST(
  request: Request,
  context: UploadFloorPlanRouteContext,
) {
  const auth = await requireApiVerifiedUser();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    await checkRateLimitOrThrow({
      key: createUserRateLimitKey({
        userId: auth.user.id,
      }),
      scope: RATE_LIMIT_SCOPES.floorPlanUpload,
      ...RATE_LIMIT_POLICIES.floorPlanUpload,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: UploadFloorPlanResponse = {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many upload requests. Please try again later.",
        },
      };

      return NextResponse.json(response, {
        headers: getRateLimitHeaders(error.status),
        status: 429,
      });
    }

    console.error("Floor plan upload rate limit failed", error);

    const response: UploadFloorPlanResponse = {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to upload floor plan.",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    const response: UploadFloorPlanResponse = {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Invalid project id.",
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  if (
    isUploadBodyTooLarge(
      request.headers,
      MAX_FLOOR_PLAN_UPLOAD_BODY_SIZE_BYTES,
    )
  ) {
    const response: UploadFloorPlanResponse = {
      ok: false,
      error: {
        code: "file_too_large",
        message: "Floor plan files must be 10MB or smaller.",
      },
    };

    return NextResponse.json(response, { status: 413 });
  }

  const formData = await request.formData().catch((): FormData | null => null);
  const fileInput = formData?.get("file") ?? null;
  const parsedInput = uploadFloorPlanSchema.safeParse({ file: fileInput });

  if (!parsedInput.success) {
    const error = getFileValidationError(fileInput);
    const status = error.code === "file_too_large" ? 413 : 400;
    const response: UploadFloorPlanResponse = {
      ok: false,
      error,
    };

    return NextResponse.json(response, { status });
  }

  const result = await uploadFloorPlan({
    projectId: parsedParams.data.projectId,
    userId: auth.user.id,
    file: parsedInput.data.file,
  }).catch((error: unknown): UploadFloorPlanResponse => {
    console.error("Floor plan upload failed", error);

    return {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to upload floor plan.",
      },
    };
  });

  if (!result.ok) {
    return NextResponse.json(result, {
      status: getUploadErrorStatus(result.error),
    });
  }

  return NextResponse.json(result);
}
