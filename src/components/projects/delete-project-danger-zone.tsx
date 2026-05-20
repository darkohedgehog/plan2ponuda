"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import { useRouter } from "@/i18n/navigation";
import type { DeleteProjectResponse } from "@/types/project";

type DeleteProjectDangerZoneProps = {
  projectId: string;
  projectName: string;
};

type DeleteProjectStatus = "deleted" | "deleting" | "idle";

type DeleteProjectState = {
  confirmationName: string;
  errorKey: "failed" | null;
  isDialogOpen: boolean;
  status: DeleteProjectStatus;
};
type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

const initialState: DeleteProjectState = {
  confirmationName: "",
  errorKey: null,
  isDialogOpen: false,
  status: "idle",
};

export function DeleteProjectDangerZone({
  projectId,
  projectName,
}: DeleteProjectDangerZoneProps) {
  const router = useRouter();
  const t = useTranslations("Projects.delete");
  const [state, setState] = useState<DeleteProjectState>(initialState);
  const canDelete =
    state.confirmationName.trim() === projectName && state.status !== "deleting";

  function openDialog() {
    setState({
      confirmationName: "",
      errorKey: null,
      isDialogOpen: true,
      status: "idle",
    });
  }

  function closeDialog() {
    if (state.status === "deleting") {
      return;
    }

    setState(initialState);
  }

  async function handleDelete(event: FormSubmitEvent) {
    event.preventDefault();

    if (!canDelete) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      errorKey: null,
      status: "deleting",
    }));

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const payload = (await response
        .json()
        .catch((): null => null)) as DeleteProjectResponse | null;

      if (!response.ok || !payload?.ok) {
        setState((currentState) => ({
          ...currentState,
          errorKey: "failed",
          status: "idle",
        }));
        return;
      }
    } catch {
      setState((currentState) => ({
        ...currentState,
        errorKey: "failed",
        status: "idle",
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      errorKey: null,
      status: "deleted",
    }));
    router.push("/dashboard/projects");
    router.refresh();
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-red-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            {t("dangerZone")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-deep-twilight-950">
            {t("deleteProject")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-deep-twilight-700">
            {t("cannotBeUndone")}. {t("permanentWarning")}
          </p>
        </div>

        <Button
          className="w-full shrink-0 bg-red-600 text-white hover:bg-red-700 md:w-auto"
          onClick={openDialog}
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          {t("deleteProject")}
        </Button>
      </div>

      {state.isDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-twilight-950/45 p-4">
          <form
            aria-labelledby="delete-project-title"
            aria-modal="true"
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onSubmit={handleDelete}
            role="dialog"
          >
            <h2
              className="text-lg font-semibold text-deep-twilight-950"
              id="delete-project-title"
            >
              {t("deleteProject")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
              {t("cannotBeUndone")}. {t("permanentWarning")}
            </p>
            <label
              className="mt-4 block text-sm font-semibold text-deep-twilight-900"
              htmlFor="delete-project-confirmation"
            >
              {t("typeProjectNameToConfirm")}
            </label>
            <input
              autoComplete="off"
              className={`${formControlClassName} mt-2 w-full`}
              disabled={state.status === "deleting"}
              id="delete-project-confirmation"
              onChange={(event) =>
                setState((currentState) => ({
                  ...currentState,
                  confirmationName: event.target.value,
                }))
              }
              placeholder={projectName}
              type="text"
              value={state.confirmationName}
            />

            {state.errorKey ? (
              <p className="mt-3 text-sm text-red-600">{t(state.errorKey)}</p>
            ) : null}

            {state.status === "deleted" ? (
              <p className="mt-3 text-sm text-emerald-700">
                {t("projectDeleted")}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                disabled={state.status === "deleting"}
                onClick={closeDialog}
                type="button"
                variant="secondary"
              >
                {t("cancel")}
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={!canDelete}
                type="submit"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {state.status === "deleting"
                  ? t("deleting")
                  : t("deletePermanently")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
