import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";

const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["ADMIN", "ATTENDANT", "KITCHEN", "DELIVERY_DRIVER"],
  "/admin/produtos": ["ADMIN"],
  "/admin/categorias": ["ADMIN"],
  "/admin/adicionais": ["ADMIN"],
  "/admin/entregadores": ["ADMIN"],
  "/admin/estoque": ["ADMIN"],
  "/admin/configuracoes": ["ADMIN"],
  "/pdv": ["ADMIN", "ATTENDANT"],
  "/cozinha": ["ADMIN", "ATTENDANT", "KITCHEN"],
};

function matchesPath(pathname: string, pattern: string): boolean {
  if (pathname === pattern) return true;
  return pathname.startsWith(`${pattern}/`);
}

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  console.log(`🔍 Middleware: ${pathname} - Session: ${session ? 'EXISTS' : 'NULL'}`);
  if (session?.user) {
    console.log(`👤 User: ${session.user.email} - Role: ${session.user.role}`);
  }

  // Permitir rotas públicas do NextAuth
  if (pathname.startsWith("/api/auth/signin") || 
      pathname.startsWith("/api/auth/callback") ||
      pathname.startsWith("/api/auth/session") ||
      pathname.startsWith("/api/auth/providers") ||
      pathname.startsWith("/api/auth/error")) {
    console.log(`✅ Middleware: Public NextAuth route allowed`);
    return NextResponse.next();
  }

  const isApiInternal = pathname.startsWith("/api/admin");
  const isWebhookPublic = pathname.startsWith("/api/webhooks");

  if (pathname.startsWith("/api") && !isApiInternal && !isWebhookPublic) {
    return NextResponse.next();
  }

  if (isWebhookPublic) {
    return NextResponse.next();
  }

  let requiredRoles: UserRole[] | null = null;
  for (const [pattern, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (matchesPath(pathname, pattern)) {
      requiredRoles = roles;
      break;
    }
  }

  if (isApiInternal) {
    requiredRoles = ["ADMIN", "ATTENDANT", "KITCHEN", "DELIVERY_DRIVER"];
  }

  if (!requiredRoles) {
    return NextResponse.next();
  }

  if (!session?.user) {
    console.log(`❌ Middleware: No session, redirecting to login`);
    const url = new URL("/login", request.url);
    if (!pathname.startsWith("/api")) {
      url.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(url);
  }

  const hasRole = requiredRoles.includes(session.user.role);
  if (!hasRole) {
    console.log(`❌ Middleware: User role ${session.user.role} not in ${requiredRoles}`);
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  console.log(`✅ Middleware: Access granted for ${session.user.email}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|images).*)",
  ],
};
