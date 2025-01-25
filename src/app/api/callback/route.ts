import { NextResponse } from "next/server"
import { getAccessToken } from "@/lib/spotify"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    console.error("Spotify auth error:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 })
  }

  try {
    const accessToken = await getAccessToken(code)
    if (!accessToken) {
      throw new Error("Access token is undefined")
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL("/visualizer", request.url))

    // Set the access token in a secure cookie
    response.cookies.set("spotify_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error getting access token:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}

