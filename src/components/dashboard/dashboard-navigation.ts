export type DashboardIconName =
  | "dashboard"
  | "folder"
  | "materials"
  | "quotes"
  | "settings";

export type DashboardNavigationItem = {
  href: string;
  icon: DashboardIconName;
  labelKey: DashboardNavigationLabelKey;
};

export type DashboardNavigationLabelKey =
  | "dashboard"
  | "materials"
  | "projects"
  | "quotes"
  | "settings";

export type DashboardPageHeader = {
  id: DashboardPageHeaderId;
  matcher: (pathname: string) => boolean;
};

export type DashboardPageHeaderId =
  | "materials"
  | "newProject"
  | "overview"
  | "projectWorkspace"
  | "projects"
  | "quote"
  | "quotes"
  | "reviewRooms"
  | "settings";

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  {
    href: "/dashboard",
    icon: "dashboard",
    labelKey: "dashboard",
  },
  {
    href: "/dashboard/projects",
    icon: "folder",
    labelKey: "projects",
  },
  {
    href: "/dashboard/materials",
    icon: "materials",
    labelKey: "materials",
  },
  {
    href: "/dashboard/quotes",
    icon: "quotes",
    labelKey: "quotes",
  },
  {
    href: "/dashboard/settings",
    icon: "settings",
    labelKey: "settings",
  },
];

export const dashboardPageHeaders: DashboardPageHeader[] = [
  {
    id: "overview",
    matcher: (pathname) => pathname === "/dashboard",
  },
  {
    id: "newProject",
    matcher: (pathname) => pathname === "/dashboard/projects/new",
  },
  {
    id: "reviewRooms",
    matcher: (pathname) => pathname.endsWith("/review"),
  },
  {
    id: "quote",
    matcher: (pathname) => pathname.endsWith("/quote"),
  },
  {
    id: "projectWorkspace",
    matcher: (pathname) =>
      pathname.startsWith("/dashboard/projects/") &&
      !pathname.endsWith("/review") &&
      !pathname.endsWith("/quote"),
  },
  {
    id: "projects",
    matcher: (pathname) => pathname === "/dashboard/projects",
  },
  {
    id: "materials",
    matcher: (pathname) => pathname === "/dashboard/materials",
  },
  {
    id: "quotes",
    matcher: (pathname) => pathname === "/dashboard/quotes",
  },
  {
    id: "settings",
    matcher: (pathname) => pathname === "/dashboard/settings",
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
