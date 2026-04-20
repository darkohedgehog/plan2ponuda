type ProjectCardProps = {
  name: string;
  status: string;
};

export function ProjectCard({ name, status }: ProjectCardProps) {
  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <h3 className="text-base font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-slate-600">{status}</p>
    </article>
  );
}
