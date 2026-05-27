"use client";

import { FileSearch, Trash2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ComponentProps, useState } from "react";

import { ResendVerificationEmailButton } from "@/components/auth/resend-verification-email-button";
import { Button } from "@/components/ui/button";
import { LocalizedFileInput } from "@/components/ui/localized-file-input";
import { validateProjectDocumentFile } from "@/lib/validations/project-document.schema";
import type {
  AnalyzeProjectDocumentResponse,
  DeleteProjectDocumentResponse,
  ProjectDocumentErrorCode,
  UploadProjectDocumentResponse,
} from "@/types/project-document";

type ProjectDocumentUploadFormProps = {
  projectId: string;
};

type ProjectDocumentDeleteButtonProps = {
  documentId: string;
  projectId: string;
};

type ProjectDocumentActionErrorKey =
  | "errors.fallback"
  | "errors.analysisFailed"
  | "errors.analysisInProgress"
  | "errors.analysisLimitReached"
  | "errors.emailNotVerified"
  | "errors.fileTooLarge"
  | "errors.invalidFile"
  | "errors.invalidInput"
  | "errors.invalidPdfFile"
  | "errors.invalidStoragePath"
  | "errors.notFound"
  | "errors.proPlanRequired"
  | "errors.rateLimited"
  | "errors.serverError"
  | "errors.storageDownloadFailed"
  | "errors.uploadFailed";

type DocumentUploadState = {
  errorKey: ProjectDocumentActionErrorKey | null;
  file: File | null;
  isSubmitting: boolean;
  success: boolean;
};
type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

const actionErrorKeysByCode: Record<
  ProjectDocumentErrorCode,
  ProjectDocumentActionErrorKey
> = {
  ai_failed: "errors.analysisFailed",
  already_analyzed: "errors.fallback",
  analysis_failed: "errors.analysisFailed",
  analysis_in_progress: "errors.analysisInProgress",
  analysis_limit_reached: "errors.analysisLimitReached",
  email_not_verified: "errors.emailNotVerified",
  file_too_large: "errors.fileTooLarge",
  invalid_file: "errors.invalidFile",
  invalid_input: "errors.invalidInput",
  invalid_storage_path: "errors.invalidStoragePath",
  no_accepted_materials: "errors.fallback",
  not_found: "errors.notFound",
  pro_plan_required: "errors.proPlanRequired",
  quote_limit_reached: "errors.fallback",
  rate_limited: "errors.rateLimited",
  server_error: "errors.serverError",
  storage_download_failed: "errors.storageDownloadFailed",
  unsupported_file_type: "errors.invalidPdfFile",
  upload_failed: "errors.uploadFailed",
};

function validateSelectedFile(file: File): ProjectDocumentActionErrorKey | null {
  const error = validateProjectDocumentFile(file);

  if (!error) {
    return null;
  }

  return actionErrorKeysByCode[error.code];
}

