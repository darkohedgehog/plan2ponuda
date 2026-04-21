"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MAX_FLOOR_PLAN_FILE_SIZE_BYTES,
  isAllowedFloorPlanMimeType,
} from "@/lib/validations/project.schema";
import type { UploadFloorPlanResponse } from "@/types/project";

type FloorPlanUploadFormProps = {
  projectId: string;
};

type FloorPlanUploadState = {
  error: string | null;
  file: File | null;
  isSubmitting: boolean;
  uploadedPath: string | null;
};

function validateSelectedFile(file: File): string | null {
  if (!isAllowedFloorPlanMimeType(file.type)) {
    return "Upload a PDF, PNG, JPG, or JPEG floor plan.";
  }

  if (file.size > MAX_FLOOR_PLAN_FILE_SIZE_BYTES) {
    return "Floor plan files must be 10MB or smaller.";
  }

  return null;
}

export function FloorPlanUploadForm({ projectId }: FloorPlanUploadFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FloorPlanUploadState>({
    error: null,
    file: null,
    isSubmitting: false,
    uploadedPath: null,
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setState((currentState) => ({
        ...currentState,
        error: null,
        file: null,
        uploadedPath: null,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      error: validateSelectedFile(selectedFile),
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
        error: "Select a floor plan file to upload.",
      }));
      return;
    }

    const clientValidationError = validateSelectedFile(state.file);

    if (clientValidationError) {
      setState((currentState) => ({
        ...currentState,
        error: clientValidationError,
      }));
      return;
    }

    const formData = new FormData();
    formData.set("file", state.file);
    setState((currentState) => ({
      ...currentState,
      error: null,
      isSubmitting: true,
    }));

    const response = await fetch(`/api/projects/${projectId}/upload`, {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as UploadFloorPlanResponse;

    if (!response.ok || !payload.ok) {
      const message =
        "error" in payload ? payload.error.message : "Unable to upload floor plan.";
      setState((currentState) => ({
        ...currentState,
        error: message,
        isSubmitting: false,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      error: null,
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
        className="rounded-md border border-border p-3"
        name="file"
        onChange={handleFileChange}
        type="file"
      />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.uploadedPath ? (
        <p className="text-sm text-slate-600">Uploaded: {state.uploadedPath}</p>
      ) : null}
      <Button disabled={state.isSubmitting} type="submit">
        {state.isSubmitting ? "Uploading..." : "Upload floor plan"}
      </Button>
    </form>
  );
}
