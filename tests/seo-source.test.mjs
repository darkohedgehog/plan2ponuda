import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);

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

const expectedPublicRoutes = locales
  .flatMap((locale) =>
    publicSlugs.map((slug) => (slug ? `/${locale}/${slug}` : `/${locale}`)),
  )
  .sort();

const expectedPrivateExclusions = [
  "/api/*",
  "/dashboard/*",
  "/*/dashboard/*",
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

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readMessages(locale) {
  return JSON.parse(readSource(`messages/${locale}.json`));
}

function flattenKeys(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.keys(value).flatMap((key) =>
    flattenKeys(value[key], prefix ? `${prefix}.${key}` : key),
  );
}

function loadSitemapConfig() {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ploro.example";
  const configPath = require.resolve("../next-sitemap.config.js");
  delete require.cache[configPath];

  return require(configPath);
}

test("next-sitemap config includes localized public routes and excludes private routes", async () => {
  const config = loadSitemapConfig();

  assert.equal(config.siteUrl, "https://ploro.example");
  assert.equal(config.generateRobotsTxt, true);
  assert.equal(config.generateIndexSitemap, false);
  assert.ok(config.sitemapSize >= 1000);

  for (const pattern of expectedPrivateExclusions) {
    assert.ok(
      config.exclude.includes(pattern),
      `missing private exclusion: ${pattern}`,
    );
  }

  const paths = await config.additionalPaths(config);
  const locs = paths.map((path) => path.loc).sort();

  assert.deepEqual(locs, expectedPublicRoutes);

  for (const path of paths) {
    assert.equal(path.alternateRefs, undefined);
  }
});

test("next-sitemap transform keeps only localized public routes", async () => {
  const config = loadSitemapConfig();

  assert.equal((await config.transform(config, "/hr/pricing")).loc, "/hr/pricing");
  assert.equal(await config.transform(config, "/api/auth/session"), null);
  assert.equal(await config.transform(config, "/hr/dashboard"), null);
  assert.equal(await config.transform(config, "/hr/sign-in"), null);
  assert.equal(await config.transform(config, "/en/reset-password"), null);
});

test("robots policy disallows private, API, auth, and dashboard areas", () => {
  const config = loadSitemapConfig();
  const policy = config.robotsTxtOptions.policies.find(
    (item) => item.userAgent === "*",
  );

  assert.equal(policy.allow, "/");

  for (const pattern of expectedPrivateExclusions) {
    assert.ok(
      policy.disallow.includes(pattern.replace("*", "")) ||
        policy.disallow.includes(pattern),
      `robots policy missing ${pattern}`,
    );
  }
});

test("public metadata helper uses site URL, canonical, hreflang, Open Graph, and Twitter metadata", () => {
  const helper = readSource("src/lib/seo/metadata.ts");
  const publicPages = [
    "src/app/[locale]/(marketing)/page.tsx",
    "src/app/[locale]/(marketing)/pricing/page.tsx",
    "src/app/[locale]/(marketing)/privacy/page.tsx",
    "src/app/[locale]/(marketing)/terms/page.tsx",
    "src/app/[locale]/(marketing)/cookies/page.tsx",
    "src/app/[locale]/(marketing)/complaints/page.tsx",
    "src/app/[locale]/(marketing)/contact/page.tsx",
  ];

  assert.match(helper, /NEXT_PUBLIC_SITE_URL/);
  assert.match(helper, /metadataBase/);
  assert.match(helper, /alternates/);
  assert.match(helper, /canonical/);
  assert.match(helper, /languages/);
  assert.match(helper, /"x-default"/);
  assert.match(helper, /openGraph/);
  assert.match(helper, /twitter/);
  assert.match(helper, /\/og-image\.png/);
  assert.match(
    helper,
    /imageUrl\s*=\s*getAbsoluteUrl\(DEFAULT_OG_IMAGE_PATH,\s*siteUrl\)/,
  );
  assert.match(helper, /width:\s*1200/);
  assert.match(helper, /height:\s*630/);
  assert.match(
    helper,
    /DEFAULT_OG_IMAGE_ALT\s*=\s*"PloroAI - AI electrical quote software"/,
  );
  assert.match(helper, /alt:\s*DEFAULT_OG_IMAGE_ALT/);
  assert.match(helper, /openGraph:\s*{[\s\S]*images:/);
  assert.match(helper, /twitter:\s*{[\s\S]*images:/);

  for (const page of publicPages) {
    assert.match(
      readSource(page),
      /buildPublicPageMetadata/,
      `${page} should use the shared public metadata helper`,
    );
  }
});

test("app manifest uses existing public icons and locale-neutral app metadata", () => {
  const manifest = readSource("src/app/manifest.ts");
  const localeLayout = readSource("src/app/[locale]/layout.tsx");
  const expectedIconPaths = [
    "/icon/android-chrome-192x192.png",
    "/icon/android-chrome-512x512.png",
    "/icon/maskable-512x512.png",
  ];

  assert.match(manifest, /MetadataRoute\.Manifest/);
  assert.match(manifest, /name:\s*"PloroAI"/);
  assert.match(manifest, /short_name:\s*"PloroAI"/);
  assert.match(
    manifest,
    /description:\s*"AI-assisted electrical quotes from floor plans and project documentation\."/,
  );
  assert.match(manifest, /start_url:\s*"\/hr"/);
  assert.match(manifest, /scope:\s*"\/"/);
  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /background_color:\s*"#010223"/);
  assert.match(manifest, /theme_color:\s*"#080cf7"/);
  assert.match(manifest, /categories:\s*\[/);
  assert.match(manifest, /"business"/);
  assert.match(manifest, /"productivity"/);
  assert.match(manifest, /"utilities"/);
  assert.doesNotMatch(manifest, /serviceWorker|sw\.js|offline/i);

  for (const iconPath of expectedIconPaths) {
    assert.match(manifest, new RegExp(`src:\\s*"${iconPath}"`));
    assert.equal(
      existsSync(new URL(`../public${iconPath}`, import.meta.url)),
      true,
      `${iconPath} should exist`,
    );
  }

  assert.match(manifest, /sizes:\s*"192x192"/);
  assert.match(manifest, /sizes:\s*"512x512"/);
  assert.match(manifest, /purpose:\s*"any"/);
  assert.match(
    manifest,
    /src:\s*"\/icon\/maskable-512x512\.png"[\s\S]*sizes:\s*"512x512"[\s\S]*type:\s*"image\/png"[\s\S]*purpose:\s*"maskable"/,
  );
  assert.match(localeLayout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(localeLayout, /apple:\s*"\/icon\/apple-touch-icon\.png"/);
  assert.match(localeLayout, /\/icon\/favicon-16x16\.png/);
  assert.match(localeLayout, /\/icon\/favicon-32x32\.png/);
});

test("footer exposes root sitemap link and translations are present in every locale", () => {
  const footer = readSource("src/components/marketing/public-footer.tsx");
  const referenceKeys = flattenKeys(readMessages("en").Footer.links).sort();

  assert.match(footer, /href: "\/sitemap\.xml"/);
  assert.match(footer, /labelKey: "sitemap"/);

  for (const locale of locales) {
    const footerLinks = readMessages(locale).Footer.links;
    const keys = flattenKeys(footerLinks).sort();

    assert.deepEqual(keys, referenceKeys, `${locale} footer link key mismatch`);
    assert.equal(footerLinks.sitemap, "Sitemap");
  }

  assert.doesNotMatch(JSON.stringify(readMessages("sr").Footer), /[\u0400-\u04ff]/);
});
