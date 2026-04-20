export type ProjectStatus = "draft" | "analyzing" | "review" | "quoted";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  planFileKey?: string;
  createdAt: Date;
  updatedAt: Date;
};
