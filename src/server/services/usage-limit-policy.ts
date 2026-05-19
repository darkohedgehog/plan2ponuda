export function shouldCountFloorPlanUpload(
  existingSourceFilePath: string | null,
): boolean {
  return existingSourceFilePath === null;
}

export function shouldCountQuoteCreation(existingQuoteId: string | null): boolean {
  return existingQuoteId === null;
}
