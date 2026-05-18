import { defaultLocale, resolveLocale, type Locale } from "@/i18n/routing";

export function getLocaleFromRequest(request: Request): Locale {
  const referer = request.headers.get("referer");

  if (!referer) {
    return defaultLocale;
  }

  try {
    const refererUrl = new URL(referer);
    return resolveLocale(refererUrl.pathname.split("/")[1]);
  } catch {
    return defaultLocale;
  }
}
