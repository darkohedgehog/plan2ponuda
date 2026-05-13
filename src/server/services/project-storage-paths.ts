type ProjectStoragePathInput = {
  previewPath?: string | null;
  projectId: string;
  sourceFilePath?: string | null;
};

export function getProjectStoragePathsToDelete({
  previewPath,
  projectId,
  sourceFilePath,
}: ProjectStoragePathInput): string[] {
  return Array.from(
    new Set(
      [sourceFilePath, previewPath].filter((path): path is string =>
        isProjectOwnedStoragePath(path, projectId),
      ),
    ),
  );
}

function isProjectOwnedStoragePath(
  path: string | null | undefined,
  projectId: string,
): path is string {
  const normalizedPath = path?.trim();

  if (!normalizedPath) {
    return false;
  }

  if (
    normalizedPath.startsWith("/") ||
    normalizedPath.includes("://") ||
    hasRelativePathSegment(normalizedPath)
  ) {
    return false;
  }

  return normalizedPath.startsWith(`projects/${projectId}/`);
}

function hasRelativePathSegment(path: string): boolean {
  return path.split("/").some((segment) => segment === "." || segment === "..");
}
