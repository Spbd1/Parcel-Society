import { NextResponse, type NextRequest } from "next/server";

const REALM = "Parcel Society Admin";

const unauthorized = () =>
  new NextResponse("Admin credentials are required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });

const serverError = () =>
  new NextResponse("Admin authentication is not configured.", {
    status: 500,
    headers: { "Cache-Control": "no-store" },
  });

const parseBasicAuth = (header: string | null) => {
  if (!header?.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;
    return {
      email: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
};

const constantTimeEqual = (left: string, right: string) => {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
};

export function middleware(request: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return serverError();
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));
  if (
    !credentials ||
    !constantTimeEqual(credentials.email, adminEmail) ||
    !constantTimeEqual(credentials.password, adminPassword)
  ) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
