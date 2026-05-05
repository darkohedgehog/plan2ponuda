export { proxy } from "../proxy";

export const config = {
  matcher:
    "/((?!api|trpc|_next|_vercel|assets|images|favicon.ico|sw.js|.*\\..*).*)",
};
