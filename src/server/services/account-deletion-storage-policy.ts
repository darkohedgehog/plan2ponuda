import { getProjectStoragePathsToDelete } from "./project-storage-paths";

export type AccountDeletionProject = {
  documents: {
    filePath: string;
  }[];
  id: string;
  previewPath: string | null;
  sourceFilePath: string | null;
};

export function collectAccountDeletionStoragePaths(
  projects: AccountDeletionProject[],
): string[] {
  return Array.from(
    new Set(
      projects.flatMap((project) =>
        getProjectStoragePathsToDelete({
          documentFilePaths: project.documents.map(
            (document) => document.filePath,
          ),
          previewPath: project.previewPath,
          projectId: project.id,
          sourceFilePath: project.sourceFilePath,
        }),
      ),
    ),
  );
}
