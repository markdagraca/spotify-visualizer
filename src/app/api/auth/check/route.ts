import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookiesList = cookies()
    const hasToken = (await cookiesList).has("spotify_access_token")

    return NextResponse.json({
      authenticated: hasToken,
    })
  } catch (error) {
    console.error("Error checking authentication:", error)
    return NextResponse.json({
      authenticated: false,
      error: "Failed to check authentication",
    })
  }
} 