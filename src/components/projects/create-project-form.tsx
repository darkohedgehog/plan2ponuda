"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import { useRouter } from "@/i18n/navigation";
import type {
  CreateProjectResponse,
  ObjectType,
  ProjectErrorCode,
} from "@/types/project";

type CreateProjectFormState = {
  errorKey: CreateProjectErrorKey | null;
  isSubmitting: boolean;
};

type CreateProjectErrorKey = "invalidInput" | "serverError";
type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

const createProjectErrorKeysByCode: Partial<
  Record<ProjectErrorCode, CreateProjectErrorKey>
> = {
  invalid_input: "invalidInput",
  server_error: "serverError",
};

export function CreateProjectForm() {
  const router = useRouter();
  const tActions = useTranslations("Actions");
  const tProjects = useTranslations("Projects");
  const tValidation = useTranslations("Validation");
  const [state, setState] = useState<CreateProjectFormState>({
    errorKey: null,
    isSubmitting: false,
  });

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setState({ errorKey: null, isSubmitting: true });

    const formData = new FormData(event.currentTarget);
    const areaM2 = Number(formData.get("areaM2"));
    const clientName = String(formData.get("clientName") ?? "").trim();

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        clientName: clientName || undefined,
        objectType: String(formData.get("objectType") ?? "apartment") as ObjectType,
        areaM2,
      }),
    });
    const payload = (await response.json()) as CreateProjectResponse;

    if (!response.ok || !payload.ok) {
      const errorKey =
        "error" in payload
          ? createProjectErrorKeysByCode[payload.error.code] ?? "serverError"
          : "serverError";

      setState({ errorKey, isSubmitting: false });
      return;
    }

    router.push(`/dashboard/projects/${payload.projectId}`);
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        className={formControlClassName}
        minLength={3}
        name="name"
        placeholder={tProjects("form.projectNamePlaceholder")}
        required
        type="text"
      />
      <input
        className={formControlClassName}
        name="clientName"
        placeholder={tProjects("form.clientNamePlaceholder")}
        type="text"
      />
      <select
        className={formControlClassName}
        defaultValue="apartment"
        name="objectType"
      >
        <option value="apartment">{tProjects("objectTypes.apartment")}</option>
        <option value="house">{tProjects("objectTypes.house")}</option>
        <option value="office">{tProjects("objectTypes.office")}</option>
      </select>
      <input
        className={formControlClassName}
        min="1"
        name="areaM2"
        placeholder={tProjects("form.areaPlaceholder")}
        required
        step="0.1"
        type="number"
      />
      {state.errorKey ? (
        <p className="text-sm text-red-600">
          {state.errorKey === "invalidInput"
            ? tValidation("invalidProjectInput")
            : tValidation("unableCreateProject")}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button disabled={state.isSubmitting} type="submit">
          <Plus aria-hidden="true" className="h-4 w-4" />
          {state.isSubmitting
            ? tActions("creatingProject")
            : tActions("createProject")}
        </Button>
        <Button
          onClick={() => router.push("/dashboard/projects")}
          type="button"
          variant="secondary"
        >
          {tActions("cancel")}
        </Button>
      </div>
    </form>
  );
}
