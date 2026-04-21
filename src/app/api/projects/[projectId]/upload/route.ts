import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";
import {
  isFileInput,
  projectIdSchema,
  uploadFloorPlanSchema,
  validateFloorPlanFile,
} from "@/lib/validations/project.schema";
import { uploadFloorPlan } from "@/server/services/project-service";
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
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
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
