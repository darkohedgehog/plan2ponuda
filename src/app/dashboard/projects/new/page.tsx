import { Button } from "@/components/ui/button";

export default function NewProjectPage() {
  return (
    <main className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-semibold">New project</h1>
      <p className="text-slate-600">
        Upload a private floor plan file to start an electrical quote.
      </p>
      <form className="flex flex-col gap-4">
        <input className="rounded-md border border-border p-3" type="file" />
        <Button type="submit">Create project</Button>
      </form>
    </main>
  );
}
