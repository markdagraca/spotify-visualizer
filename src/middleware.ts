import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("spotify_access_token")
  const { pathname } = request.nextUrl

  // If trying to access visualizer without token, redirect to home
  if (pathname.startsWith("/visualizer") && !token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If accessing home with token, redirect to visualizer
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/visualizer", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/visualizer"]
} 