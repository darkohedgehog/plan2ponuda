export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function toIsoDate(value: Date): string {
  return value.toISOString();
}
