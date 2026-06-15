export function getUploadContentLength(headers: Headers): number | null {
  const rawContentLength = headers.get("content-length");

  if (!rawContentLength) {
    return null;
  }

  const contentLength = Number(rawContentLength);

  if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
    return null;
  }

  return contentLength;
}

export function isUploadBodyTooLarge(
  headers: Headers,
  maxBodySizeBytes: number,
): boolean {
  const contentLength = getUploadContentLength(headers);

  return contentLength !== null && contentLength > maxBodySizeBytes;
}
