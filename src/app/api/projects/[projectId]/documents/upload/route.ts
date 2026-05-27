import { NextResponse } from "next/server";

import { requireApiVerifiedUser } from "@/lib/auth/guards";
import { projectIdSchema } from "@/lib/validations/project.schema";
import {
  uploadProjectDocumentSchema,
  validateProjectDocumentFile,
} from "@/lib/validations/project-document.schema";
import { uploadProjectDocument } from "@/server/services/project-document-service";
import {
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
  checkRateLimitOrThrow,
  createUserRateLimitKey,
  getRateLimitHeaders,
} from "@/server/services/rate-limit-service";
import type {
  ProjectDocumentError,
  UploadProjectDocumentResponse,
} from "@/types/project-document";

type UploadProjectDocumentRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

const invalidFileError: ProjectDocumentError = {
  code: "invalid_file",
  message: "Select a project PDF to upload.",
};

function isFileInput(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function getFileValidationError(
  fileInput: FormDataEntryValue | null,
): ProjectDocumentError {
  if (!isFileInput(fileInput)) {
    return invalidFileError;
  }

  return validateProjectDocumentFile(fileInput) ?? invalidFileError;
}

function getUploadErrorStatus(error: ProjectDocumentError): number {
  switch (error.code) {
    case "file_too_large":
      return 413;
    case "not_found":
      return 404;
    case "pro_plan_required":
      return 403;
    case "server_error":
      return 500;
    default:
      return 400;
  }
}

export async function POST(
  request: Request,
  context: UploadProjectDocumentRouteContext,
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
      scope: RATE_LIMIT_SCOPES.projectDocumentUpload,
      ...RATE_LIMIT_POLICIES.projectDocumentUpload,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      const response: UploadProjectDocumentResponse = {
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

    console.error("Project document upload rate limit failed", error);

    const response: UploadProjectDocumentResponse = {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to upload project documentation.",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }

  const parsedParams = projectIdSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    const response: UploadProjectDocumentResponse = {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Invalid project id.",
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  const formData = await request.formData().catch((): FormData | null => null);
  const fileInput = formData?.get("file") ?? null;
  const parsedInput = uploadProjectDocumentSchema.safeParse({
    file: fileInput,
  });

  if (!parsedInput.success) {
    const error = getFileValidationError(fileInput);
    const status = error.code === "file_too_large" ? 413 : 400;
    const response: UploadProjectDocumentResponse = {
      ok: false,
      error,
    };

    return NextResponse.json(response, { status });
  }

  const result = await uploadProjectDocument({
    file: parsedInput.data.file,
    projectId: parsedParams.data.projectId,
    userId: auth.user.id,
  }).catch((error: unknown): UploadProjectDocumentResponse => {
    console.error("Project document upload failed", error);

    return {
      ok: false,
      error: {
        code: "server_error",
        message: "Unable to upload project documentation.",
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
