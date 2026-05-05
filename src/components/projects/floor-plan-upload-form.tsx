"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { fileControlClassName } from "@/components/ui/form-control";
import {
  MAX_FLOOR_PLAN_FILE_SIZE_BYTES,
  isAllowedFloorPlanMimeType,
} from "@/lib/validations/project.schema";
import type {
  ProjectErrorCode,
  UploadFloorPlanResponse,
} from "@/types/project";

type FloorPlanUploadFormProps = {
  projectId: string;
};

type UploadErrorMessageKey =
  | "errors.fallback"
  | "errors.fileTooLarge"
  | "errors.invalidFile"
  | "errors.invalidInput"
  | "errors.invalidType"
  | "errors.notFound"
  | "errors.required"
  | "errors.serverError"
  | "errors.tooLarge"
  | "errors.unsupportedFileType"
  | "errors.uploadFailed";

type FloorPlanUploadState = {
  errorKey: UploadErrorMessageKey | null;
  file: File | null;
  isSubmitting: boolean;
  uploadedPath: string | null;
};

const uploadErrorKeysByCode: Record<ProjectErrorCode, UploadErrorMessageKey> = {
  file_too_large: "errors.fileTooLarge",
  invalid_file: "errors.invalidFile",
  invalid_input: "errors.invalidInput",
  not_found: "errors.notFound",
  server_error: "errors.serverError",
  unsupported_file_type: "errors.unsupportedFileType",
  upload_failed: "errors.uploadFailed",
};

function validateSelectedFile(file: File): UploadErrorMessageKey | null {
  if (!isAllowedFloorPlanMimeType(file.type)) {
    return "errors.invalidType";
  }

  if (file.size > MAX_FLOOR_PLAN_FILE_SIZE_BYTES) {
    return "errors.tooLarge";
  }

  return null;
}

export function FloorPlanUploadForm({ projectId }: FloorPlanUploadFormProps) {
  const router = useRouter();
  const tUpload = useTranslations("Upload");
  const [state, setState] = useState<FloorPlanUploadState>({
    errorKey: null,
    file: null,
    isSubmitting: false,
    uploadedPath: null,
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setState((currentState) => ({
        ...currentState,
        errorKey: null,
        file: null,
        uploadedPath: null,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      errorKey: validateSelectedFile(selectedFile),
      file: selectedFile,
      uploadedPath: null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!state.file) {
      setState((currentState) => ({
        ...currentState,
        errorKey: "errors.required",
      }));
      return;
    }

    const clientValidationError = validateSelectedFile(state.file);

    if (clientValidationError) {
      setState((currentState) => ({
        ...currentState,
        errorKey: clientValidationError,
      }));
      return;
    }

    const formData = new FormData();
    formData.set("file", state.file);
    setState((currentState) => ({
      ...currentState,
      errorKey: null,
      isSubmitting: true,
    }));

    const response = await fetch(`/api/projects/${projectId}/upload`, {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as UploadFloorPlanResponse;

    if (!response.ok || !payload.ok) {
      const errorKey =
        "error" in payload
          ? uploadErrorKeysByCode[payload.error.code]
          : "errors.fallback";
      setState((currentState) => ({
        ...currentState,
        errorKey,
        isSubmitting: false,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      errorKey: null,
      file: null,
      isSubmitting: false,
      uploadedPath: payload.filePath,
    }));
    form.reset();
    router.refresh();
  }

  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
      <input
        accept="application/pdf,image/png,image/jpeg"
        aria-label={tUpload("inputAriaLabel")}
        className={fileControlClassName}
        name="file"
        onChange={handleFileChange}
        type="file"
      />
      {state.errorKey ? (
        <p className="text-sm text-red-600">{tUpload(state.errorKey)}</p>
      ) : null}
      {state.uploadedPath ? (
        <p className="text-sm text-slate-600">
          {tUpload("success.uploaded", { path: state.uploadedPath })}
        </p>
      ) : null}
      <Button disabled={state.isSubmitting} type="submit">
        {state.isSubmitting
          ? tUpload("actions.uploading")
          : tUpload("actions.uploadFloorPlan")}
      </Button>
    </form>
  );
}
