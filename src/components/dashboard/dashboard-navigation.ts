export type DashboardIconName =
  | "dashboard"
  | "folder"
  | "materials"
  | "quotes"
  | "settings";

export type DashboardNavigationItem = {
  href: string;
  icon: DashboardIconName;
  label: string;
};

export type DashboardPageHeader = {
  matcher: (pathname: string) => boolean;
  title: string;
  subtitle: string;
};

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  {
    href: "/dashboard",
    icon: "dashboard",
    label: "Dashboard",
  },
  {
    href: "/dashboard/projects",
    icon: "folder",
    label: "Projects",
  },
  {
    href: "/dashboard/materials",
    icon: "materials",
    label: "Materials",
  },
  {
    href: "/dashboard/quotes",
    icon: "quotes",
    label: "Quotes",
  },
  {
    href: "/dashboard/settings",
    icon: "settings",
    label: "Settings",
  },
];

export const dashboardPageHeaders: DashboardPageHeader[] = [
  {
    matcher: (pathname) => pathname === "/dashboard",
    title: "Dashboard",
    subtitle: "Overview of recent projects and quote activity.",
  },
  {
    matcher: (pathname) => pathname === "/dashboard/projects/new",
    title: "New project",
    subtitle: "Create a project container before uploading a floor plan.",
  },
  {
    matcher: (pathname) => pathname.endsWith("/review"),
    title: "Review rooms",
    subtitle: "Confirm detected spaces before generating material suggestions.",
  },
  {
    matcher: (pathname) => pathname.endsWith("/quote"),
    title: "Quote",
    subtitle: "Review quote totals and export-ready project details.",
  },
  {
    matcher: (pathname) =>
      pathname.startsWith("/dashboard/projects/") &&
      !pathname.endsWith("/review") &&
      !pathname.endsWith("/quote"),
    title: "Project workspace",
    subtitle: "Manage plan upload, analysis status, and quote workflow.",
  },
  {
    matcher: (pathname) => pathname === "/dashboard/projects",
    title: "Projects",
    subtitle: "Manage floor-plan projects and installation estimates.",
  },
  {
    matcher: (pathname) => pathname === "/dashboard/materials",
    title: "Materials",
    subtitle: "Reusable material catalog and pricing tools.",
  },
  {
    matcher: (pathname) => pathname === "/dashboard/quotes",
    title: "Quotes",
    subtitle: "Generated quote snapshots and export history.",
  },
  {
    matcher: (pathname) => pathname === "/dashboard/settings",
    title: "Settings",
    subtitle: "Account, company, and estimating preferences.",
  },
];

export function getDashboardPageHeader(pathname: string): DashboardPageHeader {
  return (
    dashboardPageHeaders.find((pageHeader) => pageHeader.matcher(pathname)) ??
    dashboardPageHeaders[0]
  );
}

export function isDashboardNavigationItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
