type ProjectStoragePathInput = {
  documentFilePaths?: string[];
  previewPath?: string | null;
  projectId: string;
  sourceFilePath?: string | null;
};

const MAX_DECODE_PASSES = 3;
const SAFE_STORAGE_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;

export function getExpectedProjectFilePrefix(projectId: string): string {
  return `projects/${projectId.trim()}/`;
}

function assertSafeStoragePathSegment(segment: string): string {
  const normalizedSegment = segment.trim();

  if (!SAFE_STORAGE_SEGMENT_PATTERN.test(normalizedSegment)) {
    throw new Error("Invalid storage path segment.");
  }

  return normalizedSegment;
}

export function buildProjectDocumentStoragePath(
  projectId: string,
  documentId: string,
): string {
  const safeProjectId = assertSafeStoragePathSegment(projectId);
  const safeDocumentId = assertSafeStoragePathSegment(documentId);

  return assertProjectOwnedStoragePath(
    safeProjectId,
    `projects/${safeProjectId}/documents/${safeDocumentId}/source.pdf`,
  );
}

export function getProjectDocumentStoragePathsToDelete(
  projectId: string,
  documentFilePaths: string[],
): string[] {
  return documentFilePaths.filter((filePath) =>
    isProjectOwnedStoragePath(projectId, filePath),
  );
}

export function getProjectStoragePathsToDelete({
  documentFilePaths = [],
  previewPath,
  projectId,
  sourceFilePath,
}: ProjectStoragePathInput): string[] {
  return Array.from(
    new Set(
      [
        sourceFilePath,
        previewPath,
        ...getProjectDocumentStoragePathsToDelete(projectId, documentFilePaths),
      ].filter((path): path is string =>
        isProjectOwnedStoragePath(projectId, path),
      ),
    ),
  );
}

export function assertProjectOwnedStoragePath(
  projectId: string,
  path: string | null | undefined,
): string {
  if (!isProjectOwnedStoragePath(projectId, path)) {
    throw new Error("Invalid project storage path.");
  }

  return path.trim();
}

export function isProjectOwnedStoragePath(
  projectId: string,
  path: string | null | undefined,
): path is string {
  const normalizedProjectId = projectId.trim();
  const normalizedPath = path?.trim();

  if (!normalizedProjectId || !normalizedPath) {
    return false;
  }

  const expectedPrefix = getExpectedProjectFilePrefix(normalizedProjectId);

  if (!normalizedPath.startsWith(expectedPrefix)) {
    return false;
  }

  if (normalizedPath.length <= expectedPrefix.length) {
    return false;
  }

  return !hasUnsafeStoragePathSyntax(normalizedPath);
}

// TODO(security): before production rollout, audit existing Project rows by
// checking sourceFilePath/previewPath with isProjectOwnedStoragePath(project.id, path).
function hasUnsafeStoragePathSyntax(path: string): boolean {
  const pathVariants = getDecodedPathVariants(path);

  if (!pathVariants) {
    return true;
  }

  return pathVariants.some(
    (pathVariant) =>
      pathVariant.startsWith("/") ||
      pathVariant.includes("://") ||
      pathVariant.includes("\\") ||
      hasRelativePathSegment(pathVariant),
  );
}

function getDecodedPathVariants(path: string): string[] | null {
  const variants = [path];
  let currentPath = path;

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    let decodedPath: string;

    try {
      decodedPath = decodeURIComponent(currentPath);
    } catch {
      return null;
    }

    if (decodedPath === currentPath) {
      break;
    }

    variants.push(decodedPath);
    currentPath = decodedPath;
  }

  return variants;
}

function hasRelativePathSegment(path: string): boolean {
  return path.split("/").some((segment) => segment === "." || segment === "..");
}
