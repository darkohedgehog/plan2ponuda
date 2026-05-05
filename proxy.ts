import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { routing, type Locale } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function getPathLocale(pathname: string): Locale | null {
  const maybeLocale = pathname.split("/")[1];

  return hasLocale(routing.locales, maybeLocale) ? maybeLocale : null;
}

function stripLocalePrefix(pathname: string): string {
  const locale = getPathLocale(pathname);

  if (!locale) {
    return pathname;
  }

  const pathWithoutLocale = pathname.slice(locale.length + 1);

  return pathWithoutLocale || "/";
}

function isDashboardPath(pathname: string): boolean {
  const pathnameWithoutLocale = stripLocalePrefix(pathname);

  return (
    pathnameWithoutLocale === "/dashboard" ||
    pathnameWithoutLocale.startsWith("/dashboard/")
  );
}

function isRedirectResponse(response: NextResponse): boolean {
  return response.headers.has("location");
}

function getCallbackUrl(request: NextRequest, locale: Locale): string {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  if (getPathLocale(pathname)) {
    return `${pathname}${search}`;
  }

  return `/${locale}${pathname === "/" ? "" : pathname}${search}`;
}

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  if (isRedirectResponse(response) || !isDashboardPath(request.nextUrl.pathname)) {
    return response;
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.sub) {
    return response;
  }

  const locale = getPathLocale(request.nextUrl.pathname) ?? routing.defaultLocale;
  const signInUrl = new URL(`/${locale}/sign-in`, request.url);
  signInUrl.searchParams.set("callbackUrl", getCallbackUrl(request, locale));

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher:
    "/((?!api|trpc|_next|_vercel|assets|images|favicon.ico|sw.js|.*\\..*).*)",
};
