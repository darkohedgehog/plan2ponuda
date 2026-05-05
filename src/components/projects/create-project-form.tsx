"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import { useRouter } from "@/i18n/navigation";
import type { CreateProjectResponse, ObjectType } from "@/types/project";

type CreateProjectFormState = {
  error: string | null;
  isSubmitting: boolean;
};

export function CreateProjectForm() {
  const router = useRouter();
  const [state, setState] = useState<CreateProjectFormState>({
    error: null,
    isSubmitting: false,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ error: null, isSubmitting: true });

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
      const message =
        "error" in payload ? payload.error.message : "Unable to create project.";
      setState({ error: message, isSubmitting: false });
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
        placeholder="Project name"
        required
        type="text"
      />
      <input
        className={formControlClassName}
        name="clientName"
        placeholder="Client name"
        type="text"
      />
      <select
        className={formControlClassName}
        defaultValue="apartment"
        name="objectType"
      >
        <option value="apartment">Apartment</option>
        <option value="house">House</option>
        <option value="office">Office</option>
      </select>
      <input
        className={formControlClassName}
        min="1"
        name="areaM2"
        placeholder="Area in m2"
        required
        step="0.1"
        type="number"
      />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div className="flex gap-3">
        <Button disabled={state.isSubmitting} type="submit">
          {state.isSubmitting ? "Creating..." : "Create project"}
        </Button>
        <Button
          onClick={() => router.push("/dashboard/projects")}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
