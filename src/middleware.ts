import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Paths that don't require authentication
  const isPublicPath = path === "/api/login" || path === "/api/callback"

  // Check if user is authenticated
  const token = request.cookies.get("spotify_access_token")
  const isAuthenticated = !!token

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/api/login", request.url))
  }

  // Allow authenticated users to access protected routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/visualizer/:path*",
    "/api/auth/:path*",
    "/api/spotify/:path*",
  ],
} 