import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPortalRoutes = new Set([
  "/partner/login",
  "/partner/register",
  "/customer/login",
  "/customer/register",
]);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  if (publicPortalRoutes.has(pathname)) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const portal = pathname.startsWith("/partner") ? "partner" : "customer";
    const login = request.nextUrl.clone();
    login.pathname = `/${portal}/login`;
    login.search = "";
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/partner/:path*", "/customer/:path*"],
};
