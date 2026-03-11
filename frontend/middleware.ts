import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/recorder/:path*",
    "/upload/:path*",
    "/transcript/:path*",
    "/search/:path*",
    "/folders/:path*",
    "/settings/:path*",
  ],
};
