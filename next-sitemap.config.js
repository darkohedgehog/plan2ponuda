const LOCAL_SITE_URL = "http://localhost:3000";

const locales = ["hr", "sr", "en", "de", "sl"];

const publicSlugs = [
  "",
  "pricing",
  "privacy",
  "terms",
  "cookies",
  "complaints",
  "contact",
];

const privateExclusions = [
  "/api/*",
  "/api/auth/*",
  "/dashboard/*",
  "/*/dashboard/*",
  "/*/dashboard/admin/*",
  "/*/dashboard/billing/*",
  "/*/dashboard/projects/*",
  "/*/dashboard/quotes/*",
  "/sign-in",
  "/*/sign-in",
  "/sign-up",
  "/*/sign-up",
  "/forgot-password",
  "/*/forgot-password",
  "/reset-password",
  "/*/reset-password",
  "/verify-email",
  "/*/verify-email",
];

function normalizeSiteUrl(value) {
  const parsedUrl = new URL(value);

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  return parsedUrl.origin;
}

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return normalizeSiteUrl(configuredUrl);
  }

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL_ENV !== "production"
  ) {
    return LOCAL_SITE_URL;
  }

  throw new Error("NEXT_PUBLIC_SITE_URL must be set to an absolute URL.");
}

function getLocalizedPath(locale, slug) {
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

function getSlugFromPath(path) {
  const normalizedPath = path.replace(/\/$/, "");
  const match = normalizedPath.match(/^\/(hr|sr|en|de|sl)(?:\/(.+))?$/);

  if (!match) {
    return null;
  }

  const slug = match[2] ?? "";

  return publicSlugs.includes(slug) ? slug : null;
}

function getRouteSeoOptions(slug) {
  if (slug === "") {
    return { changefreq: "weekly", priority: 1.0 };
  }

  if (slug === "pricing") {
    return { changefreq: "weekly", priority: 0.8 };
  }

  if (slug === "contact" || slug === "complaints") {
    return { changefreq: "monthly", priority: 0.6 };
  }

  return { changefreq: "yearly", priority: 0.4 };
}

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: getSiteUrl(),
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  sitemapSize: 5000,
  changefreq: "weekly",
  priority: 0.7,
  exclude: privateExclusions,
  transform: async (config, path) => {
    const slug = getSlugFromPath(path);

    if (slug === null) {
      return null;
    }

    const routeSeoOptions = getRouteSeoOptions(slug);

    return {
      loc: path.replace(/\/$/, ""),
      changefreq: routeSeoOptions.changefreq,
      priority: routeSeoOptions.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
  additionalPaths: async (config) =>
    locales.flatMap((locale) =>
      publicSlugs.map((slug) => {
        const routeSeoOptions = getRouteSeoOptions(slug);

        return {
          loc: getLocalizedPath(locale, slug),
          changefreq: routeSeoOptions.changefreq,
          priority: routeSeoOptions.priority,
          lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
        };
      }),
    ),
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/api/auth/",
          "/dashboard/",
          "/*/dashboard/",
          "/*/dashboard/*",
          "/*/dashboard/admin/",
          "/*/dashboard/billing/",
          "/*/dashboard/projects/",
          "/*/dashboard/quotes/",
          "/sign-in",
          "/*/sign-in",
          "/sign-up",
          "/*/sign-up",
          "/forgot-password",
          "/*/forgot-password",
          "/reset-password",
          "/*/reset-password",
          "/verify-email",
          "/*/verify-email",
        ],
      },
    ],
  },
};

module.exports = config;