export function ProjectDocumentUploadForm({
  projectId,
}: ProjectDocumentUploadFormProps) {
  const router = useRouter();
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const [state, setState] = useState<DocumentUploadState>({
    errorKey: null,
    file: null,
    isSubmitting: false,
    success: false,
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setState((currentState) => ({
        ...currentState,
        errorKey: null,
        file: null,
        success: false,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      errorKey: validateSelectedFile(selectedFile),
      file: selectedFile,
      success: false,
    }));
  }

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!state.file) {
      setState((currentState) => ({
        ...currentState,
        errorKey: "errors.invalidFile",
        success: false,
      }));
      return;
    }

    const clientValidationError = validateSelectedFile(state.file);

    if (clientValidationError) {
      setState((currentState) => ({
        ...currentState,
        errorKey: clientValidationError,
        success: false,
      }));
      return;
    }

    const formData = new FormData();
    formData.set("file", state.file);
    setState((currentState) => ({
      ...currentState,
      errorKey: null,
      isSubmitting: true,
      success: false,
    }));

    const response = await fetch(
      `/api/projects/${projectId}/documents/upload`,
      {
        body: formData,
        method: "POST",
      },
    );
    const payload = (await response.json()) as UploadProjectDocumentResponse;

    if (!response.ok || !payload.ok) {
      const errorKey =
        "error" in payload
          ? actionErrorKeysByCode[payload.error.code]
          : "errors.fallback";
      setState((currentState) => ({
        ...currentState,
        errorKey,
        isSubmitting: false,
      }));
      return;
    }

    setState({
      errorKey: null,
      file: null,
      isSubmitting: false,
      success: true,
    });
    form.reset();
    router.refresh();
  }

  return (
    <form className="flex min-w-0 flex-col gap-3" onSubmit={handleSubmit}>
      <LocalizedFileInput
        accept="application/pdf"
        ariaLabel={tDocs("uploadInputAriaLabel")}
        chooseFileLabel={tDocs("fileInput.chooseFile")}
        id="project-document-upload-file"
        name="file"
        noFileSelectedLabel={tDocs("fileInput.noFileSelected")}
        onChange={handleFileChange}
        selectedFileName={state.file?.name}
      />
      {state.errorKey ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {tDocs(state.errorKey)}
        </p>
      ) : null}
      {state.errorKey === "errors.emailNotVerified" ? (
        <ResendVerificationEmailButton />
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {tDocs("documentUploaded")}
        </p>
      ) : null}
      <Button disabled={state.isSubmitting} type="submit">
        <UploadCloud aria-hidden="true" className="h-4 w-4" />
        {state.isSubmitting ? tDocs("uploading") : tDocs("uploadProjectPdf")}
      </Button>
    </form>
  );
}

export function ProjectDocumentDeleteButton({
  documentId,
  projectId,
}: ProjectDocumentDeleteButtonProps) {
  const router = useRouter();
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const [errorKey, setErrorKey] =
    useState<ProjectDocumentActionErrorKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setErrorKey(null);
    setIsDeleting(true);

    const response = await fetch(
      `/api/projects/${projectId}/documents/${documentId}`,
      {
        method: "DELETE",
      },
    );
    const payload = (await response.json()) as DeleteProjectDocumentResponse;

    setIsDeleting(false);

    if (!response.ok || !payload.ok) {
      const nextErrorKey =
        "error" in payload
          ? actionErrorKeysByCode[payload.error.code]
          : "errors.fallback";
      setErrorKey(nextErrorKey);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <Button
        disabled={isDeleting}
        onClick={handleDelete}
        type="button"
        variant="secondary"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        {isDeleting ? tDocs("deleting") : tDocs("deleteDocument")}
      </Button>
      {errorKey ? (
        <p className="text-sm text-red-700">{tDocs(errorKey)}</p>
      ) : null}
    </div>
  );
}

export function ProjectDocumentAnalyzeButton({
  documentId,
  projectId,
}: ProjectDocumentDeleteButtonProps) {
  const router = useRouter();
  const tDocs = useTranslations("ProjectDocumentationAnalysis");
  const [errorKey, setErrorKey] =
    useState<ProjectDocumentActionErrorKey | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleAnalyze() {
    setErrorKey(null);
    setIsAnalyzing(true);

    const response = await fetch(
      `/api/projects/${projectId}/documents/${documentId}/analyze`,
      {
        method: "POST",
      },
    );
    const payload = (await response.json()) as AnalyzeProjectDocumentResponse;

    setIsAnalyzing(false);

    if (!response.ok || !payload.ok) {
      const nextErrorKey =
        "error" in payload
          ? actionErrorKeysByCode[payload.error.code]
          : "errors.fallback";
      setErrorKey(nextErrorKey);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <Button
        disabled={isAnalyzing}
        onClick={handleAnalyze}
        type="button"
      >
        <FileSearch aria-hidden="true" className="h-4 w-4" />
        {isAnalyzing ? tDocs("analyzingDocument") : tDocs("analyzeDocument")}
      </Button>
      {errorKey ? (
        <p className="text-sm text-red-700">{tDocs(errorKey)}</p>
      ) : null}
    </div>
  );
}
